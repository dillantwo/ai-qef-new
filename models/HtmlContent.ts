import mongoose, { Schema, type Document } from "mongoose";

export interface IHtmlContent extends Document {
  toolKey: string;
  title: string;
  html: string;
  createdAt: Date;
  updatedAt: Date;
}

const HtmlContentSchema = new Schema<IHtmlContent>(
  {
    toolKey: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
  },
  { timestamps: true }
);

export const HtmlContent =
  mongoose.models.HtmlContent ??
  mongoose.model<IHtmlContent>("HtmlContent", HtmlContentSchema);
