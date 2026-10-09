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
import { clerkClient } from "@clerk/clerk-sdk-node";

dotenv.config();

const app: Express = express();
const server = createServer(app);

// ✅ Use Render’s assigned port (or default to 10000)
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 10000;

// ✅ Allowed CORS Origins (no trailing slashes!)
const allowedOrigins = [
  "http://localhost:5173",        // Local dev
  "https://dopawink.vercel.app",  // Frontend (Vercel)
  "https://dopawink.onrender.com" // Backend (self-reference)
];

// ✅ Apply Express Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ WebSocket-friendly headers (Render proxy sometimes needs these)
app.use((req, res, next) => {
  res.setHeader("Connection", "keep-alive, Upgrade");
  res.setHeader("Upgrade", "websocket");
  next();
});

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

// ✅ Routes
app.use("/api", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("🚀 DopaWink Backend is running and ready for WebSockets!");
});

// ✅ Health check — use this to verify DB on Render: GET /api/health
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
    hasMongoUri: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString(),
  });
});

// 🧠 SOCKET.IO LOGIC
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_room", (userId: string) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their private room`);
  });

  // ✅ Handle Sending Messages
  socket.on("send_message", async (data: any) => {
    const { senderId, receiverId, message } = data;
    console.log(`📨 ${senderId} ➜ ${receiverId}: ${message}`);

    io.to(receiverId).emit("receive_message", data);

    // ✅ Fetch sender’s name from Clerk
    let senderName = "Someone";
    try {
      const sender = await clerkClient.users.getUser(senderId);
      senderName =
        `${sender.firstName || ""} ${sender.lastName || ""}`.trim() ||
        sender.username ||
        "Someone";
    } catch (err) {
      console.error("⚠️ Clerk lookup failed:", err);
    }

    // ✅ Create + emit notification
    const notification = await Notification.create({
      userId: receiverId,
      title: "New Message 💬",
      message: `You have a new message from ${senderName}`,
      type: "message",
    });

    io.to(receiverId).emit("new_notification", notification);
  });

  // ✅ Typing Indicator
  socket.on("typing", (data: any) => {
    io.to(data.receiverId).emit("user_typing", { senderId: data.senderId });
  });

  socket.on("stop_typing", (data: any) => {
    io.to(data.receiverId).emit("user_stop_typing", { senderId: data.senderId });
  });

  // ✅ Match Notifications
  socket.on("new_match", async (data: any) => {
    const { userA, userB, userAName, userBName } = data;

    const notifA = await Notification.create({
      userId: userA,
      title: "It's a Match! 💖",
      message: `You matched with ${userBName}!`,
      type: "match",
    });

    const notifB = await Notification.create({
      userId: userB,
      title: "It's a Match! 💖",
      message: `You matched with ${userAName}!`,
      type: "match",
    });

    io.to(userA).emit("new_notification", notifA);
    io.to(userB).emit("new_notification", notifB);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// ✅ Start server
server.listen(port, host, () => {
  console.log(`✅ Server listening on http://${host}:${port}`);
});
