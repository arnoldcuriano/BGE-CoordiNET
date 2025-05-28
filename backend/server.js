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
const patchNotesRoutes = require('./routes/api/patchNotes');

const app = express();

// HTTPS options with self-signed certificates
const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
};

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('Server: Running in development mode:', isDevelopment);

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
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      secure: isDevelopment ? false : true, // Allow non-secure cookies in development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: isDevelopment ? 'lax' : 'none', // Use 'lax' in development
      domain: 'localhost',
      path: '/',
    },
  })
);

// Initialize Passport.js for authentication
require('./passport');
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/auth', authRoutes);
app.use('/api', userManagementRoutes);
app.use('/api/patch-notes', patchNotesRoutes);


// Add middleware to log session details for debugging
app.use((req, res, next) => {
  console.log('Session middleware: Session ID:', req.sessionID);
  console.log('Session middleware: Session data:', req.session);
  console.log('Session middleware: User:', req.user);
  next();
});

// Root route for basic server check
app.get('/', (req, res) => {
  res.send('BGE-CoordiNET Backend is running!');
});

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