// backend/seed-jobs.js
const mongoose = require("mongoose");
const Job = require("./models/Job");
const User = require("./models/User");
require("dotenv").config();

const sampleJobs = [
  {
    title: "Frontend Developer",
    description:
      "Looking for a React expert to build beautiful UIs. You'll work with our design team to implement responsive, accessible web applications.",
    requiredSkills: ["React", "JavaScript", "CSS", "HTML"],
    preferredSkills: ["TypeScript", "Tailwind", "Next.js"],
    minExperience: 2,
    maxExperience: 5,
    education: "Bachelor's in Computer Science or equivalent",
    department: "Engineering",
    location: "New York, NY",
    employmentType: "Full-time",
    salary: { min: 80000, max: 120000, currency: "USD" },
    status: "active",
  },
  {
    title: "Backend Engineer",
    description:
      "Build scalable APIs and microservices. You'll design and implement robust backend systems that power our applications.",
    requiredSkills: ["Node.js", "Python", "MongoDB", "PostgreSQL"],
    preferredSkills: ["Docker", "AWS", "Redis", "GraphQL"],
    minExperience: 3,
    maxExperience: 6,
    education: "Bachelor's in Computer Science or equivalent",
    department: "Engineering",
    location: "Remote",
    employmentType: "Remote",
    salary: { min: 100000, max: 150000, currency: "USD" },
    status: "active",
  },
  {
    title: "Data Scientist",
    description:
      "Work with ML models and analyze large datasets. You'll help build predictive models and extract insights from data.",
    requiredSkills: ["Python", "SQL", "Machine Learning", "Pandas"],
    preferredSkills: ["TensorFlow", "PyTorch", "Spark", "Scikit-learn"],
    minExperience: 3,
    maxExperience: 7,
    education: "Master's in Data Science, Statistics, or related field",
    department: "Data Science",
    location: "San Francisco, CA",
    employmentType: "Full-time",
    salary: { min: 120000, max: 180000, currency: "USD" },
    status: "active",
  },
  {
    title: "DevOps Engineer",
    description:
      "Manage cloud infrastructure and CI/CD pipelines. You'll ensure our systems are scalable, reliable, and secure.",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Jenkins"],
    preferredSkills: ["Terraform", "Prometheus", "Grafana", "GitHub Actions"],
    minExperience: 4,
    maxExperience: 8,
    education: "Bachelor's in Computer Science or equivalent",
    department: "DevOps",
    location: "Austin, TX",
    employmentType: "Hybrid",
    salary: { min: 110000, max: 160000, currency: "USD" },
    status: "active",
  },
];

async function seedJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find or create a default admin/recruiter user
    console.log("🔍 Looking for a recruiter user...");
    let recruiter = await User.findOne({ role: "recruiter" });

    if (!recruiter) {
      console.log("📝 No recruiter found. Creating a default recruiter...");
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);

      recruiter = await User.create({
        email: "recruiter@example.com",
        password: hashedPassword,
        role: "recruiter",
      });
      console.log("✅ Default recruiter created:", recruiter.email);
    } else {
      console.log("✅ Found recruiter:", recruiter.email);
    }

    // Clear existing jobs
    const deletedCount = await Job.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing jobs`);

    // Add createdBy to each sample job
    const jobsWithCreator = sampleJobs.map((job) => ({
      ...job,
      createdBy: recruiter._id,
    }));

    // Insert sample jobs
    const jobs = await Job.insertMany(jobsWithCreator);
    console.log(`✅ Created ${jobs.length} sample jobs:\n`);

    jobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title}`);
      console.log(`      Location: ${job.location}`);
      console.log(`      Skills: ${job.requiredSkills.join(", ")}`);
      console.log(`      Created by: ${recruiter.email}\n`);
    });

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding jobs:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    await mongoose.disconnect();
  }
}

seedJobs();
