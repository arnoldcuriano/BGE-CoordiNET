// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const checkRole = require('../middleware/rbac');

// // Fetch Authenticated User Data
// router.get('/user', (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Not authenticated' });
//   }
//   res.json({
//     id: req.user._id,
//     email: req.user.email,
//     firstName: req.user.firstName,
//     lastName: req.user.lastName,
//     role: req.user.role,
//     profilePicture: req.user.profilePicture
//   });
// });

// // Get Pending Users (Superadmin Only)
// router.get('/pending', checkRole(['superadmin']), async (req, res) => {
//   try {
//     const pendingUsers = await User.find({ isApproved: false });
//     res.json(pendingUsers);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching pending users' });
//   }
// });

// module.exports = router;
