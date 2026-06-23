// One-off: create (or reset) the platform admin account.
// Runs inside the running app container, which has MONGODB_URI set and mongoose
// bundled in /app/node_modules. bcryptjs is NOT available there (it gets bundled
// into the Next server output), so the password hash is precomputed below.
//
//   docker cp seed-admin.cjs $(sudo docker compose ps -q app):/app/seed-admin.cjs
//   sudo docker compose exec app node /app/seed-admin.cjs
//
// Login credentials created by this script:
//   username: admin
//   password: admin123      <-- change it from the admin UI after first login

const mongoose = require("mongoose");

const USERNAME = "admin";
// bcrypt hash of "admin123" (cost 12).
const HASHED_PASSWORD = "$2b$12$dyf1Z95d3mX7se8U0k.CreH1m43f4Pdn8MLLym6ffcXPZVt9Zu1PS";
const DISPLAY = "Administrator";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema(
        {
          username: String,
          hashedPassword: String,
          role: String,
          displayName: String,
          school: { type: mongoose.Schema.Types.ObjectId, default: null },
          subjects: [String],
        },
        { timestamps: true, strict: false }
      )
    );

  const existing = await User.findOne({ username: USERNAME });

  if (existing) {
    existing.hashedPassword = HASHED_PASSWORD;
    existing.role = "admin";
    existing.school = null;
    await existing.save();
    console.log('Reset existing user "admin" to admin. Password: admin123');
  } else {
    await User.create({
      username: USERNAME,
      hashedPassword: HASHED_PASSWORD,
      role: "admin",
      displayName: DISPLAY,
      school: null,
      subjects: [],
    });
    console.log('Created admin "admin". Password: admin123');
  }

  await mongoose.disconnect();
  console.log("Done.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
