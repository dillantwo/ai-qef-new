/**
 * Seed script: create the initial platform administrator.
 *
 * Admins are global (no school) and bypass subject restrictions. Use this once
 * to bootstrap access to the /admin area, then manage everything from the UI.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *   ADMIN_USERNAME=root ADMIN_PASSWORD=secret123 npx tsx scripts/seed-admin.ts
 *
 * Reset an existing admin's password (recovery when locked out):
 *   ADMIN_RESET=1 ADMIN_PASSWORD=newSecret123 npx tsx scripts/seed-admin.ts
 *
 * Requires MONGODB_URI in environment (or .env.local).
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface IUser {
  username: string;
  hashedPassword: string;
  role: "admin" | "teacher" | "student";
  displayName: string;
  school: mongoose.Types.ObjectId | null;
  subjects: string[];
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["admin", "teacher", "student"], required: true },
    displayName: { type: String, required: true, trim: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null },
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

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-qef";
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_DISPLAY = process.env.ADMIN_DISPLAY || "Administrator";
const ADMIN_RESET = process.env.ADMIN_RESET === "1";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    if (ADMIN_RESET) {
      existing.hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      existing.role = "admin";
      await existing.save();
      console.log(`Reset password for admin "${ADMIN_USERNAME}" to: ${ADMIN_PASSWORD}`);
    } else {
      console.log(
        `Admin "${ADMIN_USERNAME}" already exists — skipping. ` +
          `Use ADMIN_RESET=1 to reset its password.`
      );
    }
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      username: ADMIN_USERNAME,
      hashedPassword,
      role: "admin",
      displayName: ADMIN_DISPLAY,
      school: null,
      subjects: [],
    });
    console.log(`Created admin "${ADMIN_USERNAME}" (password: ${ADMIN_PASSWORD}).`);
    console.log("Log in and change the password from the admin UI.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
