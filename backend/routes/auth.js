// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router(); // THIS LINE WAS MISSING!

const JWT_SECRET =
  process.env.JWT_SECRET || "your-fallback-secret-key-for-development";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Login attempt:", req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Login successful for:", user.email);

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Register attempt:", req.body.email);

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = new User({
      email,
      password,
      role: role || "candidate",
    });

    await user.save();

    console.log("✅ User created:", user._id);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user (protected)
router.get("/me", protect, (req, res) => {
  try {
    console.log("👤 Me request for:", req.user.email);
    res.json({
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("❌ Me endpoint error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
