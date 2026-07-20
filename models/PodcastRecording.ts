import mongoose, { Schema, type Document } from "mongoose";

export interface IPodcastRecording extends Document {
  userId: string;
  recordingId: string;
  topic: string;
  title: string;
  /** Optional script/notes the student prepared before recording. */
  script: string;
  /** Audio stored inline as a base64 data URL (matches the app's file-storage convention). */
  audioData: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PodcastRecordingSchema = new Schema<IPodcastRecording>(
  {
    userId: { type: String, required: true, index: true },
    recordingId: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    title: { type: String, required: true },
    script: { type: String, default: "" },
    audioData: { type: String, required: true },
    mimeType: { type: String, default: "audio/webm" },
    durationSec: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PodcastRecordingSchema.index({ userId: 1, recordingId: 1 }, { unique: true });
PodcastRecordingSchema.index({ userId: 1, topic: 1, updatedAt: -1 });

export const PodcastRecording =
  (mongoose.models.PodcastRecording as mongoose.Model<IPodcastRecording> | undefined) ??
  mongoose.model<IPodcastRecording>("PodcastRecording", PodcastRecordingSchema);
