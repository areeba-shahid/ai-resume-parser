// backend/test-user-model.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function testUserModel() {
  try {
    console.log("🔍 Testing User Model...\n");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Delete existing test user
    await User.deleteMany({ email: "test@example.com" });
    console.log("🗑️  Cleaned up existing test users\n");

    // Create a new user
    console.log("📝 Creating a new user...");
    const user = new User({
      email: "test@example.com",
      password: "password123",
      role: "recruiter",
    });

    await user.save();
    console.log("✅ User created successfully!");
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...\n`);

    // Test password comparison
    console.log("🔐 Testing password comparison...");
    const isMatch = await user.comparePassword("password123");
    console.log(`   Password 'password123' matches: ${isMatch}`);

    const isMatchWrong = await user.comparePassword("wrongpassword");
    console.log(`   Password 'wrongpassword' matches: ${isMatchWrong}\n`);

    // Find the user
    console.log("🔍 Finding user by email...");
    const foundUser = await User.findOne({ email: "test@example.com" });
    console.log(`   Found: ${foundUser.email} (${foundUser.role})\n`);

    console.log("✨ All user model tests passed!");

    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error stack:", error.stack);
    await mongoose.disconnect();
  }
}

testUserModel();
