/**
 * Create (or update) a single user — works inside the production Docker
 * `app` container, which already bundles mongoose + bcryptjs and has
 * MONGODB_URI set. No TypeScript / tsx required.
 *
 * Copy it into the running app container and run it, e.g.:
 *
 *   docker compose cp scripts/create-user.cjs app:/app/create-user.cjs
 *   docker compose exec app node /app/create-user.cjs \
 *     --username teacher02 --password "S3cret!" \
 *     --displayName "Ms Chan" --role teacher \
 *     --subjects math,chinese,english
 *
 * Flags:
 *   --username     (required) login name, stored lowercase
 *   --password     (required) plaintext; hashed with bcrypt (12 rounds)
 *   --displayName  (optional) defaults to the username
 *   --role         (optional) teacher | student   (default: teacher)
 *   --subjects     (optional) comma list of: math,chinese,english,science,humanities
 *   --force        (optional) update password/fields if the user already exists
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true; // boolean flag (e.g. --force)
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const ALLOWED_SUBJECTS = ["math", "chinese", "english", "science", "humanities"];
const ALLOWED_ROLES = ["teacher", "student"];

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ALLOWED_ROLES, required: true },
    displayName: { type: String, required: true, trim: true },
    subjects: { type: [String], enum: ALLOWED_SUBJECTS, default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const username = typeof args.username === "string" ? args.username.toLowerCase().trim() : "";
  const password = typeof args.password === "string" ? args.password : "";
  const role = typeof args.role === "string" ? args.role : "teacher";
  const displayName = typeof args.displayName === "string" ? args.displayName : username;
  const subjects =
    typeof args.subjects === "string"
      ? args.subjects.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const force = args.force === true;

  if (!username || !password) {
    console.error("ERROR: --username and --password are required.");
    process.exit(1);
  }
  if (!ALLOWED_ROLES.includes(role)) {
    console.error(`ERROR: --role must be one of: ${ALLOWED_ROLES.join(", ")}`);
    process.exit(1);
  }
  const badSubjects = subjects.filter((s) => !ALLOWED_SUBJECTS.includes(s));
  if (badSubjects.length) {
    console.error(`ERROR: invalid --subjects: ${badSubjects.join(", ")}`);
    console.error(`       allowed: ${ALLOWED_SUBJECTS.join(", ")}`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in this environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const hashedPassword = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ username });

  if (existing && !force) {
    console.error(`User "${username}" already exists. Re-run with --force to update it.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (existing) {
    existing.hashedPassword = hashedPassword;
    existing.role = role;
    existing.displayName = displayName;
    existing.subjects = subjects;
    await existing.save();
    console.log(`Updated user "${username}" (role: ${role}, subjects: [${subjects.join(", ")}]).`);
  } else {
    await User.create({ username, hashedPassword, role, displayName, subjects });
    console.log(`Created user "${username}" (role: ${role}, subjects: [${subjects.join(", ")}]).`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
