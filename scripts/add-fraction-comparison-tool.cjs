/**
 * Add (idempotently) the "比較大小" (fraction-comparison) tool into the
 * existing "fraction" toolbox config in MongoDB.
 *
 * Works inside the production Docker `app` container, which already bundles
 * mongoose and has MONGODB_URI set. No TypeScript / tsx required.
 *
 * Copy it into the running app container and run it:
 *
 *   docker compose cp scripts/add-fraction-comparison-tool.cjs app:/app/add-fraction-comparison-tool.cjs
 *   docker compose exec app node /app/add-fraction-comparison-tool.cjs
 *
 * Re-running is safe: if the tool already exists it just updates it in place.
 */

const mongoose = require("mongoose");

const COMPARISON_TOOL = {
  key: "fraction-comparison",
  label: "比較大小",
  sub: "FractionApp (Comparison)",
  icon: "ArrowUpDown",
  bg: "bg-cyan-100",
  iconBg: "bg-cyan-500",
  border: "border-cyan-200",
  hover: "hover:bg-cyan-200 hover:border-cyan-300",
  text: "text-cyan-700",
};

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

  const fraction = await ToolboxConfig.findOne({ type: "fraction" });
  if (!fraction) {
    console.error('ERROR: no toolbox config with type "fraction" found. Run the full seed first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const idx = fraction.tools.findIndex((t) => t.key === COMPARISON_TOOL.key);
  if (idx >= 0) {
    fraction.tools[idx] = COMPARISON_TOOL;
    console.log('Tool "fraction-comparison" already existed — updated in place.');
  } else {
    fraction.tools.push(COMPARISON_TOOL);
    console.log('Added tool "fraction-comparison" to the fraction group.');
  }

  fraction.markModified("tools");
  await fraction.save();

  console.log(`fraction group now has ${fraction.tools.length} tool(s): [${fraction.tools.map((t) => t.key).join(", ")}]`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
