/**
 * Seed script: create initial users (teacher + student).
 *
 * Usage:  npx tsx scripts/seed-users.ts
 *
 * Requires MONGODB_URI in environment (or .env.local).
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Inline minimal model to avoid Next.js server-only imports in a plain script
// ---------------------------------------------------------------------------
interface IUser {
  username: string;
  hashedPassword: string;
  role: "teacher" | "student";
  displayName: string;
  subjects: string[];
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], required: true },
    displayName: { type: String, required: true, trim: true },
    subjects: {
      type: [String],
      enum: ["math", "chinese", "english", "science", "humanities"],
      default: [],
    },
  },
  { timestamps: true }
);

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ??
  mongoose.model<IUser>("User", UserSchema);

// ---------------------------------------------------------------------------

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ai-qef";

const PASSWORD = "aidcec";

const USERS: Omit<IUser, "hashedPassword">[] = [
  { username: "teacher01", role: "teacher", displayName: "Teacher", subjects: ["math", "chinese", "english"] },
  { username: "student01", role: "student", displayName: "Student", subjects: ["math", "chinese"] },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  for (const u of USERS) {
    const existing = await User.findOne({ username: u.username });
    if (existing) {
      console.log(`User "${u.username}" already exists — skipping.`);
      continue;
    }
    await User.create({ ...u, hashedPassword });
    console.log(`Created user "${u.username}" with role "${u.role}".`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
