// frontend/src/components/CandidateRanking.jsx
import React from "react";

function CandidateRanking({ candidates, jobTitle }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
        No candidates have applied for this position yet.
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-blue-100";
    if (score >= 40) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getBadge = (score) => {
    if (score >= 80) return "🏆 Top Candidate";
    if (score >= 60) return "⭐ Strong Match";
    if (score >= 40) return "📋 Potential Match";
    return "🔍 Needs Review";
  };

  // Helper function to get candidate email from nested structure
  const getCandidateEmail = (candidate) => {
    // Check if candidate has direct email property
    if (candidate.email) return candidate.email;
    // Check if candidate has nested candidateId with email
    if (candidate.candidateId && candidate.candidateId.email)
      return candidate.candidateId.email;
    return "Unknown";
  };

  // Helper function to get candidate skills
  const getCandidateSkills = (candidate) => {
    // Check if candidate has direct skills property
    if (candidate.skills && candidate.skills.length > 0)
      return candidate.skills;
    // Check if candidate has nested candidateId with skills
    if (candidate.candidateId && candidate.candidateId.extractedData?.skills)
      return candidate.candidateId.extractedData.skills;
    return [];
  };

  // Helper function to get applied date
  const getAppliedDate = (candidate) => {
    if (candidate.appliedAt) return candidate.appliedAt;
    return new Date().toISOString();
  };

  console.log("CandidateRanking received:", candidates);

  return (
    <div className="bg-white border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">
        Candidate Rankings for {jobTitle}
      </h2>
      <div className="space-y-3">
        {candidates.map((candidate, index) => {
          const email = getCandidateEmail(candidate);
          const skills = getCandidateSkills(candidate);
          const appliedAt = getAppliedDate(candidate);
          const score = candidate.score || 0;

          return (
            <div
              key={candidate.id || candidate._id || index}
              className="border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {candidate.rank || index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded ${getScoreBg(
                      score
                    )} mt-1`}
                  >
                    {getBadge(score)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied: {new Date(appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CandidateRanking;
