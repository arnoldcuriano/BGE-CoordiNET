const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const ResetToken = require('../../models/ResetToken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Forgot password
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

// Reset password
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

// Validate reset token
router.post('/validate-reset-token', async (req, res) => {
  const { token } = req.body;
  console.log('Validating reset token:', token, 'at', new Date().toISOString());
  try {
    const resetToken = await ResetToken.findOne({ token, expires: { $gt: Date.now() } });
    if (resetToken) {
      console.log('Token is valid for userId:', resetToken.userId);
      res.json({ valid: true });
    } else {
      console.log('Token is invalid or expired:', token);
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error validating token:', error.message, 'at', new Date().toISOString());
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

module.exports = router;