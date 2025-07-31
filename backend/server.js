require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/auth");
const userManagementRoutes = require("./routes/auth/userManagement");
const MongoStore = require("connect-mongo");
const https = require("https");
const fs = require("fs");
const partnerRoutes = require("./routes/api/partners");
const patchNotesRoutes = require("./routes/api/patchNotes");
const inventoryRoutes = require("./routes/api/inventory");
const { s3Client } = require("./s3config");
const { HeadBucketCommand } = require("@aws-sdk/client-s3");

const app = express();

// HTTPS options with self-signed certificates
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== "production";
console.log("Server: Running in development mode:", isDevelopment);

// Configure CORS for frontend at https://localhost:8443
app.use(
  cors({
    origin: "https://localhost:8443",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with updated cookie settings
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: isDevelopment ? false : true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: isDevelopment ? "lax" : "none",
      domain: "localhost",
      path: "/",
    },
  })
);

// Initialize Passport.js for authentication
require("./passport");
app.use(passport.initialize());
app.use(passport.session());

// Make S3 client available to routes
app.use((req, res, next) => {
  req.s3Client = s3Client;
  next();
});

// Test route to verify S3 connectivity / to remove once fully functional
app.get("/test-s3", async (req, res) => {
  try {
    const command = new HeadBucketCommand({
      Bucket: process.env.AWS_S3_BUCKET,
    });
    await s3Client.send(command);
    res.json({ message: "S3 connectivity test successful" });
  } catch (err) {
    console.error("S3 connectivity test failed:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ message: "S3 connectivity test failed", error: err.message });
  }
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/api", userManagementRoutes);
app.use("/api/patch-notes", patchNotesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/partners", partnerRoutes);

// Add middleware to log session details for debugging
app.use((req, res, next) => {
  console.log("Session middleware: Session ID:", req.sessionID);
  console.log("Session middleware: Session data:", req.session);
  console.log("Session middleware: User:", req.user);
  next();
});

// Root route for basic server check / to remove once frontend is fully functional
app.get("/", (req, res) => {
  res.send("BGE-CoordiNET Backend is running!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Start HTTPS server
const PORT = process.env.PORT || 5000;
const server = https.createServer(options, app);
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
