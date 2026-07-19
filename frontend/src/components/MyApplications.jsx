// frontend/src/components/MyApplications.jsx
import React, { useState, useEffect } from "react";
import { candidates } from "../services/api";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  //const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await candidates.getMyApplications();
      console.log("Applications:", response.data);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load your applications");
    } finally {
      setLoading(false);
    }
  };
  const sortedApplications = [...applications].sort((a, b) => {
    // If a is deleted, push it down
    if (!a.jobId && b.jobId) return 1;

    // If b is deleted, keep it below
    if (a.jobId && !b.jobId) return -1;

    return 0;
  });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Applications</h1>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            You haven't applied to any jobs yet.
          </p>
          <a
            href="/jobs"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedApplications.map((app, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">
                    {app.jobId?.title || "Deleted by recruiter"}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    📍 {app.jobId?.location || "Location not specified"}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    Applied on: {new Date(app.appliedAt).toLocaleDateString()}
                  </p>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Skills Detected:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {app.skills?.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {(!app.skills || app.skills.length === 0) && (
                        <span className="text-gray-500 text-sm">
                          No skills detected
                        </span>
                      )}
                    </div>
                  </div>

                  {app.analysis && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{app.analysis}</p>
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(app.score)}`}
                  >
                    {app.score}%
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded mt-2 ${getScoreBg(
                      app.score
                    )}`}
                  >
                    {app.score >= 80
                      ? "Excellent Match"
                      : app.score >= 60
                      ? "Good Match"
                      : app.score >= 40
                      ? "Potential Match"
                      : "Needs Improvement"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Status: <span className="capitalize">{app.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyApplications;
