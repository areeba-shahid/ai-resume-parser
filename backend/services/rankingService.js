// backend/services/rankingService.js
const Job = require("../models/Job");

const calculateRanking = async (jobId) => {
  try {
    const job = await Job.findById(jobId).populate("candidates.candidateId");

    if (!job) return;

    // Sort candidates by score (descending)
    const sortedCandidates = job.candidates.sort((a, b) => b.score - a.score);

    // Update ranks
    for (let i = 0; i < sortedCandidates.length; i++) {
      sortedCandidates[i].rank = i + 1;
    }

    job.candidates = sortedCandidates;
    await job.save();

    return sortedCandidates;
  } catch (error) {
    console.error("Error calculating rankings:", error);
    throw error;
  }
};

const getRankingForCandidate = (job, candidateId) => {
  const candidate = job.candidates.find(
    (c) => c.candidateId.toString() === candidateId.toString()
  );
  return candidate ? candidate.rank : null;
};

module.exports = { calculateRanking, getRankingForCandidate };
