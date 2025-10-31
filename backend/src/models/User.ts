import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name: string; // ✅ add this
  age: number;
  gender: string;
  city: string;
  bio: string;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // ✅ add this
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    city: { type: String, required: true },
    bio: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
