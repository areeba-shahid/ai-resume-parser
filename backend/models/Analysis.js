// backend/models/Analysis.js
const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  skillMatch: {
    score: Number,
    matched: [String],
    missing: [String],
    partial: [String],
  },
  experienceMatch: {
    score: Number,
    years: Number,
    relevance: Number,
  },
  educationMatch: {
    score: Number,
    matches: [String],
  },
  detailedAnalysis: String,
  recommendations: [String],
  aiModel: String,
  processingTime: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
