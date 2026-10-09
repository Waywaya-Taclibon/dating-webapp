import mongoose, { Schema, Document } from "mongoose";

export interface IUserInfo extends Document {
  clerkId: string;
  age: number;
  gender: string;
  city: string;
  bio: string;
  likedUsers: string[];
  passedUsers: string[];
  matches: string[];
}

const UserInfoSchema = new Schema<IUserInfo>({
  clerkId: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  city: { type: String, required: true },
  bio: { type: String, required: true },

  // 🆕 Added fields for swiping & matching
  likedUsers: { type: [String], default: [] },
  passedUsers: { type: [String], default: [] },
  matches: { type: [String], default: [] },
});

// Indexes for discover ($nin) + match-list ($in) lookups
UserInfoSchema.index({ likedUsers: 1 });
UserInfoSchema.index({ passedUsers: 1 });
UserInfoSchema.index({ matches: 1 });

export default mongoose.model<IUserInfo>("UserInfo", UserInfoSchema);
