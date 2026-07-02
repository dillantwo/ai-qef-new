import mongoose, { Schema, type Document } from "mongoose";

/**
 * Per-user Word Bank (生詞庫) for the English reading-comprehension role-play.
 * One document per user, keyed by userId, so the saved words sync across
 * devices instead of living only in the browser's localStorage.
 */
export interface IVocabBank extends Document {
  userId: string;
  username: string;
  /** Saved vocabulary words, in the order the student added them. */
  words: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VocabBankSchema = new Schema<IVocabBank>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    words: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const VocabBank =
  (mongoose.models.VocabBank as mongoose.Model<IVocabBank> | undefined) ??
  mongoose.model<IVocabBank>("VocabBank", VocabBankSchema);
