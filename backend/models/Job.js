// backend/models/Job.js
const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Job description is required"],
  },
  requiredSkills: [
    {
      type: String,
      required: true,
    },
  ],
  preferredSkills: [String],
  minExperience: {
    type: Number,
    required: true,
    min: 0,
  },
  maxExperience: {
    type: Number,
    min: 0,
  },
  education: String,
  department: String,
  location: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Remote", "Hybrid"],
    default: "Full-time",
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: "USD",
    },
  },
  status: {
    type: String,
    enum: ["active", "closed", "draft"],
    default: "active",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidates: [
    {
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
      score: {
        type: Number,
        default: 0,
      },
      rank: Number,
      status: {
        type: String,
        enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
        default: "pending",
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  applicationsCount: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
JobSchema.index({ title: "text", description: "text" });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ location: 1, employmentType: 1 });

module.exports = mongoose.model("Job", JobSchema);
