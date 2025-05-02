// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Email Verification
// router.get('/email/:token', async (req, res) => {
//   try {
//     const { token } = req.params;
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findOneAndUpdate(
//       { email: decoded.email, verificationToken: token },
//       { 
//         isVerified: true,
//         verificationToken: null,
//         verificationExpires: null 
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid or expired token' });
//     }

//     res.json({ message: 'Email verified successfully. Awaiting admin approval.' });
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid or expired token' });
//   }
// });

// module.exports = router;
