// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const { sendResetEmail } = require('../utils/emailService');

// // Forgot Password
// router.post('/forgot', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

//     await sendResetEmail(email, resetToken);

//     res.json({ message: 'Reset link sent to your email' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error sending reset link', error });
//   }
// });

// // Reset Password
// router.post('/:token', async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid token' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     await user.save();

//     res.json({ message: 'Password reset successful' });
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid or expired token' });
//   }
// });

// module.exports = router;
