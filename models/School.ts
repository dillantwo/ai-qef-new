import mongoose, { Schema, Document } from "mongoose";
import { Subject } from "@/models/User";

export interface ISchool extends Document {
  /** Human readable school name, e.g. "聖保羅書院" */
  name: string;
  /** Short unique code used in URLs / references, e.g. "spc" */
  code: string;
  /** Subjects this school has subscribed to / enabled */
  enabledSubjects: Subject[];
  /** Whether the school is active. Disabled schools block all their users. */
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    enabledSubjects: {
      type: [String],
      enum: ["math", "chinese", "english", "science", "humanities"],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const School =
  (mongoose.models.School as mongoose.Model<ISchool> | undefined) ??
  mongoose.model<ISchool>("School", SchoolSchema);
