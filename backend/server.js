// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
console.log("🔄 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Connection event handlers
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

// Handle application termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});

// Make io accessible to routes
app.set("io", io);

// Simple test route
app.get("/", (req, res) => {
  res.json({
    message: "AI Resume Screener API",
    status: "running",
    timestamp: new Date(),
  });
});

// Routes
console.log("Loading routes...");
app.use("/api/auth", require("./routes/auth"));
console.log("✅ Auth routes loaded");

app.use("/api/candidates", require("./routes/candidates"));
console.log("✅ Candidates routes loaded");

app.use("/api/jobs", require("./routes/jobs"));
console.log("✅ Jobs routes loaded");

app.use("/api/webhooks", require("./routes/webhooks"));
console.log("✅ Webhooks routes loaded");

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error("Error handler:", err.stack);
  res.status(500).json({ message: err.message || "Something went wrong!" });
});

// 404 handler - FIXED: removed the '*' wildcard
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
