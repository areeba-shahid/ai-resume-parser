const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/jobs
// @desc    Get all active jobs (public)
router.get("/", async (req, res) => {
  try {
    const { location, skill, minExperience, page = 1, limit = 10 } = req.query;

    let query = { status: "active" };

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Filter by required skills
    if (skill) {
      query.requiredSkills = { $in: [skill] };
    }

    // Filter by experience
    if (minExperience) {
      query.minExperience = { $lte: parseInt(minExperience) };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const jobs = await Job.find(query)
      .select("-candidates") // Exclude candidates list for privacy
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "email");

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job details (public)
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("createdBy", "email")
      .select("-candidates");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job (recruiter only)
router.post("/", protect, authorize("recruiter", "admin"), async (req, res) => {
  try {
    console.log("Creating job for user:", req.user._id);

    const jobData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Validate required fields
    if (!jobData.title || !jobData.description || !jobData.location) {
      return res.status(400).json({
        message: "Please provide title, description, and location",
      });
    }

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job (recruiter only)
router.put(
  "/:id",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      let job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if user owns this job or is admin
      if (
        job.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this job" });
      }

      job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: "Job updated successfully",
        data: job,
      });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   DELETE /api/jobs/:id
// @desc    Delete a job (recruiter only)
router.delete(
  "/:id",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if user owns this job or is admin
      if (
        job.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this job" });
      }

      await job.deleteOne();

      res.json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   GET /api/jobs/:id/candidates
// @desc    Get candidates for a specific job (recruiter only)
router.get(
  "/:id/candidates",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id).populate({
        path: "candidates.candidateId",
        select: "email name resumeUrl extractedData",
      });

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

      // Sort by score (highest first)
      const sortedCandidates = [...job.candidates].sort(
        (a, b) => b.score - a.score
      );

      res.json({
        success: true,
        jobTitle: job.title,
        total: sortedCandidates.length,
        candidates: sortedCandidates,
      });
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   POST /api/jobs/:id/close
// @desc    Close a job (stop accepting applications)
router.post(
  "/:id/close",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (
        job.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      job.status = "closed";
      await job.save();

      res.json({
        success: true,
        message: "Job closed successfully",
        data: job,
      });
    } catch (error) {
      console.error("Error closing job:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
