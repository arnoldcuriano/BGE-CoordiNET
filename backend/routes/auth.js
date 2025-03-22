const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const passport = require('passport');
const checkRole = require('../middleware/rbac');

// Google OAuth Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    console.log('Google OAuth successful. Redirecting to dashboard.'); // Debugging
    console.log('Authenticated User:', req.user); // Log the authenticated user
    console.log('Session ID:', req.sessionID); // Log the session ID

    // Redirect to the frontend with a query parameter indicating successful login
    res.redirect(`http://localhost:3000/dashboard?loginSuccess=true`);
  }
);

// Fetch authenticated user data
router.get('/user', (req, res) => {
  console.log('Fetching user data. Session ID:', req.sessionID); // Debugging
  console.log('Authenticated User:', req.user); // Debugging
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    displayName: req.user.displayName,
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Register (with domain restriction)
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, department } = req.body;

  // Check if email domain is allowed
  const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];
  const domain = email.split('@')[1];
  if (!allowedDomains.includes(domain)) {
    return res.status(400).json({ message: 'Invalid email domain' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    department,
    role: 'viewer', // Default role for new users
    isApproved: false, // New users are not approved by default
  });

  await user.save();
  res.status(201).json({ message: 'User registered. Awaiting approval.' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Check if user is approved
  if (!user.isApproved) {
    return res.status(400).json({ message: 'Account not approved yet' });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Generate JWT token with role
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Generate reset token
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // Send reset email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset',
    text: `Click the link to reset your password: ${resetLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Error sending email' });
    }
    res.json({ message: 'Reset link sent to your email' });
  });
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Super Admin: Approve User and Assign Role
router.post('/approve-user', checkRole(['superadmin']), async (req, res) => {
  const { userId, role } = req.body;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Approve user and assign role
  user.isApproved = true;
  user.role = role;
  await user.save();

  res.json({ message: 'User approved and role assigned successfully' });
});

// Admin Route (Protected by RBAC)
router.get('/admin', checkRole(['admin', 'superadmin']), (req, res) => {
  res.json({ message: 'Welcome, admin!' });
});

module.exports = router;