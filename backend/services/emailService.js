// backend/services/emailService.js
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email to candidate after application
const sendCandidateEmail = async (
  candidateEmail,
  jobTitle,
  score,
  matchedSkills,
  missingSkills,
  recommendation
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; background: white; margin: 20px auto; display: flex; align-items: center; justify-content: center; }
        .score-number { font-size: 48px; font-weight: bold; color: #667eea; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9; }
        .skill-tag { background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; margin: 4px; display: inline-block; font-size: 12px; }
        .missing-skill-tag { background: #ff6b6b; color: white; padding: 4px 12px; border-radius: 20px; margin: 4px; display: inline-block; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
        .recommendation { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #4caf50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Application Received!</h1>
          <p>Thank you for applying to ${jobTitle}</p>
        </div>
        
        <div class="score-circle">
          <div class="score-number">${score}%</div>
        </div>
        
        <div class="section">
          <h2>📊 Your Match Score</h2>
          <p>Your resume matches <strong>${score}%</strong> of the job requirements.</p>
          ${
            score >= 70
              ? '<p style="color: #4caf50;">🎉 Great match! You are among the top candidates!</p>'
              : score >= 50
              ? '<p style="color: #ff9800;">📈 Good match! You have strong potential for this role.</p>'
              : '<p style="color: #ff6b6b;">💪 Keep improving! There are some areas to work on.</p>'
          }
        </div>
        
        <div class="section">
          <h2>✅ Skills We Found</h2>
          <div>
            ${matchedSkills
              .map((skill) => `<span class="skill-tag">${skill}</span>`)
              .join("")}
          </div>
        </div>
        
        ${
          missingSkills && missingSkills.length > 0
            ? `
        <div class="section">
          <h2>⚠️ Skills to Develop</h2>
          <div>
            ${missingSkills
              .map((skill) => `<span class="missing-skill-tag">${skill}</span>`)
              .join("")}
          </div>
          <p style="margin-top: 10px; font-size: 14px;">Consider developing these skills to increase your chances for future opportunities!</p>
        </div>
        `
            : ""
        }
        
        <div class="recommendation">
          <h3>💡 AI Recommendation</h3>
          <p>${recommendation}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/my-applications" class="button">View Your Applications</a>
        </div>
        
        <div class="footer">
          <p>This is an automated message from AI Resume Screener. Your application is being reviewed by our recruitment team.</p>
          <p>© 2024 AI Resume Screener | Powered by AI</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"AI Resume Screener" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: `🎯 Application Confirmation: ${jobTitle} (Score: ${score}%)`,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Candidate email sent to ${candidateEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Candidate email error:", error);
    return false;
  }
};

// Send email to recruiter about new applicant
const sendRecruiterEmail = async (
  recruiterEmail,
  candidateName,
  jobTitle,
  score,
  matchedSkills,
  candidateEmail
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .score-badge { font-size: 48px; font-weight: bold; color: #667eea; background: white; padding: 20px; border-radius: 50%; display: inline-block; margin: 20px 0; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9; }
        .skill-tag { background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; margin: 4px; display: inline-block; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ New Application Received!</h1>
          <p>A candidate has applied for ${jobTitle}</p>
        </div>
        
        <div style="text-align: center;">
          <div class="score-badge">${score}%</div>
        </div>
        
        <div class="section">
          <h2>👤 Candidate Information</h2>
          <p><strong>Name:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${candidateEmail}</p>
          <p><strong>Match Score:</strong> ${score}%</p>
        </div>
        
        <div class="section">
          <h2>✅ Detected Skills</h2>
          <div>
            ${matchedSkills
              .map((skill) => `<span class="skill-tag">${skill}</span>`)
              .join("")}
          </div>
        </div>
        
        <div class="section">
          <h2>📈 Ranking</h2>
          <p>This candidate has received a <strong>${score}%</strong> match score.</p>
          ${
            score >= 70
              ? '<p style="color: #4caf50;">🌟 Top candidate! Strong match for this position.</p>'
              : score >= 50
              ? '<p style="color: #ff9800;">📊 Good match. Consider for interview.</p>'
              : '<p style="color: #ff6b6b;">📝 Needs review. May be suitable for other positions.</p>'
          }
        </div>
        
        <div style="text-align: center;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/dashboard" class="button">View Dashboard</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from AI Resume Screener.</p>
          <p>Login to your dashboard to view all candidates and their rankings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"AI Resume Screener" <${process.env.EMAIL_USER}>`,
    to: recruiterEmail,
    subject: `📢 New Applicant: ${candidateName} applied for ${jobTitle} (Score: ${score}%)`,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Recruiter email sent to ${recruiterEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Recruiter email error:", error);
    return false;
  }
};

// Send application confirmation to candidate (simple version)
const sendApplicationConfirmation = async (
  candidateEmail,
  jobTitle,
  score,
  matchedSkills
) => {
  return sendCandidateEmail(
    candidateEmail,
    jobTitle,
    score,
    matchedSkills,
    [],
    "Your application has been received and is being reviewed."
  );
};

module.exports = {
  sendCandidateEmail,
  sendRecruiterEmail,
  sendApplicationConfirmation,
};
