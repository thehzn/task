
require("dotenv").config({ path: "./config/config.env" });
const mongoose = require("mongoose");
const User = require("./models/userSchema");

(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Admin", MONGO_URI } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD first.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = "admin";
      await existing.save();
      console.log(`Existing user ${email} promoted to admin.`);
    } else {
      await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, age: 30, role: "admin" });
      console.log(`Admin ${email} created.`);
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
