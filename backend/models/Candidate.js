// backend/models/Candidate.js
const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "",
  },
  phone: String,
  resumeUrl: String,
  resumePublicId: String,
  appliedJobs: [
    {
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      skills: [String],
      experience: {
        type: Number,
        default: 0,
      },
      analysis: String,
      status: {
        type: String,
        enum: ["pending", "processing", "analyzed", "shortlisted", "rejected"],
        default: "pending",
      },
    },
  ],
  extractedData: {
    skills: [String],
    experience: Number,
    education: String,
    certifications: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Candidate", CandidateSchema);
