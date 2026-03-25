/**
 * Seed script: populate initial toolbox configurations into MongoDB.
 *
 * Usage:  npx tsx scripts/seed-toolbox.ts
 */

import mongoose from "mongoose";
import { ToolboxConfig } from "../models/ToolboxConfig";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-qef";

const seedData = [
  {
    type: "fraction",
    label: "分數 Fraction",
    description: "分數相關題目（分數加減乘除、通分、約分等）",
    isActive: true,
    tools: [
      {
        key: "fraction-add",
        label: "加",
        sub: "Addition",
        icon: "Plus",
        bg: "bg-blue-100",
        iconBg: "bg-blue-500",
        border: "border-blue-200",
        hover: "hover:bg-blue-200 hover:border-blue-300",
        text: "text-blue-700",
      },
      {
        key: "fraction-sub",
        label: "減",
        sub: "Subtraction",
        icon: "Minus",
        bg: "bg-green-100",
        iconBg: "bg-green-500",
        border: "border-green-200",
        hover: "hover:bg-green-200 hover:border-green-300",
        text: "text-green-700",
      },
      {
        key: "fraction-mul",
        label: "乘",
        sub: "Multiplication",
        icon: "X",
        bg: "bg-orange-100",
        iconBg: "bg-orange-500",
        border: "border-orange-200",
        hover: "hover:bg-orange-200 hover:border-orange-300",
        text: "text-orange-700",
      },
      {
        key: "fraction-div",
        label: "除",
        sub: "Division",
        icon: "Divide",
        bg: "bg-purple-100",
        iconBg: "bg-purple-500",
        border: "border-purple-200",
        hover: "hover:bg-purple-200 hover:border-purple-300",
        text: "text-purple-700",
      },
    ],
  },
  {
    type: "algebra",
    label: "代數 Algebra",
    description: "代數相關題目（方程式、未知數、代數運算等）",
    isActive: true,
    tools: [
      {
        key: "algebra-2d",
        label: "一元一次",
        sub: "ax + b = c",
        icon: "Variable",
        bg: "bg-indigo-100",
        iconBg: "bg-indigo-500",
        border: "border-indigo-200",
        hover: "hover:bg-indigo-200 hover:border-indigo-300",
        text: "text-indigo-700",
      },
      {
        key: "algebra-3d",
        label: "二元一次",
        sub: "ax + by = c",
        icon: "Variable",
        bg: "bg-teal-100",
        iconBg: "bg-teal-500",
        border: "border-teal-200",
        hover: "hover:bg-teal-200 hover:border-teal-300",
        text: "text-teal-700",
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const config of seedData) {
    await ToolboxConfig.findOneAndUpdate(
      { type: config.type },
      config,
      { upsert: true, new: true }
    );
    console.log(`Upserted toolbox: ${config.type} (${config.label})`);
  }

  console.log("Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
