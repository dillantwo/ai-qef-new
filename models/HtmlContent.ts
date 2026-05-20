import mongoose, { Schema, type Document } from "mongoose";

interface ISavedMessagePart {
  type: "text" | "file";
  text?: string;
  url?: string;
  mediaType?: string;
  filename?: string;
}

interface ISavedChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: ISavedMessagePart[];
}

export interface IHtmlContent extends Document {
  userId: string;
  toolKey: string;
  title: string;
  html: string;
  chatMessages: ISavedChatMessage[];
  sharedWithStudents: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedMessagePartSchema = new Schema<ISavedMessagePart>(
  {
    type: { type: String, enum: ["text", "file"], required: true },
    text: { type: String },
    url: { type: String },
    mediaType: { type: String },
    filename: { type: String },
  },
  { _id: false }
);

const SavedChatMessageSchema = new Schema<ISavedChatMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    parts: { type: [SavedMessagePartSchema], default: [] },
  },
  { _id: false }
);

const HtmlContentSchema = new Schema<IHtmlContent>(
  {
    userId: { type: String, required: true, index: true },
    toolKey: { type: String, required: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
    chatMessages: { type: [SavedChatMessageSchema], default: [] },
    sharedWithStudents: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

HtmlContentSchema.index({ userId: 1, toolKey: 1 }, { unique: true });

const existingHtmlContentModel = mongoose.models.HtmlContent as mongoose.Model<IHtmlContent> | undefined;

if (
  existingHtmlContentModel &&
  (!existingHtmlContentModel.schema.path("chatMessages") ||
    !existingHtmlContentModel.schema.path("userId") ||
    !existingHtmlContentModel.schema.path("sharedWithStudents"))
) {
  mongoose.deleteModel("HtmlContent");
}

export const HtmlContent =
  (mongoose.models.HtmlContent as mongoose.Model<IHtmlContent> | undefined) ??
  mongoose.model<IHtmlContent>("HtmlContent", HtmlContentSchema);
