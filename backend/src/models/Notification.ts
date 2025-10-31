import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // who receives this
  title: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["match", "message", "system"], default: "system" },
});

export default mongoose.model("Notification", notificationSchema);
