import mongoose, { Schema, type Document } from "mongoose";

export interface ITool {
  key: string;
  label: string;
  sub: string;
  icon: string;
  bg: string;
  iconBg: string;
  border: string;
  hover: string;
  text: string;
}

export interface IToolboxConfig extends Document {
  type: string;
  label: string;
  description: string;
  tools: ITool[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ToolSchema = new Schema<ITool>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    sub: { type: String, required: true },
    icon: { type: String, required: true },
    bg: { type: String, required: true },
    iconBg: { type: String, required: true },
    border: { type: String, required: true },
    hover: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const ToolboxConfigSchema = new Schema<IToolboxConfig>(
  {
    type: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    tools: [ToolSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ToolboxConfig =
  mongoose.models.ToolboxConfig ??
  mongoose.model<IToolboxConfig>("ToolboxConfig", ToolboxConfigSchema);
