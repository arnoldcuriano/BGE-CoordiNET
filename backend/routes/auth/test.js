const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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

module.exports = router;