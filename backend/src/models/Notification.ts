import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // who receives this
  title: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["match", "message", "system"], default: "system" },
});

notificationSchema.index({ userId: 1, time: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
