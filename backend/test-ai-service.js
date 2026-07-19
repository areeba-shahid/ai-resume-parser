// backend/test-ai-service.js
const aiService = require("./services/aiService");

async function testAIService() {
  console.log("🧪 Testing AI Service\n");

  const testJob = {
    title: "Senior Software Engineer",
    description:
      "Looking for a full-stack developer with Node.js, React, and MongoDB skills",
    requiredSkills: ["Node.js", "React", "MongoDB", "Python"],
  };

  const testResumeText = `
    Experienced Full Stack Developer with 5+ years in web development.
    Proficient in JavaScript, Node.js, React, and MongoDB.
    Led a team of 3 developers to build a scalable e-commerce platform.
    Strong background in AWS and cloud architecture.
  `;

  try {
    console.log("1️⃣ Testing analyzeResume...");
    const result = await aiService.analyzeResume(testResumeText, testJob);
    console.log("✅ Analysis result:");
    console.log("   Score:", result.score);
    console.log("   Matched Skills:", result.matched_skills);
    console.log("   Missing Skills:", result.missing_skills);
    console.log("   Experience:", result.experience_years);
    console.log("   Recommendation:", result.recommendation);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAIService();
