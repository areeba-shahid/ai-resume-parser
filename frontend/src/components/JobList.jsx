// frontend/src/components/JobList.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jobs, candidates } from "../services/api";

function JobList() {
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedJobs, setAppliedJobs] = useState({});
  const [checkingStatus, setCheckingStatus] = useState(false);

  const navigate = useNavigate();

  // ✅ Fetch all jobs
  const fetchJobs = async () => {
    try {
      const response = await jobs.getAll();
      setJobList(response.data.data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check single job application
  const checkAppliedStatus = useCallback(async (jobId) => {
    try {
      const response = await candidates.checkApplication(jobId);
      return response.data.hasApplied;
    } catch (error) {
      console.error("Error checking application status:", error);
      return false;
    }
  }, []);

  // ✅ Initial jobs fetch
  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ FAST: Check all jobs in parallel (FIXED)
  useEffect(() => {
    const checkAllJobs = async () => {
      if (jobList.length === 0) return;

      setCheckingStatus(true);

      try {
        const results = await Promise.all(
          jobList.map(async (job) => {
            const hasApplied = await checkAppliedStatus(job._id);
            return { jobId: job._id, hasApplied };
          })
        );

        const appliedStatus = {};
        results.forEach(({ jobId, hasApplied }) => {
          appliedStatus[jobId] = hasApplied;
        });

        setAppliedJobs(appliedStatus);
      } catch (error) {
        console.error("Error checking all jobs:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAllJobs();
  }, [jobList, checkAppliedStatus]);

  // ✅ Search filter
  const filteredJobs = jobList.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills?.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ✅ Loading screen
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Available Positions</h1>
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Checking status */}
      {checkingStatus && (
        <div className="text-center py-4 text-gray-500">
          Checking your applications...
        </div>
      )}

      {/* No jobs */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="border rounded-lg p-6 shadow-sm hover:shadow-md transition bg-white"
            >
              <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
              <p className="text-gray-600 mb-2">📍 {job.location}</p>
              <p className="text-gray-600 mb-2">
                💼 {job.employmentType || "Full-time"}
              </p>
              <p className="text-gray-600 mb-2">
                🎓 Min {job.minExperience} years exp
              </p>

              <p className="text-gray-700 mb-4 line-clamp-3">
                {job.description}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600">
                  Required Skills:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {job.requiredSkills?.slice(0, 4).map((skill, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Button */}
              {checkingStatus ? (
                <button className="w-full bg-gray-200 py-2 rounded">
                  Checking...
                </button>
              ) : appliedJobs[job._id] ? (
                <button
                  disabled
                  className="w-full bg-green-100 text-green-600 py-2 rounded cursor-not-allowed"
                >
                  ✓ Applied
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/apply/${job._id}`)}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Apply Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobList;
