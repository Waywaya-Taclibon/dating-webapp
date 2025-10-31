"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const Notification_1 = __importDefault(require("./models/Notification"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const port = process.env.PORT || 3001;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const mongoURI = process.env.MONGO_URI;
mongoose_1.default
    .connect(mongoURI)
    .then(() => console.log("✅ CONNECTED TO MONGODB!"))
    .catch((err) => console.error("❌ Failed to connect to MongoDB:", err));
app.use("/api", userRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.get("/", (req, res) => {
    res.send("🚀 DopaWink Backend is running!");
});
io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    socket.on("join_room", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
    });
    socket.on("send_message", async (data) => {
        const { senderId, receiverId, message } = data;
        console.log(`📨 Message sent from ${senderId} to ${receiverId}: ${message}`);
        io.to(receiverId).emit("receive_message", data);
        let senderName = "Someone";
        try {
            const sender = await clerk_sdk_node_1.clerkClient.users.getUser(senderId);
            senderName = `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || sender.username || "Someone";
        }
        catch (error) {
            console.error("⚠️ Failed to fetch sender name from Clerk:", error);
        }
        const notification = await Notification_1.default.create({
            userId: receiverId,
            title: "New Message 💬",
            message: `You have a new message from ${senderName}`,
            type: "message",
        });
        io.to(receiverId).emit("new_notification", notification);
    });
    socket.on("typing", (data) => {
        const { receiverId, senderId } = data;
        io.to(receiverId).emit("user_typing", { senderId });
    });
    socket.on("stop_typing", (data) => {
        const { receiverId, senderId } = data;
        io.to(receiverId).emit("user_stop_typing", { senderId });
    });
    socket.on("new_match", async (data) => {
        const { userA, userB, userAName, userBName } = data;
        const notifA = await Notification_1.default.create({
            userId: userA,
            title: "It's a Match! 💖",
            message: `You matched with ${userBName}!`,
            type: "match",
        });
        const notifB = await Notification_1.default.create({
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
