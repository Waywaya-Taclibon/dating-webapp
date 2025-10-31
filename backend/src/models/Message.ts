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
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
