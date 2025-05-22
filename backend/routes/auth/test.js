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
    await transporter.sendMail({
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: 'test@beglobalecommercecorp.com',
      subject: 'Test Email',
      text: 'This is a test email from Mailtrap.',
    });
    res.json({ message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

module.exports = router;