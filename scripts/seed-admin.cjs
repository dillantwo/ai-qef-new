/**
 * Plain-JS seed script for running INSIDE the Docker `app` container.
 *
 * The app image is a Next.js standalone build: it has `node`, `mongoose` and
 * `bcryptjs` bundled, and MONGODB_URI is already set in its environment — but
 * it does NOT have `tsx`/`dotenv` or the TypeScript sources. This .cjs file
 * works there with no extra install.
 *
 * Usage (from the repo dir on the server, where docker-compose.yml lives):
 *   docker compose cp scripts/seed-admin.cjs app:/app/seed-admin.cjs
 *   docker compose exec \
 *     -e ADMIN_USERNAME=root \
 *     -e ADMIN_PASSWORD='YourStrongPassword' \
 *     -e ADMIN_DISPLAY='Administrator' \
 *     app node /app/seed-admin.cjs
 *
 * Reset an existing admin's password:
 *   docker compose exec -e ADMIN_RESET=1 -e ADMIN_USERNAME=root \
 *     -e ADMIN_PASSWORD='NewPassword' app node /app/seed-admin.cjs
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_DISPLAY = process.env.ADMIN_DISPLAY || "Administrator";
const ADMIN_RESET = process.env.ADMIN_RESET === "1";

async function seed() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in the environment.");
  }
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    if (ADMIN_RESET) {
      existing.hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      existing.role = "admin";
      await existing.save();
      console.log(`Reset password for admin "${ADMIN_USERNAME}".`);
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
    console.log(`Created admin "${ADMIN_USERNAME}".`);
    console.log("Log in and change the password from the admin UI.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
