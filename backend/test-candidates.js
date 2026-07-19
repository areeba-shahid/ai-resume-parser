// backend/test-candidates.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testCandidates() {
  try {
    console.log("👥 Testing Candidate System\n");

    // 1. Login as recruiter
    console.log("1️⃣ Logging in as recruiter...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginRes.data.token;
    console.log("✅ Logged in\n");

    // 2. Get jobs
    console.log("2️⃣ Getting jobs...");
    const jobsRes = await axios.get(`${BASE_URL}/jobs`);
    const job = jobsRes.data.data[0];
    console.log(`   Found job: ${job.title}\n`);

    // 3. Get candidates for this job
    console.log("3️⃣ Getting candidates for job...");
    const candidatesRes = await axios.get(
      `${BASE_URL}/candidates/job/${job._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Candidates retrieved:");
    console.log(`   Job: ${candidatesRes.data.jobTitle}`);
    console.log(`   Total: ${candidatesRes.data.total} candidates`);

    if (candidatesRes.data.candidates.length > 0) {
      console.log("\n   Top candidates:");
      candidatesRes.data.candidates.slice(0, 3).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.email} - Score: ${c.score}%`);
      });
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testCandidates();
