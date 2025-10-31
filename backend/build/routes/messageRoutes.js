"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Message_1 = __importDefault(require("../models/Message"));
const router = express_1.default.Router();
router.get("/:chatId", async (req, res) => {
    try {
        const messages = await Message_1.default.find({ chatId: req.params.chatId }).sort({
            timestamp: 1,
        });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/send", async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;
        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ message: "Missing fields" });
        }
        const chatId = [senderId, receiverId].sort().join("_");
        const newMessage = new Message_1.default({
            chatId,
            senderId,
            receiverId,
            message,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
