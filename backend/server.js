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

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow frontend to access backend
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,

    
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // Session expiration time (1 day)
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      sameSite: 'lax', // Allow cookies to be sent with cross-site requests
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('BGE-CoordiNET Backend is running!');
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));