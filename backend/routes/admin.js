// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const { sendApprovalEmail } = require('../utils/emailService');
// const checkRole = require('../middleware/rbac');

// // Approve User (Superadmin Only)
// router.post('/approve-user', checkRole(['superadmin']), async (req, res) => {
//   const { userId, role } = req.body;

//   try {
//     const user = await User.findByIdAndUpdate(
//       userId,
//       { 
//         isApproved: true,
//         role,
//         approvedAt: Date.now(),
//         approvedBy: req.user._id
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     await sendApprovalEmail(user);

//     res.json({ message: 'User approved successfully', user });
//   } catch (error) {
//     res.status(500).json({ message: 'Approval failed', error });
//   }
// });

// module.exports = router;
