// backend/create-user.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Delete existing test user if exists
    await User.deleteOne({ email: "test@example.com" });
    console.log("🗑️  Removed existing test user");

    // Create new test user
    const user = await User.create({
      email: "test@example.com",
      password: "password123",
      role: "recruiter",
    });

    console.log("✅ Test user created successfully:");
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: password123`);

    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
  }
}

createTestUser();
