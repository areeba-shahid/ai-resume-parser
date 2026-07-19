// backend/test-jobs.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testJobRoutes() {
  try {
    console.log("🚀 Testing Job Routes\n");

    // 1. Login first
    console.log("1️⃣ Logging in...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginRes.data.token;
    console.log("✅ Logged in successfully\n");

    // 2. Create a job
    console.log("2️⃣ Creating a job...");
    const jobData = {
      title: "Senior Software Engineer",
      description:
        "We are looking for an experienced software engineer to join our team. You will be responsible for building scalable applications and mentoring junior developers.",
      requiredSkills: ["JavaScript", "Node.js", "React", "MongoDB"],
      preferredSkills: ["TypeScript", "AWS", "Docker", "Kubernetes"],
      minExperience: 5,
      maxExperience: 8,
      education: "Bachelor's Degree in Computer Science or related field",
      department: "Engineering",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      salary: {
        min: 140000,
        max: 180000,
        currency: "USD",
      },
    };

    const createRes = await axios.post(`${BASE_URL}/jobs`, jobData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Job created:", {
      id: createRes.data.data._id,
      title: createRes.data.data.title,
    });

    const jobId = createRes.data.data._id;

    // 3. Get all jobs
    console.log("\n3️⃣ Getting all jobs...");
    const jobsRes = await axios.get(`${BASE_URL}/jobs`);
    console.log(`✅ Found ${jobsRes.data.count} jobs`);
    if (jobsRes.data.data && jobsRes.data.data.length > 0) {
      console.log(`   First job: ${jobsRes.data.data[0].title}`);
    }

    // 4. Get single job
    console.log("\n4️⃣ Getting job details...");
    const jobRes = await axios.get(`${BASE_URL}/jobs/${jobId}`);
    console.log("✅ Job details:", {
      title: jobRes.data.data.title,
      location: jobRes.data.data.location,
      requiredSkills: jobRes.data.data.requiredSkills.length,
      views: jobRes.data.data.views,
    });

    // 5. Update the job
    console.log("\n5️⃣ Updating the job...");
    const updateRes = await axios.put(
      `${BASE_URL}/jobs/${jobId}`,
      {
        location: "Remote",
        salary: { min: 150000, max: 200000, currency: "USD" },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✅ Job updated:", {
      location: updateRes.data.data.location,
      salary: updateRes.data.data.salary,
    });

    // 6. Get job candidates (should be empty initially)
    console.log("\n6️⃣ Getting candidates for job...");
    const candidatesRes = await axios.get(
      `${BASE_URL}/jobs/${jobId}/candidates`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`✅ Found ${candidatesRes.data.total} candidates`);

    console.log("\n✨ All job route tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.data) {
      console.error("Error details:", error.response.data);
    }
  }
}

testJobRoutes();
