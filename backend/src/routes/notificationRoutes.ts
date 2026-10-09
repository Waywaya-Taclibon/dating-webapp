import express from "express";
import Notification from "../models/Notification";
import { enforceSelf, getAuthId } from "../middleware/requireAuth";

const router = express.Router();

// Fetch all notifications for a user — own only
router.get("/:userId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.userId)) return;
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ time: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark a single notification as read — only if it belongs to the caller
router.patch("/:id/read", async (req, res) => {
  try {
    const authId = getAuthId(req);
    if (!authId) return res.status(401).json({ message: "Unauthorized" });
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: authId },
      { read: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Marked as read" });
  } catch {
    res.status(500).json({ message: "Error updating notification" });
  }
});

// Mark all as read — own only
router.patch("/markAll/:userId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.userId)) return;
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: "All marked as read" });
  } catch {
    res.status(500).json({ message: "Error updating notifications" });
  }
});

export default router;
