import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "teacher" | "student";

export type Subject = "math" | "chinese" | "english" | "science" | "humanities";

export const ALL_SUBJECTS: Subject[] = ["math", "chinese", "english", "science", "humanities"];

export interface IUser extends Document {
  username: string;
  hashedPassword: string;
  role: UserRole;
  displayName: string;
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], required: true },
    displayName: { type: String, required: true, trim: true },
    subjects: {
      type: [String],
      enum: ["math", "chinese", "english", "science", "humanities"],
      default: [],
    },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ??
  mongoose.model<IUser>("User", UserSchema);
