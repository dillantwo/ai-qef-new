/**
 * Split the single 分數 (type "fraction") toolbox group into two groups:
 *   - "fraction-operations" (四則運算): 加/減/乘/除
 *   - "fraction-concept"    (分數概念): 分數比較 / 相等分數 / 整數與分數互換 / 整數的部分
 *
 * Each tool's isActive toggle is preserved from the old group. Newly introduced
 * tools that were never in the old group default to active. Idempotent: once the
 * old "fraction" group is gone, re-running only ensures the two groups exist.
 *
 * Works inside the production Docker `app` container, which already bundles
 * mongoose and has MONGODB_URI set. No TypeScript / tsx required.
 *
 *   docker compose cp scripts/split-fraction-groups.cjs app:/app/split-fraction-groups.cjs
 *   docker compose exec app node /app/split-fraction-groups.cjs
 */

const mongoose = require("mongoose");

const OPERATIONS_TOOLS = [
  { key: "fraction-addition", label: "分數相加", sub: "FractionApp (Addition)", icon: "Plus", bg: "bg-teal-100", iconBg: "bg-teal-500", border: "border-teal-200", hover: "hover:bg-teal-200 hover:border-teal-300", text: "text-teal-700" },
  { key: "fraction-subtraction", label: "分數相減", sub: "FractionApp (Subtraction)", icon: "Minus", bg: "bg-rose-100", iconBg: "bg-rose-500", border: "border-rose-200", hover: "hover:bg-rose-200 hover:border-rose-300", text: "text-rose-700" },
  { key: "fraction-multiplication", label: "分數相乘", sub: "FractionApp (Multiplication)", icon: "X", bg: "bg-purple-100", iconBg: "bg-purple-500", border: "border-purple-200", hover: "hover:bg-purple-200 hover:border-purple-300", text: "text-purple-700" },
  { key: "fraction-division", label: "分數相除", sub: "FractionApp (Division)", icon: "Divide", bg: "bg-amber-100", iconBg: "bg-amber-500", border: "border-amber-200", hover: "hover:bg-amber-200 hover:border-amber-300", text: "text-amber-700" },
];

// 順序即 dashboard 顯示順序：整數與分數互換 → 分數是整數的部份 → 相等分數 → 分數比較
const CONCEPT_TOOLS = [
  { key: "fraction-converting", label: "整數與分數互換", sub: "FractionApp (Converting)", icon: "Repeat", bg: "bg-pink-100", iconBg: "bg-pink-500", border: "border-pink-200", hover: "hover:bg-pink-200 hover:border-pink-300", text: "text-pink-700" },
  { key: "fraction-integer", label: "分數是整數的部份", sub: "FractionApp (Integer)", icon: "Grid3x3", bg: "bg-lime-100", iconBg: "bg-lime-500", border: "border-lime-200", hover: "hover:bg-lime-200 hover:border-lime-300", text: "text-lime-700" },
  { key: "fraction-expanding-simplifying", label: "相等分數", sub: "FractionApp13 (Expanding & Simplifying)", icon: "ArrowLeftRight", bg: "bg-orange-100", iconBg: "bg-orange-500", border: "border-orange-200", hover: "hover:bg-orange-200 hover:border-orange-300", text: "text-orange-700" },
  { key: "fraction-comparison", label: "分數比較", sub: "FractionApp (Comparison)", icon: "ArrowUpDown", bg: "bg-cyan-100", iconBg: "bg-cyan-500", border: "border-cyan-200", hover: "hover:bg-cyan-200 hover:border-cyan-300", text: "text-cyan-700" },
];

const ToolSchema = new mongoose.Schema(
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
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const ToolboxConfigSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    tools: [ToolSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ToolboxConfig =
  mongoose.models.ToolboxConfig ||
  mongoose.model("ToolboxConfig", ToolboxConfigSchema);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in this environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const oldConfig = await ToolboxConfig.findOne({ type: "fraction" }).lean();

  const activeByKey = new Map();
  let groupActive = true;
  if (oldConfig) {
    groupActive = oldConfig.isActive !== false;
    for (const t of oldConfig.tools || []) {
      activeByKey.set(t.key, t.isActive !== false);
    }
  }

  const withActive = (tools) =>
    tools.map((t) => ({ ...t, isActive: activeByKey.has(t.key) ? activeByKey.get(t.key) : true }));

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
    const existing = await ToolboxConfig.findOne({ type: g.type });
    if (existing) {
      // 群組已存在：更新名稱、描述與工具（順序/標籤），但保留每個工具與群組的 isActive 開關。
      const existingActive = new Map(
        (existing.tools || []).map((t) => [t.key, t.isActive !== false])
      );
      existing.label = g.label;
      existing.description = g.description;
      existing.tools = g.tools.map((t) => ({
        ...t,
        isActive: existingActive.has(t.key) ? existingActive.get(t.key) : t.isActive !== false,
      }));
      await existing.save();
      console.log(`- "${g.type}": updated (labels/order refreshed, isActive preserved)`);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
