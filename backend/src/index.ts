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
const port = process.env.PORT || 3001;

// ✅ Determine allowed origins dynamically
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://dopawink.vercel.app/", // replace with your actual frontend URL
];

// ✅ Express CORS setup
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Setup Socket.IO with same CORS config
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ MongoDB connection
const mongoURI = process.env.MONGO_URI!;
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ CONNECTED TO MONGODB!"))
  .catch((err) => console.error("❌ Failed to connect to MongoDB:", err));

// ✅ Routes
app.use("/api", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("🚀 DopaWink Backend is running!");
});

// 🧠 SOCKET.IO LOGIC
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_room", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // ✅ Handle sending messages
  socket.on("send_message", async (data: any) => {
    const { senderId, receiverId, message } = data;
    console.log(`📨 Message sent from ${senderId} to ${receiverId}: ${message}`);

    io.to(receiverId).emit("receive_message", data);

    // ✅ Fetch sender's name from Clerk
    let senderName = "Someone";
    try {
      const sender = await clerkClient.users.getUser(senderId);
      senderName =
        `${sender.firstName || ""} ${sender.lastName || ""}`.trim() ||
        sender.username ||
        "Someone";
    } catch (error) {
      console.error("⚠️ Failed to fetch sender name from Clerk:", error);
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

  // ✅ Typing indicator logic
  socket.on("typing", (data: any) => {
    const { receiverId, senderId } = data;
    io.to(receiverId).emit("user_typing", { senderId });
  });

  socket.on("stop_typing", (data: any) => {
    const { receiverId, senderId } = data;
    io.to(receiverId).emit("user_stop_typing", { senderId });
  });

  // ✅ New match notifications
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
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
