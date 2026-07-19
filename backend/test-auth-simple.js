// backend/test-auth-simple.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testAuthSimple() {
  console.log("🧪 Simple Auth Test\n");

  try {
    // Test 1: Login
    console.log("1️⃣ Testing login with test@example.com...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    console.log("✅ Login successful!");
    console.log("   User ID:", loginRes.data._id);
    console.log("   Email:", loginRes.data.email);
    console.log("   Role:", loginRes.data.role);
    console.log("   Token received:", loginRes.data.token ? "Yes" : "No");
    console.log(
      "   Token length:",
      loginRes.data.token ? loginRes.data.token.length : 0
    );

    const token = loginRes.data.token;

    // Test 2: Try with exact headers
    console.log("\n2️⃣ Testing protected route with exact headers...");
    try {
      const meRes = await axios({
        method: "GET",
        url: `${BASE_URL}/auth/me`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log("✅ Protected route accessible!");
      console.log("   User info:", meRes.data);
    } catch (error) {
      console.error("❌ Protected route failed");
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data?.message);
      console.error("   Full error:", error.response?.data);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testAuthSimple();
