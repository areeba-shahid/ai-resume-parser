// backend/services/aiService.js
const axios = require("axios");
const FormData = require("form-data");

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

class AIService {
  async extractTextFromPDF(fileBuffer) {
    try {
      console.log("📤 Calling Python service to extract text...");
      console.log("   URL:", `${PYTHON_SERVICE_URL}/extract-text`);

      const formData = new FormData();
      formData.append("file", fileBuffer, {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

      const response = await axios.post(
        `${PYTHON_SERVICE_URL}/extract-text`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        }
      );

      console.log("✅ Text extraction successful");
      console.log("   Pages:", response.data.pages);
      console.log("   Text length:", response.data.text.length);
      return response.data;
    } catch (error) {
      console.error("❌ Error extracting text:", error.message);
      if (error.response) {
        console.error("   Response status:", error.response.status);
        console.error("   Response data:", error.response.data);
      }
      // Return mock data for testing
      return {
        text: "Experienced software engineer with 5 years of experience in Node.js, React, and MongoDB. Proficient in JavaScript, Python, and cloud technologies. Led multiple successful projects and mentored junior developers.",
        pages: 1,
      };
    }
  }

  async analyzeResume(resumeText, job) {
    try {
      console.log("🤖 Calling Python service to analyze resume...");
      console.log("   URL:", `${PYTHON_SERVICE_URL}/analyze-resume`);
      console.log("   Job title:", job.title);
      console.log("   Required skills:", job.requiredSkills);

      const response = await axios.post(
        `${PYTHON_SERVICE_URL}/analyze-resume`,
        {
          resume_text: resumeText,
          job_title: job.title,
          job_description: job.description,
          required_skills: job.requiredSkills || [],
        },
        {
          timeout: 30000,
        }
      );

      console.log("✅ Analysis successful");
      console.log("   Score:", response.data.score);
      console.log("   Matched skills:", response.data.matched_skills);
      console.log("   Experience years:", response.data.experience_years);

      return response.data;
    } catch (error) {
      console.error("❌ Error analyzing resume:", error.message);
      if (error.response) {
        console.error("   Response status:", error.response.status);
        console.error("   Response data:", error.response.data);
      }
      // Return mock analysis
      return {
        score: 75,
        matched_skills: ["Node.js", "React", "MongoDB"],
        missing_skills: ["Python"],
        experience_years: 5,
        strengths: ["Strong technical skills", "Relevant experience"],
        weaknesses: ["Missing some skills"],
        recommendation: "Strong candidate, consider for interview",
      };
    }
  }
}

module.exports = new AIService();
