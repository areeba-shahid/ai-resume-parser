// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["candidate", "recruiter", "admin"],
    default: "candidate",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving - CORRECT SYNTAX FOR MONGODB v7+
UserSchema.pre("save", async function () {
  // Only hash the password if it has been modified
  if (!this.isModified("password")) return;

  // Generate salt and hash
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
