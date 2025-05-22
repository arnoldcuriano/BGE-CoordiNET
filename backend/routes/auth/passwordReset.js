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
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved. Contact the administrator.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await ResetToken.create({
      userId: user._id,
      token,
      expires: Date.now() + 15 * 60 * 1000,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
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
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color: #4285F4; text-align: center; margin-bottom: 20px;">BGE App</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              You requested a password reset for your BGE account.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Click the button below to reset your password (expires in 15 minutes):
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${resetUrl}" style="background-color: #34A853; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
              If you didn’t request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; 2025 BGE App. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error', error: 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const resetToken = await ResetToken.findOne({ token, expires: { $gt: Date.now() } });
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(resetToken.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: resetToken.userId },
      { $set: { password: hashedPassword } }
    );

    await ResetToken.deleteOne({ token });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ message: 'Server error', error: 'Failed to reset password' });
  }
});

// Validate reset token
router.post('/validate-reset-token', async (req, res) => {
  const { token } = req.body;
  try {
    const resetToken = await ResetToken.findOne({ token, expires: { $gt: Date.now() } });
    if (resetToken) {
      res.json({ valid: true });
    } else {
      console.log('Invalid or expired token:', token);
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error in validate-reset-token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;