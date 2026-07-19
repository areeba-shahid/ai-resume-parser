// backend/test-jwt.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function testJWT() {
  console.log("🔐 JWT Debug Test\n");

  // Get the secret from environment
  const jwtSecret = process.env.JWT_SECRET;
  console.log(
    "1️⃣ JWT Secret from .env:",
    jwtSecret ? "✅ Found" : "❌ NOT FOUND"
  );
  console.log("   Length:", jwtSecret ? jwtSecret.length : 0);
  console.log(
    "   First 10 chars:",
    jwtSecret ? jwtSecret.substring(0, 10) + "..." : "N/A"
  );

  // Create a test token
  const testId = "69c6484fb3e12affcbdac652";
  console.log("\n2️⃣ Creating test token...");
  const token = jwt.sign({ id: testId }, jwtSecret, { expiresIn: "30d" });
  console.log("   Token created:", token.substring(0, 30) + "...");

  // Verify the token
  console.log("\n3️⃣ Verifying token...");
  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log("   ✅ Token verified successfully!");
    console.log("   Decoded payload:", decoded);
  } catch (error) {
    console.error("   ❌ Token verification failed:", error.message);
  }

  // Test with a different secret
  console.log("\n4️⃣ Testing with wrong secret...");
  try {
    const decoded = jwt.verify(token, "wrong-secret");
    console.log("   This should not happen!");
  } catch (error) {
    console.log("   ✅ Correctly failed with wrong secret:", error.message);
  }

  console.log("\n5️⃣ Environment check:");
  console.log("   NODE_ENV:", process.env.NODE_ENV || "development");
  console.log(
    "   JWT_SECRET in process.env:",
    process.env.JWT_SECRET ? "Yes" : "No"
  );
}

testJWT();
