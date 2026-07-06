/**
 * One-off migration: rename existing tool labels to their new names.
 *
 * Only touches each tool's label — group/tool isActive toggles and every other
 * field are left untouched. Safe to run multiple times (idempotent).
 *
 * Usage:  npx tsx scripts/rename-tool-labels.ts
 */

import mongoose from "mongoose";
import { ToolboxConfig } from "../models/ToolboxConfig";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-qef";

// tool key → new label
const LABEL_RENAMES: Record<string, string> = {
  "fraction-expanding-simplifying": "相等分數",
  "fraction-addition": "異分母加法",
  "fraction-subtraction": "異分母減法",
  "fraction-multiplication": "分數乘法",
  "fraction-division": "分數除法",
  "fraction-comparison": "分數比較",
  "fraction-integer": "整數的部分",
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const [key, label] of Object.entries(LABEL_RENAMES)) {
    const result = await ToolboxConfig.updateOne(
      { "tools.key": key },
      { $set: { "tools.$.label": label } }
    );

    if (result.matchedCount === 0) {
      console.log(`- "${key}": not found, skipped`);
    } else if (result.modifiedCount === 0) {
      console.log(`- "${key}": already "${label}", no change`);
    } else {
      console.log(`- "${key}": renamed to "${label}"`);
    }
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Rename failed:", err);
  process.exit(1);
});
