const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Allowed domains for registration
const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];

// Local Login
router.post('/login', (req, res, next) => {
  const { rememberMe } = req.body;
  console.log('Login request received, rememberMe:', rememberMe);

  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    console.log('Setting session cookie maxAge to 30 days');
  } else {
    req.session.cookie.expires = false;
    console.log('Setting session cookie to expire on browser close');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Passport authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      // Customize the message for unapproved users
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

      console.log('User authenticated successfully:', user.email);
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
        // Let the frontend handle the redirect
        message: 'Login successful'
      });
    });
  })(req, res, next);
});

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    console.log('Register request received:', { firstName, lastName, email });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      console.log('Domain not allowed:', domain);
      return res.status(403).json({ message: 'Registration is restricted to allowed domains' });
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
    console.log('User saved successfully:', email);

    try {
      await notifySuperadmin(email);
      console.log('Superadmin notified for user:', email);
    } catch (emailError) {
      console.error('Failed to notify superadmin:', emailError.message);
    }

    res.status(201).json({ message: 'User registered successfully, awaiting approval' });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Logout route
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
      console.log('Session destroyed successfully');
      res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

async function notifySuperadmin(newUserEmail) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: process.env.SUPERADMIN_EMAIL,
      subject: 'New User Registration Requires Approval',
      text: `A new user with email ${newUserEmail} has registered and is awaiting approval.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Superadmin notification sent successfully to:', process.env.SUPERADMIN_EMAIL);
  } catch (error) {
    console.error('Error in notifySuperadmin:', error.message);
  }
}

module.exports = router;