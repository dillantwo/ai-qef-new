import mongoose, { Schema, Document, Types } from "mongoose";

export type UserRole = "admin" | "teacher" | "student";

export type Subject = "math" | "chinese" | "english" | "science" | "humanities";

export const ALL_SUBJECTS: Subject[] = ["math", "chinese", "english", "science", "humanities"];

export interface IUser extends Document {
  username: string;
  hashedPassword: string;
  role: UserRole;
  displayName: string;
  /**
   * The school this user belongs to. Required for teacher/student.
   * Admins are global and have no school (null).
   */
  school: Types.ObjectId | null;
  /** Subjects this user may access (must be a subset of the school's enabled subjects) */
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["admin", "teacher", "student"], required: true },
    displayName: { type: String, required: true, trim: true },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
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
