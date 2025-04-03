const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Allowed domains for registration
const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login',
    failureFlash: true 
  }),
  (req, res) => {
    console.log('Successful Google auth, user:', req.user);
    console.log('Session:', req.session);
    res.redirect('http://localhost:3000/dashboard?loginSuccess=true');
  }
);

// Get current user
router.get('/user', (req, res) => {
  console.log('Session in /auth/user:', req.session);
  console.log('User in /auth/user:', req.user);
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({
    id: req.user._id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    profilePicture: req.user.profilePicture
  });
});

// Get all approved members
router.get('/members', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: true })
      .select('firstName lastName email role createdAt')
      .lean();
    console.log('Members from DB:', users); // Debug
    res.json(users);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// Update user details
router.put('/update-user', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId, firstName, lastName, role, password } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (password) user.password = password; // Will be hashed by pre-save hook
    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});


// Local Login
router.post('/login', passport.authenticate('local'), (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, role: req.user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
  res.json({ 
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      profilePicture: req.user.profilePicture
    },
    token 
  });
});

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return res.status(403).json({ message: 'Registration is restricted to allowed domains' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'viewer',
      isApproved: false
    });

    await user.save();
    await notifySuperadmin(email);
    res.status(201).json({ message: 'User registered successfully, awaiting approval' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Management Endpoints
router.get('/pending-users', async (req, res) => {
  if (!req.user || !['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: false })
      .select('firstName lastName email createdAt')
      .lean();
    console.log('Pending users from DB:', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Error fetching pending users', error: error.message });
  }
});

router.post('/approve-user', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId, role } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isApproved = true;
    user.role = role;
    await user.save();
    await sendApprovalEmail(user.email);
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

router.post('/reject-user', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId } = req.body;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await sendRejectionEmail(user.email);
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

router.delete('/delete-user', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId } = req.body;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Deletion failed', error: error.message });
  }
});

// Helper functions
async function notifySuperadmin(newUserEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.SUPERADMIN_EMAIL,
    subject: 'New User Registration Requires Approval',
    text: `A new user with email ${newUserEmail} has registered and is awaiting approval.`,
  };

  await transporter.sendMail(mailOptions);
}

async function sendApprovalEmail(userEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Your Account Has Been Approved',
    text: 'Your account has been approved by the administrator. You can now log in.',
  };

  await transporter.sendMail(mailOptions);
}

async function sendRejectionEmail(userEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Your Registration Has Been Rejected',
    text: 'Your registration request has been reviewed and rejected by the administrator.',
  };

  await transporter.sendMail(mailOptions);
}

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Error destroying session' });
      }
      res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
      res.json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;