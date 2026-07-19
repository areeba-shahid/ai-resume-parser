// backend/test-upload.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const BASE_URL = "http://localhost:5000/api";

async function testResumeUpload() {
  try {
    console.log("📤 Testing Resume Upload\n");

    // 1. Login
    console.log("1️⃣ Logging in...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginRes.data.token;
    console.log("✅ Logged in\n");

    // 2. Get available jobs
    console.log("2️⃣ Getting available jobs...");
    const jobsRes = await axios.get(`${BASE_URL}/jobs`);
    const job = jobsRes.data.data[0];
    console.log(`   Using job: ${job.title}\n`);

    // 3. Create a sample PDF file (you'll need to have a test.pdf file)
    // For testing without a real PDF, we'll create a simple text file
    console.log("3️⃣ Uploading resume...");

    // Create a simple text file (since we don't have a PDF)
    // In production, you'd upload an actual PDF
    const formData = new FormData();
    formData.append(
      "resume",
      Buffer.from("Sample resume content"),
      "resume.pdf"
    );
    formData.append("jobId", job._id);

    const uploadRes = await axios.post(
      `${BASE_URL}/candidates/apply`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Resume uploaded successfully!");
    console.log("   Message:", uploadRes.data.message);
    console.log("   Candidate ID:", uploadRes.data.candidateId);
    console.log("   Job:", uploadRes.data.jobTitle);
  } catch (error) {
    console.error("❌ Upload failed:", error.response?.data || error.message);
  }
}

testResumeUpload();
