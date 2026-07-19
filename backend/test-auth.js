// backend/test-auth.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testAuth() {
  console.log("🧪 Testing Authentication\n");

  try {
    // 1. Register a new user
    console.log("1️⃣ Testing registration...");
    const registerData = {
      email: `user${Date.now()}@example.com`,
      password: "password123",
      role: "recruiter",
    };

    const registerRes = await axios.post(
      `${BASE_URL}/auth/register`,
      registerData
    );
    console.log("✅ Registration successful:", {
      id: registerRes.data._id,
      email: registerRes.data.email,
      role: registerRes.data.role,
    });

    const token = registerRes.data.token;

    // 2. Test login with the same credentials
    console.log("\n2️⃣ Testing login...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password,
    });
    console.log("✅ Login successful, token received");

    // 3. Test protected route
    console.log("\n3️⃣ Testing protected route (/me)...");
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Protected route accessible:", meRes.data);

    console.log("\n✨ All authentication tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testAuth();
