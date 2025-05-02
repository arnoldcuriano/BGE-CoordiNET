const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const ResetToken = require('../models/ResetToken');
const sendEmail = require('../utils/sendEmail');

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
    console.log('Session before redirect:', req.session);
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after Google auth:', err);
        return res.redirect('http://localhost:3000/login');
      }
      console.log('Session saved successfully:', req.session);
      const redirectUrl = req.user.role === 'viewer' 
        ? 'http://localhost:3000/welcome?loginSuccess=true' 
        : 'http://localhost:3000/dashboard?loginSuccess=true';
      res.redirect(redirectUrl);
    });
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
    profilePicture: req.user.profilePicture,
    isApproved: req.user.isApproved,
    accessPermissions: req.user.accessPermissions, // Include access permissions
  });
});

// Get all approved members
router.get('/members', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: true })
      .select('firstName lastName email role createdAt accessPermissions') // Include accessPermissions
      .lean();
    console.log('Members from DB:', users);
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
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (role) updateFields.role = role;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    const user = await User.updateOne(
      { _id: userId },
      { $set: updateFields }
    );
    if (user.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Update user access permissions
router.put('/update-access', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId, accessPermissions } = req.body;
  try {
    const user = await User.updateOne(
      { _id: userId },
      { $set: { accessPermissions } }
    );
    if (user.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User access updated successfully' });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

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
      return res.status(401).json({ message: info.message || 'Login failed' });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error logging in user:', loginErr);
        return next(loginErr);
      }

      console.log('User authenticated successfully:', user.email);
      const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      res.json({ 
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
          accessPermissions: user.accessPermissions, // Include access permissions
        },
        token,
        redirect: user.role === 'viewer' ? '/welcome' : '/dashboard'
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password request received for email:', email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isApproved) {
      console.log('User not approved for email:', email);
      return res.status(403).json({ message: 'Account not approved. Contact the administrator.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    console.log('Generated reset token for user:', user._id);
    await ResetToken.create({
      userId: user._id,
      token,
      expires: Date.now() + 15 * 60 * 1000,
    });
    console.log('Reset token saved to database');

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
    console.log('Mailtrap transporter created with user:', process.env.MAILTRAP_USER);

    const mailOptions = {
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your BGE account.</p>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
          <p>If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error in forgot-password:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('Reset password request received with token:', token);
  console.log('New password length:', newPassword?.length);

  try {
    const resetToken = await ResetToken.findOne({ token, expires: { $gt: Date.now() } });
    console.log('Reset token lookup result:', resetToken);
    if (!resetToken) {
      console.log('Token invalid or expired:', token);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(resetToken.userId);
    console.log('User lookup result:', user);
    if (!user) {
      console.log('User not found for userId:', resetToken.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');

    await User.updateOne(
      { _id: resetToken.userId },
      { $set: { password: hashedPassword } }
    );
    console.log('User password updated successfully for userId:', resetToken.userId);

    await ResetToken.deleteOne({ token });
    console.log('Reset token deleted:', token);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset-password:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/test-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
    console.log('Testing email with user:', process.env.MAILTRAP_USER);
    await transporter.sendMail({
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: 'test@beglobalecommercecorp.com',
      subject: 'Test Email',
      text: 'This is a test email from Mailtrap.',
    });
    console.log('Test email sent successfully');
    res.json({ message: 'Test email sent' });
  } catch (error) {
    console.error('Test email error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

async function notifySuperadmin(newUserEmail) {
  try {
    console.log('Mailtrap credentials:', {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    });

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
    console.error('Stack trace:', error.stack);
  }
}

async function sendApprovalEmail(userEmail) {
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
      to: userEmail,
      subject: 'Your Account Has Been Approved',
      text: 'Your account has been approved by the administrator. You can now log in.',
    };

    await transporter.sendMail(mailOptions);
    console.log('Approval email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error in sendApprovalEmail:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function sendRejectionEmail(userEmail) {
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
      to: userEmail,
      subject: 'Your Registration Has Been Rejected',
      text: 'Your registration request has been reviewed and rejected by the administrator.',
    };

    await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error in sendRejectionEmail:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

router.get('/logout', (req, res) => {
  console.log('Logout request received, session:', req.session);
  console.log('Cookies received:', req.cookies);
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

module.exports = router;