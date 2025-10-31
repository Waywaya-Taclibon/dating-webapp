import express from "express";
import Message from "../models/Message";

const router = express.Router();

// ✅ Fetch all messages between two users
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({
      timestamp: 1,
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Send a new message
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const chatId = [senderId, receiverId].sort().join("_");

    const newMessage = new Message({
      chatId,
      senderId,
      receiverId,
      message,
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
