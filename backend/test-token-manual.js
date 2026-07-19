// backend/test-token-manual.js
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

async function testTokenManually() {
  console.log("🧪 Manual Token Test\n");

  try {
    // Step 1: Login to get token
    console.log("1️⃣ Logging in...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginRes.data.token;
    console.log("✅ Token received from server");
    console.log("   Token preview:", token.substring(0, 50) + "...");

    // Step 2: Manually verify the token
    console.log("\n2️⃣ Manually verifying token...");
    try {
      const jwtSecret = process.env.JWT_SECRET;
      console.log("   JWT Secret from env:", jwtSecret ? "Present" : "Missing");
      console.log("   JWT Secret length:", jwtSecret ? jwtSecret.length : 0);

      const decoded = jwt.verify(token, jwtSecret);
      console.log("   ✅ Manual verification successful!");
      console.log("   Decoded user ID:", decoded.id);
      console.log(
        "   Expires at:",
        new Date(decoded.exp * 1000).toLocaleString()
      );
    } catch (error) {
      console.error("   ❌ Manual verification failed:", error.message);
    }

    // Step 3: Test with the same token using axios
    console.log("\n3️⃣ Testing protected route with the same token...");
    try {
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("✅ Protected route accessible!");
      console.log("   User data:", meRes.data);
    } catch (error) {
      console.error(
        "❌ Protected route failed:",
        error.response?.data || error.message
      );
      console.error("   Status:", error.response?.status);
      console.error("   Headers sent:", {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
      });
    }

    // Step 4: Test with a new token created here
    console.log("\n4️⃣ Creating new token locally and testing...");
    const newToken = jwt.sign(
      { id: loginRes.data._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    try {
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      console.log("✅ New token works!");
      console.log("   User data:", meRes.data);
    } catch (error) {
      console.error(
        "❌ New token failed:",
        error.response?.data || error.message
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testTokenManually();
