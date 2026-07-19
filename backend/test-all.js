// backend/test-api.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testAPI() {
  try {
    // Test registration
    console.log("📝 Testing registration...");
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      email: "test@example.com",
      password: "password123",
      role: "recruiter",
    });
    console.log("✅ Registration successful:", registerRes.data);

    // Test login
    console.log("\n🔐 Testing login...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });
    console.log("✅ Login successful, token received");

    // Test protected route
    console.log("\n👤 Testing protected route...");
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${loginRes.data.token}` },
    });
    console.log("✅ User data:", meRes.data);
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testAPI();
