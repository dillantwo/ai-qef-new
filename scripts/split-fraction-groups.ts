/**
 * One-off migration: split the single 分數 (type "fraction") toolbox group into
 * two groups:
 *   - "fraction-operations" (四則運算): 加/減/乘/除
 *   - "fraction-concept"    (分數概念): 分數比較 / 相等分數 / 整數與分數互換 / 整數的部分
 *
 * Each tool's isActive toggle is preserved from the old group. Newly introduced
 * tools that were never in the old group default to active. Safe to run multiple
 * times (idempotent): once the old "fraction" group is gone, re-running only
 * ensures the two groups exist.
 *
 * Usage:  npx tsx scripts/split-fraction-groups.ts
 */

import mongoose from "mongoose";
import { ToolboxConfig } from "../models/ToolboxConfig";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-qef";

const OPERATIONS_TOOLS = [
  { key: "fraction-addition", label: "分數相加", sub: "FractionApp (Addition)", icon: "Plus", bg: "bg-teal-100", iconBg: "bg-teal-500", border: "border-teal-200", hover: "hover:bg-teal-200 hover:border-teal-300", text: "text-teal-700" },
  { key: "fraction-subtraction", label: "分數相減", sub: "FractionApp (Subtraction)", icon: "Minus", bg: "bg-rose-100", iconBg: "bg-rose-500", border: "border-rose-200", hover: "hover:bg-rose-200 hover:border-rose-300", text: "text-rose-700" },
  { key: "fraction-multiplication", label: "分數相乘", sub: "FractionApp (Multiplication)", icon: "X", bg: "bg-purple-100", iconBg: "bg-purple-500", border: "border-purple-200", hover: "hover:bg-purple-200 hover:border-purple-300", text: "text-purple-700" },
  { key: "fraction-division", label: "分數相除", sub: "FractionApp (Division)", icon: "Divide", bg: "bg-amber-100", iconBg: "bg-amber-500", border: "border-amber-200", hover: "hover:bg-amber-200 hover:border-amber-300", text: "text-amber-700" },
];

const CONCEPT_TOOLS = [
  { key: "fraction-comparison", label: "分數比較", sub: "FractionApp (Comparison)", icon: "ArrowUpDown", bg: "bg-cyan-100", iconBg: "bg-cyan-500", border: "border-cyan-200", hover: "hover:bg-cyan-200 hover:border-cyan-300", text: "text-cyan-700" },
  { key: "fraction-expanding-simplifying", label: "相等分數", sub: "FractionApp13 (Expanding & Simplifying)", icon: "ArrowLeftRight", bg: "bg-orange-100", iconBg: "bg-orange-500", border: "border-orange-200", hover: "hover:bg-orange-200 hover:border-orange-300", text: "text-orange-700" },
  { key: "fraction-converting", label: "整數與分數互換", sub: "FractionApp (Converting)", icon: "Repeat", bg: "bg-pink-100", iconBg: "bg-pink-500", border: "border-pink-200", hover: "hover:bg-pink-200 hover:border-pink-300", text: "text-pink-700" },
  { key: "fraction-integer", label: "分數是整數的部份", sub: "FractionApp (Integer)", icon: "Grid3x3", bg: "bg-lime-100", iconBg: "bg-lime-500", border: "border-lime-200", hover: "hover:bg-lime-200 hover:border-lime-300", text: "text-lime-700" },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const oldConfig = await ToolboxConfig.findOne({ type: "fraction" }).lean();

  // Preserve per-tool isActive from the old group (missing → active).
  const activeByKey = new Map<string, boolean>();
  let groupActive = true;
  if (oldConfig) {
    groupActive = oldConfig.isActive !== false;
    for (const t of oldConfig.tools ?? []) {
      activeByKey.set(t.key, (t as { isActive?: boolean }).isActive !== false);
    }
  }

  const withActive = (tools: typeof OPERATIONS_TOOLS) =>
    tools.map((t) => ({ ...t, isActive: activeByKey.get(t.key) ?? true }));

  const groups = [
    {
      type: "fraction-operations",
      label: "四則運算",
      description: "分數四則運算題目（分數加法、減法、乘法、除法、應用題等）",
      isActive: groupActive,
      tools: withActive(OPERATIONS_TOOLS),
    },
    {
      type: "fraction-concept",
      label: "分數概念",
      description: "分數概念題目（分數比較、相等分數、整數與分數互換、整數的部分等）",
      isActive: groupActive,
      tools: withActive(CONCEPT_TOOLS),
    },
  ];

  for (const g of groups) {
    // Don't clobber an existing new group's toggles if it already exists.
    const existing = await ToolboxConfig.findOne({ type: g.type });
    if (existing) {
      console.log(`- "${g.type}": already exists, left untouched`);
      continue;
    }
    await ToolboxConfig.create(g);
    console.log(`- "${g.type}": created (${g.tools.length} tools)`);
  }

  if (oldConfig) {
    await ToolboxConfig.deleteOne({ type: "fraction" });
    console.log('- removed old "fraction" group');
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Split failed:", err);
  process.exit(1);
});
