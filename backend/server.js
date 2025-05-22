// Load environment variables first to ensure they are available globally
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const userManagementRoutes = require('./routes/auth/userManagement');
const MongoStore = require('connect-mongo');
const https = require('https');
const fs = require('fs');
const multer = require('multer'); // Kept for reference, though not used here directly

const app = express();

// HTTPS options with self-signed certificates
const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
};

// Configure CORS for frontend at https://localhost:8443
app.use(cors({
  origin: 'https://localhost:8443',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with updated cookie settings
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      secure: true,              // Required for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,            // Prevents client-side access to cookie
      sameSite: 'none',          // Allows cross-site requests (frontend and backend on different ports)
      domain: 'localhost',       // Works for localhost in development
      path: '/',
    },
  })
);

// Initialize Passport.js for authentication
require('./passport'); // Ensure Passport config is loaded before initialization
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/auth', authRoutes);
app.use('/api', userManagementRoutes);

// Root route for basic server check
app.get('/', (req, res) => {
  res.send('BGE-CoordiNET Backend is running!');
});

// Log AWS environment variables for debugging
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Start HTTPS server
const PORT = process.env.PORT || 5000;
const server = https.createServer(options, app);
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});