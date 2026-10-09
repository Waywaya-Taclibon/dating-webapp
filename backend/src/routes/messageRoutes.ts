import express from "express";
import Message from "../models/Message";
import UserInfo from "../models/UserInfo";
import { getAuthId } from "../middleware/requireAuth";

const router = express.Router();

// ✅ Fetch messages for a chat — only if the authed user is a participant
router.get("/:chatId", async (req, res) => {
  try {
    const authId = getAuthId(req);
    if (!authId) return res.status(401).json({ message: "Unauthorized" });
    const { chatId } = req.params;
    const parts = chatId.split("_");
    // chatId format: [idA, idB].sort().join("_") — caller must be one side
    if (!parts.includes(authId))
      return res.status(403).json({ message: "Forbidden" });
    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .limit(200);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Send a new message — sender is always the authed user; must be matched
router.post("/send", async (req, res) => {
  try {
    const senderId = getAuthId(req);
    if (!senderId) return res.status(401).json({ message: "Unauthorized" });
    const { receiverId, message } = req.body;
    if (!receiverId || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Missing fields" });
    }
    if (message.length > 2000)
      return res.status(400).json({ message: "Message too long" });

    // Only matched users can message each other
    const sender = await UserInfo.findOne({ clerkId: senderId });
    if (!sender || !sender.matches.includes(receiverId))
      return res.status(403).json({ message: "You can only message matches" });

    const chatId = [senderId, receiverId].sort().join("_");

    const newMessage = new Message({
      chatId,
      senderId,
      receiverId,
      message: message.trim(),
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
