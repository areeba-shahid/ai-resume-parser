// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    console.log("\n🔐 Auth Middleware Debug:");

    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader ? "Present" : "Missing");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("Token extracted, length:", token.length);
    }

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    console.log("JWT Secret present:", jwtSecret ? "Yes" : "No");

    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log("✅ Token verified, user ID:", decoded.id);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.log("❌ User not found in database");
        return res.status(401).json({ message: "User not found" });
      }

      console.log("✅ User found:", user.email);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message);
      return res
        .status(401)
        .json({ message: "Invalid token", error: jwtError.message });
    }
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Server error in authentication" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this route`,
        requiredRoles: roles,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
