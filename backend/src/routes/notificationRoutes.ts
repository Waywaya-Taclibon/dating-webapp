import express from "express";
import Notification from "../models/Notification";

const router = express.Router();

// Fetch all notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ time: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark a single notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch {
    res.status(500).json({ message: "Error updating notification" });
  }
});

// Mark all as read
router.patch("/markAll/:userId", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { read: true });
    res.json({ message: "All marked as read" });
  } catch {
    res.status(500).json({ message: "Error updating notifications" });
  }
});

export default router;
