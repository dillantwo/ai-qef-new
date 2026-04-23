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
    type: "clock",
    label: "時鐘 Clock",
    description: "時鐘相關題目（24小時制、時間差等）",
    isActive: true,
    tools: [
      {
        key: "clock-24hrs",
        label: "24小時制",
        sub: "ClockApp1 (24hrs)",
        icon: "Clock",
        bg: "bg-blue-100",
        iconBg: "bg-blue-500",
        border: "border-blue-200",
        hover: "hover:bg-blue-200 hover:border-blue-300",
        text: "text-blue-700",
      },
      {
        key: "clock-time-difference",
        label: "時間差",
        sub: "ClockApp2 (TimeDifference)",
        icon: "Timer",
        bg: "bg-cyan-100",
        iconBg: "bg-cyan-500",
        border: "border-cyan-200",
        hover: "hover:bg-cyan-200 hover:border-cyan-300",
        text: "text-cyan-700",
      },
    ],
  },
  {
    type: "fraction",
    label: "分數 Fraction",
    description: "分數相關題目（分數結構、擴分約分、乘法等）",
    isActive: true,
    tools: [
      {
        key: "fraction-expanding-simplifying",
        label: "擴分與約分",
        sub: "FractionApp13 (Expanding & Simplifying)",
        icon: "ArrowLeftRight",
        bg: "bg-orange-100",
        iconBg: "bg-orange-500",
        border: "border-orange-200",
        hover: "hover:bg-orange-200 hover:border-orange-300",
        text: "text-orange-700",
      },
      {
        key: "fraction-addition",
        label: "加法",
        sub: "FractionApp (Addition)",
        icon: "Plus",
        bg: "bg-teal-100",
        iconBg: "bg-teal-500",
        border: "border-teal-200",
        hover: "hover:bg-teal-200 hover:border-teal-300",
        text: "text-teal-700",
      },
      {
        key: "fraction-subtraction",
        label: "減法",
        sub: "FractionApp (Subtraction)",
        icon: "Minus",
        bg: "bg-rose-100",
        iconBg: "bg-rose-500",
        border: "border-rose-200",
        hover: "hover:bg-rose-200 hover:border-rose-300",
        text: "text-rose-700",
      },
      {
        key: "fraction-multiplication",
        label: "乘法",
        sub: "FractionApp (Multiplication)",
        icon: "X",
        bg: "bg-purple-100",
        iconBg: "bg-purple-500",
        border: "border-purple-200",
        hover: "hover:bg-purple-200 hover:border-purple-300",
        text: "text-purple-700",
      },
      {
        key: "fraction-division",
        label: "除法",
        sub: "FractionApp (Division)",
        icon: "Divide",
        bg: "bg-amber-100",
        iconBg: "bg-amber-500",
        border: "border-amber-200",
        hover: "hover:bg-amber-200 hover:border-amber-300",
        text: "text-amber-700",
      },
    ],
  },
  {
    type: "volume",
    label: "體積 Volume",
    description: "3D 體積學習：堆疊立方體、計算體積／表面積、觀察三視圖",
    isActive: true,
    tools: [
      {
        key: "volume-cubes",
        label: "體積探索",
        sub: "Volume Explorer (3D)",
        icon: "Box",
        bg: "bg-indigo-100",
        iconBg: "bg-indigo-500",
        border: "border-indigo-200",
        hover: "hover:bg-indigo-200 hover:border-indigo-300",
        text: "text-indigo-700",
      },
    ],
  },
  {
    type: "english",
    label: "英文科 English",
    description: "English Language interactive tools",
    isActive: true,
    tools: [
      {
        key: "eng-location-direction",
        label: "Location and Direction",
        sub: "Map Navigation",
        icon: "Compass",
        bg: "bg-emerald-100",
        iconBg: "bg-emerald-500",
        border: "border-emerald-200",
        hover: "hover:bg-emerald-200 hover:border-emerald-300",
        text: "text-emerald-700",
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const keepTypes = seedData.map((c) => c.type);
  const deleted = await ToolboxConfig.deleteMany({ type: { $nin: keepTypes } });
  if (deleted.deletedCount) {
    console.log(`Removed ${deleted.deletedCount} old toolbox config(s)`);
  }

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
