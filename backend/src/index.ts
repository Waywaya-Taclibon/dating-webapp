import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import Notification from "./models/Notification";
import Message from "./models/Message";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { requireAuthMiddleware } from "./middleware/requireAuth";
import { applySecurityHeaders, apiLimiter, writeLimiter } from "./lib/security";
import { getClerkProfile } from "./lib/clerkUsers";

dotenv.config();

const app: Express = express();
const server = createServer(app);

// ✅ Use Render’s assigned port (or default to 10000)
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 10000;

// ✅ Allowed CORS Origins (no trailing slashes!) — extend via FRONTEND_URL env
const allowedOrigins = [
  "http://localhost:5173", // Local dev
  "https://dopawink.vercel.app", // Frontend (Vercel)
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// ✅ Apply Express Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// ✅ Security headers + throttling (trust proxy set inside for Render)
applySecurityHeaders(app);

// ✅ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // fallback-safe
  allowEIO3: true,
});

// ✅ Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined! Check Render env vars / .env");
} else {
  // Mask password for safe logging
  console.log("🔌 Connecting with URI:", MONGO_URI.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:<hidden>@"));
}

mongoose.set("bufferTimeoutMS", 10000);

mongoose
  .connect(MONGO_URI as string, {
    // Use MONGO_DB_NAME if set, otherwise use whatever db is in the URI.
    // Your old data is in `test`, so keep default as `test` — don't use "dopawink".
    ...(process.env.MONGO_DB_NAME
      ? { dbName: process.env.MONGO_DB_NAME }
      : {}),
    retryWrites: true,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("✅ CONNECTED TO MONGODB!"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err?.message || err);
    console.error("👉 Check: 1) Atlas cluster unpaused 2) Network Access 0.0.0.0/0 3) DB user password 4) MONGO_URI includes db name");
  });

mongoose.connection.on("connected", () => console.log("🟢 Mongoose connected"));
mongoose.connection.on("error", (err) => console.error("🔴 Mongoose error:", err));
mongoose.connection.on("disconnected", () => console.warn("🟡 Mongoose disconnected"));

// ✅ Public health check — must be BEFORE auth middleware
app.get("/api/health", (req, res) => {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  res.json({
    status: "ok",
    mongoState: states[mongoose.connection.readyState] || "unknown",
    mongoReady: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Routes — all /api routes require a valid Clerk session JWT
// Strict throttle first (must run before routers), then general throttle + auth.
app.use("/api/swipe", writeLimiter);
app.use("/api/messages/send", writeLimiter);
app.use("/api/reset/state", writeLimiter);
app.use("/api", apiLimiter, requireAuthMiddleware, userRoutes);
app.use("/api/messages", apiLimiter, requireAuthMiddleware, messageRoutes);
app.use("/api/notifications", apiLimiter, requireAuthMiddleware, notificationRoutes);

app.get("/", (req, res) => {
  res.send("🚀 DopaWink Backend is running and ready for WebSockets!");
});

// 🧠 SOCKET.IO LOGIC — authenticated via Clerk session token
// Client must connect with: io(url, { auth: { token: await getToken() } })
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized: missing token"));
    const claims: any = await clerkClient.verifyToken(token);
    const userId = claims?.sub || claims?.userId;
    if (!userId) return next(new Error("Unauthorized: invalid token"));
    socket.data.userId = userId as string;
    next();
  } catch (err) {
    console.error("❌ Socket auth failed:", (err as Error)?.message || err);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const authId = socket.data.userId as string;
  console.log("🟢 User connected:", socket.id, "as", authId);

  socket.on("join_room", (userId: string) => {
    // Only allow joining your own room — prevents eavesdropping
    if (userId !== authId) {
      console.warn(`⛔ ${authId} tried to join room ${userId}`);
      return;
    }
    socket.join(userId);
    console.log(`👤 User ${userId} joined their private room`);
  });

  // ✅ Handle Sending Messages — persist first, then emit (single source of truth)
  socket.on("send_message", async (data: any) => {
    try {
      const { receiverId, message } = data || {};
      const senderId = authId; // never trust client senderId
      if (!receiverId || typeof message !== "string" || !message.trim()) return;
      if (message.length > 2000) return;

      const chatId = [senderId, receiverId].sort().join("_");
      const saved = await Message.create({
        chatId,
        senderId,
        receiverId,
        message: message.trim(),
      });

      const payload = {
        _id: saved._id,
        chatId,
        senderId,
        receiverId,
        message: saved.message,
        timestamp: saved.get("timestamp"),
      };
      io.to(receiverId).emit("receive_message", payload);
      // echo back to sender so all devices stay in sync
      socket.emit("receive_message", payload);

      // ✅ Sender name via cached batch lookup (non-fatal)
      const { name: senderName } = await getClerkProfile(senderId);

      // ✅ Create + emit notification
      const notification = await Notification.create({
        userId: receiverId,
        title: "New Message 💬",
        message: `You have a new message from ${senderName}`,
        type: "message",
      });

      io.to(receiverId).emit("new_notification", notification);
    } catch (err) {
      console.error("❌ send_message failed:", err);
      socket.emit("send_message_error", { message: "Failed to send message" });
    }
  });

  // ✅ Typing Indicator — sender is always the authed user
  socket.on("typing", (data: any) => {
    if (!data?.receiverId) return;
    io.to(data.receiverId).emit("user_typing", { senderId: authId });
  });

  socket.on("stop_typing", (data: any) => {
    if (!data?.receiverId) return;
    io.to(data.receiverId).emit("user_stop_typing", { senderId: authId });
  });

  // ✅ Match Notifications
  socket.on("new_match", async (data: any) => {
    try {
      const { userB, userAName, userBName } = data || {};
      const userA = authId; // caller must be a participant
      if (!userB || userB === userA) return;

      const notifA = await Notification.create({
        userId: userA,
        title: "It's a Match! 💖",
        message: `You matched with ${String(userBName || "someone").slice(0, 100)}!`,
        type: "match",
      });

      const notifB = await Notification.create({
        userId: userB,
        title: "It's a Match! 💖",
        message: `You matched with ${String(userAName || "someone").slice(0, 100)}!`,
        type: "match",
      });

      io.to(userA).emit("new_notification", notifA);
      io.to(userB).emit("new_notification", notifB);
    } catch (err) {
      console.error("❌ new_match failed:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// ✅ Start server
server.listen(port, host, () => {
  console.log(`✅ Server listening on http://${host}:${port}`);
});
