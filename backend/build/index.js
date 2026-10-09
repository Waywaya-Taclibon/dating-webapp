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
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 10000;
const allowedOrigins = [
    "http://localhost:5173",
    "https://dopawink.vercel.app",
    "https://dopawink.onrender.com"
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.setHeader("Connection", "keep-alive, Upgrade");
    res.setHeader("Upgrade", "websocket");
    next();
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
});
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined! Check Render env vars / .env");
}
else {
    console.log("🔌 Connecting with URI:", MONGO_URI.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:<hidden>@"));
}
mongoose_1.default.set("bufferTimeoutMS", 10000);
mongoose_1.default
    .connect(MONGO_URI, {
    ...(process.env.MONGO_DB_NAME
        ? { dbName: process.env.MONGO_DB_NAME }
        : {}),
    retryWrites: true,
    serverSelectionTimeoutMS: 10000,
})
    .then(() => console.log("✅ CONNECTED TO MONGODB!"))
    .catch((err) => {
    console.error("❌ MongoDB connection failed:", (err === null || err === void 0 ? void 0 : err.message) || err);
    console.error("👉 Check: 1) Atlas cluster unpaused 2) Network Access 0.0.0.0/0 3) DB user password 4) MONGO_URI includes db name");
});
mongoose_1.default.connection.on("connected", () => console.log("🟢 Mongoose connected"));
mongoose_1.default.connection.on("error", (err) => console.error("🔴 Mongoose error:", err));
mongoose_1.default.connection.on("disconnected", () => console.warn("🟡 Mongoose disconnected"));
app.use("/api", userRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.get("/", (req, res) => {
    res.send("🚀 DopaWink Backend is running and ready for WebSockets!");
});
app.get("/api/health", (req, res) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    res.json({
        status: "ok",
        mongoState: states[mongoose_1.default.connection.readyState] || "unknown",
        mongoReady: mongoose_1.default.connection.readyState === 1,
        hasMongoUri: !!process.env.MONGO_URI,
        timestamp: new Date().toISOString(),
    });
});
io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    socket.on("join_room", (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their private room`);
    });
    socket.on("send_message", async (data) => {
        const { senderId, receiverId, message } = data;
        console.log(`📨 ${senderId} ➜ ${receiverId}: ${message}`);
        io.to(receiverId).emit("receive_message", data);
        let senderName = "Someone";
        try {
            const sender = await clerk_sdk_node_1.clerkClient.users.getUser(senderId);
            senderName =
                `${sender.firstName || ""} ${sender.lastName || ""}`.trim() ||
                    sender.username ||
                    "Someone";
        }
        catch (err) {
            console.error("⚠️ Clerk lookup failed:", err);
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
        io.to(data.receiverId).emit("user_typing", { senderId: data.senderId });
    });
    socket.on("stop_typing", (data) => {
        io.to(data.receiverId).emit("user_stop_typing", { senderId: data.senderId });
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
        console.log("🔴 Disconnected:", socket.id);
    });
});
server.listen(port, host, () => {
    console.log(`✅ Server listening on http://${host}:${port}`);
});
