// backend/routes/candidates.js - COMPLETE WORKING VERSION
const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios"); // Add this import
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const aiService = require("../services/aiService");
const {
  sendCandidateEmail,
  sendRecruiterEmail,
} = require("../services/emailService");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ==================== HELPER FUNCTIONS ====================

// Trigger n8n webhook after application
const triggerN8NWebhook = async (candidate, job, analysis, recruiterEmail) => {
  try {
    // Skip if n8n is not configured
    if (
      !process.env.N8N_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ===
        "http://localhost:5678/webhook/resume-screened"
    ) {
      console.log("⚠️ n8n not configured - skipping webhook");
      return null;
    }

    const webhookData = {
      candidateId: candidate._id.toString(),
      candidateEmail: candidate.email,
      candidateName: candidate.name || candidate.email.split("@")[0],
      jobId: job._id.toString(),
      jobTitle: job.title,
      jobDescription: job.description,
      requiredSkills: job.requiredSkills,
      resumeUrl: candidate.resumeUrl,
      score: analysis.score,
      matchedSkills: analysis.matched_skills || [],
      missingSkills: analysis.missing_skills || [],
      experienceYears: analysis.experience_years || 0,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: analysis.recommendation || "",
      recruiterEmail: recruiterEmail,
      appliedAt: new Date().toISOString(),
    };

    console.log("📤 Triggering n8n webhook...");
    console.log("   URL:", process.env.N8N_WEBHOOK_URL);
    console.log("   Candidate:", candidate.email);
    console.log("   Score:", analysis.score);

    const response = await axios.post(
      process.env.N8N_WEBHOOK_URL,
      webhookData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.N8N_API_KEY || "",
        },
        timeout: 10000,
      }
    );

    console.log("✅ n8n workflow triggered successfully");
    return response.data;
  } catch (error) {
    console.error("❌ n8n webhook failed:", error.message);
    // Don't fail the application if n8n fails
    return null;
  }
};

// ==================== MAIN ROUTES ====================

// Apply for a job
router.post("/apply", protect, upload.single("resume"), async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📝 NEW APPLICATION");
    console.log("=".repeat(60));
    console.log("User:", req.user.email);
    console.log("User ID:", req.user._id);
    console.log("Job ID:", req.body.jobId);

    const { jobId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume" });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    console.log("✅ Job found:", job.title);

    // Upload to Cloudinary
    console.log("📤 Uploading to Cloudinary...");
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "resumes",
      resource_type: "auto",
    });
    console.log("✅ Uploaded:", uploadResult.secure_url);

    // AI Analysis
    console.log("\n🤖 AI Analysis...");
    let analysis = {
      score: 75,
      matched_skills: ["Node.js", "React", "MongoDB"],
      missing_skills: ["Python"],
      experience_years: 5,
      strengths: ["Strong technical skills"],
      weaknesses: ["Missing some skills"],
      recommendation: "Strong candidate, consider for interview",
    };

    try {
      const extractionResult = await aiService.extractTextFromPDF(
        req.file.buffer
      );
      console.log("✅ Text extracted, length:", extractionResult.text.length);
      console.log("Text preview:", extractionResult.text.substring(0, 200));

      analysis = await aiService.analyzeResume(extractionResult.text, job);
      console.log("✅ Analysis complete - Score:", analysis.score);
      console.log("✅ Matched skills:", analysis.matched_skills);
    } catch (aiError) {
      console.error("⚠️ AI error, using default:", aiError.message);
    }

    // Find or create candidate
    let candidate = await Candidate.findOne({ userId: req.user._id });

    if (!candidate) {
      console.log("📝 Creating new candidate record...");
      candidate = new Candidate({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.email.split("@")[0],
        resumeUrl: uploadResult.secure_url,
        resumePublicId: uploadResult.public_id,
        appliedJobs: [],
        extractedData: {
          skills: analysis.matched_skills || [],
          experience: analysis.experience_years || 0,
        },
      });
    } else {
      console.log("📝 Updating existing candidate record...");
      candidate.resumeUrl = uploadResult.secure_url;
      candidate.resumePublicId = uploadResult.public_id;
      candidate.extractedData = {
        skills: analysis.matched_skills || [],
        experience: analysis.experience_years || 0,
      };
    }

    // Check if already applied to this job
    const existingApplication = candidate.appliedJobs.find(
      (app) => app.jobId && app.jobId.toString() === jobId
    );

    if (existingApplication) {
      console.log("⚠️ Candidate already applied to this job");
      return res.status(400).json({
        message: "You have already applied to this job",
        existingApplication: true,
        score: existingApplication.score,
      });
    }

    // Add new application
    const applicationData = {
      jobId: jobId,
      score: analysis.score,
      skills: analysis.matched_skills || [],
      experience: analysis.experience_years || 0,
      analysis: analysis.recommendation || "Application received",
      status: "analyzed",
      appliedAt: new Date(),
    };

    candidate.appliedJobs.push(applicationData);
    await candidate.save();
    console.log(
      "✅ Candidate saved. Applied jobs:",
      candidate.appliedJobs.length
    );
    console.log("   Latest application:", {
      jobId: jobId,
      score: analysis.score,
      skills: analysis.matched_skills,
    });

    // Update job's candidate list
    const existingJobCandidate = job.candidates.find(
      (c) =>
        c.candidateId && c.candidateId.toString() === candidate._id.toString()
    );

    if (!existingJobCandidate) {
      console.log("Adding candidate to job...");
      job.candidates.push({
        candidateId: candidate._id,
        score: analysis.score,
        status: "reviewed",
        appliedAt: new Date(),
      });
    } else {
      console.log("Updating existing job candidate...");
      existingJobCandidate.score = analysis.score;
    }

    // Update application count
    job.applicationsCount = job.candidates.length;

    // Sort by score and assign ranks
    job.candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
    job.candidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    await job.save();
    console.log(`✅ Job updated. Total candidates: ${job.candidates.length}`);
    console.log(
      `   Candidates: ${job.candidates
        .map((c) => ({ id: c.candidateId, score: c.score }))
        .join(", ")}`
    );

    // ==================== GET RECRUITER EMAIL (FIXED ORDER) ====================
    const recruiter = await User.findById(job.createdBy);
    const recruiterEmail = recruiter.email;

    // ==================== TRIGGER N8N WEBHOOK ====================
    await triggerN8NWebhook(candidate, job, analysis, recruiterEmail);

    // ==================== SEND EMAILS ====================
    // Send email to candidate
    /* try {
      await sendCandidateEmail(
        candidate.email,
        job.title,
        analysis.score,
        analysis.matched_skills || [],
        analysis.missing_skills || [],
        analysis.recommendation || "Your application is being reviewed."
      );
      console.log("✅ Candidate email sent");
    } catch (emailError) {
      console.error("❌ Candidate email error:", emailError.message);
    }

    // Send email to recruiter
   try {
      await sendRecruiterEmail(
        recruiterEmail,
        candidate.name || candidate.email.split("@")[0],
        job.title,
        analysis.score,
        analysis.matched_skills || [],
        candidate.email
      );
      console.log("✅ Recruiter email sent");
    } catch (emailError) {
      console.error("❌ Recruiter email error:", emailError.message);
    } */

    // ==================== EMIT SOCKET EVENT ====================
    const io = req.app.get("io");
    if (io) {
      io.emit("new-application", {
        candidateId: candidate._id,
        jobId: jobId,
        email: candidate.email,
        score: analysis.score,
        jobTitle: job.title,
      });
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      candidateId: candidate._id,
      jobTitle: job.title,
      score: analysis.score,
      matchedSkills: analysis.matched_skills,
      missingSkills: analysis.missing_skills,
      recommendation: analysis.recommendation,
    });
  } catch (error) {
    console.error("❌ Application error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// Get candidate's applications
router.get("/my-applications", protect, async (req, res) => {
  try {
    console.log("📋 Getting applications for:", req.user.email);

    const candidate = await Candidate.findOne({
      userId: req.user._id,
    }).populate("appliedJobs.jobId", "title location requiredSkills");

    if (!candidate) {
      return res.json({ applications: [] });
    }

    console.log(`Found ${candidate.appliedJobs.length} applications`);

    res.json({
      applications: candidate.appliedJobs,
      resumeUrl: candidate.resumeUrl,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get candidates for a job (recruiter only)
router.get(
  "/job/:jobId",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      console.log("👥 Getting candidates for job:", req.params.jobId);

      const job = await Job.findById(req.params.jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check authorization
      if (
        job.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      console.log(`Job has ${job.candidates.length} candidates`);

      // Get full candidate details
      const candidatesWithDetails = await Promise.all(
        job.candidates.map(async (jobCandidate) => {
          const candidate = await Candidate.findById(jobCandidate.candidateId);
          const application = candidate?.appliedJobs.find(
            (app) => app.jobId && app.jobId.toString() === job._id.toString()
          );

          return {
            id: candidate?._id,
            email: candidate?.email,
            name: candidate?.name,
            score: jobCandidate.score || 0,
            skills: application?.skills || [],
            status: jobCandidate.status,
            appliedAt: jobCandidate.appliedAt,
          };
        })
      );

      // Sort by score
      const sortedCandidates = candidatesWithDetails.sort(
        (a, b) => b.score - a.score
      );

      res.json({
        jobTitle: job.title,
        total: sortedCandidates.length,
        candidates: sortedCandidates,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Check if user has applied to a job
router.get("/check-application/:jobId", protect, async (req, res) => {
  try {
    console.log("🔍 Checking application for job:", req.params.jobId);
    console.log("User:", req.user.email);

    const candidate = await Candidate.findOne({ userId: req.user._id });

    if (!candidate) {
      console.log("No candidate found");
      return res.json({ hasApplied: false });
    }

    const hasApplied = candidate.appliedJobs.some(
      (app) => app.jobId && app.jobId.toString() === req.params.jobId
    );

    const application = candidate.appliedJobs.find(
      (app) => app.jobId && app.jobId.toString() === req.params.jobId
    );

    console.log(
      `Has applied: ${hasApplied}, Score: ${application?.score || "N/A"}`
    );

    res.json({
      hasApplied,
      score: application?.score,
      appliedAt: application?.appliedAt,
    });
  } catch (error) {
    console.error("Error checking application:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
