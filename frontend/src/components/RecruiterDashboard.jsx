// frontend/src/components/RecruiterDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { jobs, getSocket } from "../services/api";
import CandidateRanking from "./CandidateRanking";

function RecruiterDashboard() {
  const [jobList, setJobList] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, topScore: 0 });
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    minExperience: "",
    location: "",
    employmentType: "Full-time",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await jobs.getAll();
      setJobList(response.data.data);
      if (response.data.data.length > 0 && !selectedJob) {
        setSelectedJob(response.data.data[0]);
        fetchCandidates(response.data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);
  console.log(candidates);
  // In RecruiterDashboard.jsx, update the fetchCandidates function:

  const fetchCandidates = async (jobId) => {
    try {
      console.log("Fetching candidates for job:", jobId);
      const response = await jobs.getCandidates(jobId);
      console.log("Candidates response:", response.data);

      // The response structure might be different
      let candidatesList = [];
      if (response.data.candidates) {
        candidatesList = response.data.candidates;
      } else if (Array.isArray(response.data)) {
        candidatesList = response.data;
      }

      setCandidates(candidatesList);

      const scores = candidatesList.map((c) => c.score || 0);
      const avg = scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : 0;
      setStats({
        total: candidatesList.length,
        avgScore: avg,
        topScore: scores.length ? Math.max(...scores) : 0,
      });
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchJobs();

    const socket = getSocket();
    if (socket) {
      socket.on("new-application", () => {
        if (selectedJob) fetchCandidates(selectedJob._id);
      });
      socket.on("analysis-complete", () => {
        if (selectedJob) fetchCandidates(selectedJob._id);
      });
    }

    return () => {
      if (socket) {
        socket.off("new-application");
        socket.off("analysis-complete");
      }
    };
  }, [fetchJobs, selectedJob]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await jobs.create({
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(",").map((s) => s.trim()),
      });
      setShowCreateForm(false);
      setNewJob({
        title: "",
        description: "",
        requiredSkills: "",
        minExperience: "",
        location: "",
        employmentType: "Full-time",
      });
      fetchJobs();
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job. Please try again.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      try {
        await jobs.delete(jobId);
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Failed to delete job.");
      }
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading dashboard...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create New Job
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Job</h2>
          <form onSubmit={handleCreateJob}>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Job Title"
                className="p-2 border rounded"
                value={newJob.title}
                onChange={(e) =>
                  setNewJob({ ...newJob, title: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Location"
                className="p-2 border rounded"
                value={newJob.location}
                onChange={(e) =>
                  setNewJob({ ...newJob, location: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Minimum Experience (years)"
                className="p-2 border rounded"
                value={newJob.minExperience}
                onChange={(e) =>
                  setNewJob({ ...newJob, minExperience: e.target.value })
                }
                required
              />
              <select
                className="p-2 border rounded"
                value={newJob.employmentType}
                onChange={(e) =>
                  setNewJob({ ...newJob, employmentType: e.target.value })
                }
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </select>
              <input
                type="text"
                placeholder="Required Skills (comma separated)"
                className="p-2 border rounded md:col-span-2"
                value={newJob.requiredSkills}
                onChange={(e) =>
                  setNewJob({ ...newJob, requiredSkills: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Job Description"
                className="p-2 border rounded md:col-span-2"
                rows="4"
                value={newJob.description}
                onChange={(e) =>
                  setNewJob({ ...newJob, description: e.target.value })
                }
                required
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Create Job
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-gray-600">Total Jobs</h3>
          <p className="text-2xl font-bold">{jobList.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-gray-600">Total Candidates</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-gray-600">Average Score</h3>
          <p className="text-2xl font-bold">{stats.avgScore}%</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="text-gray-600">Top Score</h3>
          <p className="text-2xl font-bold">{stats.topScore}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Your Jobs</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jobList.map((job) => (
              <div
                key={job._id}
                className={`p-3 rounded cursor-pointer transition ${
                  selectedJob?._id === job._id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setSelectedJob(job);
                  fetchCandidates(job._id);
                }}
              >
                <p className="font-semibold">{job.title}</p>
                <p className="text-sm opacity-75">{job.location}</p>
                <p className="text-xs mt-1">
                  📊 {job.applicationsCount || 0} applicants
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteJob(job._id);
                  }}
                  className="text-xs text-red-500 mt-1 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedJob && (
            <>
              <div className="bg-white border rounded-lg p-4 mb-4">
                <h2 className="text-xl font-semibold mb-2">
                  {selectedJob.title}
                </h2>
                <p className="text-gray-600 mb-2">📍 {selectedJob.location}</p>
                <p className="text-gray-600 mb-2">
                  💼 {selectedJob.employmentType}
                </p>
                <p className="text-gray-700">{selectedJob.description}</p>
                <div className="mt-3">
                  <p className="text-sm font-semibold">Required Skills:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedJob.requiredSkills?.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <CandidateRanking
                candidates={candidates}
                jobTitle={selectedJob.title}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
