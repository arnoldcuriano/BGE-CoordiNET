const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Allowed email domains
const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];

// Local Login
router.post('/login', (req, res, next) => {
  console.log('Login attempt for email:', req.body.email);
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Passport authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      if (info.message === 'Your account is awaiting approval.') {
        return res.status(403).json({ message: info.message });
      }
      return res.status(401).json({ message: info.message || 'Login failed' });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error logging in user:', loginErr);
        return next(loginErr);
      }

      console.log('User logged in:', user.email);
      console.log('Session after login:', req.session);

      res.on('finish', () => {
        const setCookieHeader = res.get('Set-Cookie');
        console.log('Set-Cookie header after /login:', setCookieHeader);
      });

      res.json({ 
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
          accessPermissions: user.accessPermissions,
        },
        message: 'Login successful'
      });
    });
  })(req, res, next);
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check domain restriction
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({ message: 'Invalid email domain. Only specific domains are allowed.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'viewer',
      isApproved: false,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully, awaiting approval' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Error destroying session' });
      }
      res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;