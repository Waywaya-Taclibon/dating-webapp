"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Notification_1 = __importDefault(require("../models/Notification"));
const router = express_1.default.Router();
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification_1.default.find({ userId }).sort({ time: -1 });
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
});
router.patch("/:id/read", async (req, res) => {
    try {
        await Notification_1.default.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: "Marked as read" });
    }
    catch {
        res.status(500).json({ message: "Error updating notification" });
    }
});
router.patch("/markAll/:userId", async (req, res) => {
    try {
        await Notification_1.default.updateMany({ userId: req.params.userId }, { read: true });
        res.json({ message: "All marked as read" });
    }
    catch {
        res.status(500).json({ message: "Error updating notifications" });
    }
});
exports.default = router;
