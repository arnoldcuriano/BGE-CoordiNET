const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const MongoStore = require('connect-mongo');

// Load environment variables
dotenv.config();

// Import Passport configuration
require('./passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with MongoStore
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions'
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // Remove domain in development to avoid issues with localhost
      domain: process.env.NODE_ENV === 'production' ? 'yourdomain.com' : undefined
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Trust proxy if behind reverse proxy (important for secure cookies in production)
app.set('trust proxy', 1);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    session: req.session,
    user: req.user || 'No user session'
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('BGE-CoordiNET Backend is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log('Session middleware - Session ID:', req.sessionID);
  console.log('Session middleware - Session data:', req.session);
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});