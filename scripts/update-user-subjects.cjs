/**
 * Update ONLY the subject permissions of an existing user — without touching
 * the password, role, or display name (unlike create-user.cjs --force).
 *
 * Works locally (reads MONGODB_URI from .env.local) and inside the production
 * Docker `app` container (which has MONGODB_URI set + bundles mongoose).
 *
 * Examples:
 *   # Grant ALL subjects (default when --subjects is omitted):
 *   node scripts/update-user-subjects.cjs --username teacher01
 *
 *   # Set an explicit list (replaces existing):
 *   node scripts/update-user-subjects.cjs --username teacher01 --subjects math,chinese,science
 *
 *   # Add subjects to whatever the user already has (merge, no removals):
 *   node scripts/update-user-subjects.cjs --username teacher01 --subjects science --add
 *
 * Flags:
 *   --username   (required) login name (matched case-insensitively / lowercased)
 *   --subjects   (optional) comma list of: math,chinese,english,science,humanities
 *                           defaults to ALL subjects when omitted
 *   --add        (optional) merge with the user's current subjects instead of replacing
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const ALLOWED_SUBJECTS = ["math", "chinese", "english", "science", "humanities"];

// Lightweight .env.local loader so the script runs locally without dotenv.
function loadEnvLocal() {
  if (process.env.MONGODB_URI) return;
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true; // boolean flag (e.g. --add)
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], required: true },
    displayName: { type: String, required: true, trim: true },
    subjects: { type: [String], enum: ALLOWED_SUBJECTS, default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv.slice(2));

  const username = typeof args.username === "string" ? args.username.toLowerCase().trim() : "";
  if (!username) {
    console.error("ERROR: --username is required.");
    process.exit(1);
  }

  const requested =
    typeof args.subjects === "string"
      ? args.subjects.split(",").map((s) => s.trim()).filter(Boolean)
      : [...ALLOWED_SUBJECTS]; // default: all subjects

  const bad = requested.filter((s) => !ALLOWED_SUBJECTS.includes(s));
  if (bad.length) {
    console.error(`ERROR: invalid --subjects: ${bad.join(", ")}`);
    console.error(`       allowed: ${ALLOWED_SUBJECTS.join(", ")}`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set (checked env + .env.local).");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const user = await User.findOne({ username });
  if (!user) {
    console.error(`ERROR: user "${username}" not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const before = [...(user.subjects ?? [])];
  const next = args.add === true
    ? ALLOWED_SUBJECTS.filter((s) => before.includes(s) || requested.includes(s)) // merge, keep canonical order
    : requested;

  user.subjects = next;
  await user.save();

  console.log(`Updated "${username}" subjects:`);
  console.log(`  before: [${before.join(", ")}]`);
  console.log(`  after:  [${next.join(", ")}]`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
