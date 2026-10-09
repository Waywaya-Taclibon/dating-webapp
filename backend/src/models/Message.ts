import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true, maxlength: 2000 },
  timestamp: { type: Date, default: Date.now },
});

MessageSchema.index({ chatId: 1, timestamp: 1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });
MessageSchema.index({ receiverId: 1, timestamp: -1 });

export default mongoose.model<IMessage>("Message", MessageSchema);
