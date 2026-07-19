// backend/routes/webhooks.js
const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Analysis = require("../models/Analysis");
const webhookAuth = require("../middleware/webhookAuth");
const { sendEmailReport } = require("../services/emailService");
const { calculateRanking } = require("../services/rankingService");

// @route   POST /api/webhooks/resume-screened
// @desc    Receive processed resume data from n8n
router.post("/resume-screened", webhookAuth, async (req, res) => {
  try {
    const {
      candidateId,
      jobId,
      score,
      skills,
      experience,
      education,
      analysis,
      recommendations,
    } = req.body;

    // Find candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Find job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Update candidate with extracted data
    const appliedJobIndex = candidate.appliedJobs.findIndex(
      (job) => job.jobId.toString() === jobId
    );

    if (appliedJobIndex !== -1) {
      candidate.appliedJobs[appliedJobIndex].score = score;
      candidate.appliedJobs[appliedJobIndex].skills = skills;
      candidate.appliedJobs[appliedJobIndex].experience = experience;
      candidate.appliedJobs[appliedJobIndex].analysis = analysis;
      candidate.appliedJobs[appliedJobIndex].status = "analyzed";
    }

    // Update candidate extracted data
    candidate.extractedData = {
      skills: skills || [],
      experience: {
        total: experience || 0,
        relevant: experience || 0,
      },
      education: education || [],
    };

    await candidate.save();

    // Create analysis record
    const analysisRecord = new Analysis({
      candidateId,
      jobId,
      score,
      skillMatch: {
        score: score,
        matched: skills || [],
        missing: [],
      },
      experienceMatch: {
        score: experience ? Math.min(experience * 10, 100) : 0,
        years: experience || 0,
        relevance: 100,
      },
      educationMatch: {
        score: 100,
        matches: education || [],
      },
      detailedAnalysis: analysis,
      recommendations: recommendations || [],
    });

    await analysisRecord.save();

    // Add candidate to job's candidate list if not already there
    const existingCandidate = job.candidates.find(
      (c) => c.candidateId.toString() === candidateId
    );

    if (!existingCandidate) {
      job.candidates.push({
        candidateId,
        score,
        status: "new",
      });
    } else {
      existingCandidate.score = score;
    }

    await job.save();

    // Calculate and update rankings for all candidates for this job
    await calculateRanking(jobId);

    // Send email report to candidate
    try {
      await sendEmailReport(candidate.email, {
        name: candidate.name || "Candidate",
        jobTitle: job.title,
        score,
        skills,
        analysis,
        recommendations,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the request if email fails
    }

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.emit("analysis-complete", {
      candidateId,
      jobId,
      score,
    });

    res.json({
      success: true,
      message: "Resume data processed successfully",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/webhooks/error
// @desc    Handle n8n workflow errors
router.post("/error", webhookAuth, async (req, res) => {
  try {
    const { workflowId, error, candidateId, jobId } = req.body;

    console.error("n8n workflow error:", {
      workflowId,
      error,
      candidateId,
      jobId,
      timestamp: new Date().toISOString(),
    });

    // Update candidate status to failed
    if (candidateId) {
      await Candidate.findByIdAndUpdate(
        candidateId,
        {
          "appliedJobs.$[elem].status": "failed",
        },
        {
          arrayFilters: [{ "elem.jobId": jobId }],
        }
      );
    }

    // Emit error event
    const io = req.app.get("io");
    io.emit("analysis-error", {
      candidateId,
      jobId,
      error: error.message,
    });

    res.json({ success: true, message: "Error logged" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// POST /api/webhooks/n8n-callback
router.post("/n8n-callback", async (req, res) => {
  try {
    const { candidateId, score, status } = req.body;

    console.log("📥 Received callback from n8n:", {
      candidateId,
      score,
      status,
    });

    // Update candidate status based on n8n decision
    await Candidate.findOneAndUpdate(
      { _id: candidateId, "appliedJobs.jobId": req.body.jobId },
      {
        $set: {
          "appliedJobs.$.status": status,
          "appliedJobs.$.n8nProcessed": true,
          "appliedJobs.$.n8nProcessedAt": new Date(),
        },
      }
    );

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("n8n-update", {
        candidateId,
        score,
        status,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: "Callback processed" });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = router;
