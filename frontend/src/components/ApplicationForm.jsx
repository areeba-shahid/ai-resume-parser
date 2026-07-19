// frontend/src/components/ApplicationForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { jobs, candidates } from "../services/api";

function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const fetchJob = useCallback(async () => {
    try {
      const response = await jobs.getById(jobId);
      setJob(response.data.data);
    } catch (error) {
      console.error("Error fetching job:", error);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
    maxFiles: 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume (PDF)");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobId", jobId);

    try {
      const response = await candidates.apply(formData);
      setSuccess({
        score: response.data.score,
        matchedSkills: response.data.matchedSkills,
        recommendation: response.data.recommendation,
      });

      setTimeout(() => {
        navigate("/jobs");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Application failed");
    } finally {
      setUploading(false);
    }
  };

  if (!job)
    return <div className="text-center py-8">Loading job details...</div>;

  // Add this after successful submission
  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">✅ Application Submitted!</h2>
          <div className="text-4xl font-bold my-4">{success.score}%</div>
          <p className="mb-2">
            <strong>Matched Skills:</strong>{" "}
            {success.matchedSkills?.join(", ") || "None"}
          </p>
          <p className="mb-4">{success.recommendation}</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => navigate("/my-applications")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View My Applications
            </button>
            <button
              onClick={() => navigate("/jobs")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Browse More Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Apply for {job.title}</h1>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-gray-600 mb-2">📍 {job.location}</p>
        <p className="text-gray-600 mb-2">
          💼 {job.employmentType || "Full-time"}
        </p>
        <p className="text-gray-600 mb-2">
          🎓 {job.minExperience}+ years experience required
        </p>
        <p className="text-gray-700 mt-3">{job.description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Upload Resume (PDF)
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500"
              }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="text-green-600">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p>{file.name}</p>
                <p className="text-sm text-gray-500">Click to change file</p>
              </div>
            ) : isDragActive ? (
              <p>Drop your resume here...</p>
            ) : (
              <div>
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p>Drag & drop your resume here, or click to select</p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF files only (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? "Analyzing Resume..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

export default ApplicationForm;
