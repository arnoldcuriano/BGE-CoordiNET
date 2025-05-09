const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Get current user
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const permissions = req.user.role === 'superadmin'
    ? {
        dashboard: true,
        member: true,
        partners: true,
        hrManagement: true,
        projects: true,
        itInventory: true,
        quickTools: true,
        superadminDashboard: true,
        help: true,
        patchNotes: true,
        settings: true,
        analytics: true,
        financeManagement: true,
      }
    : Object.fromEntries(req.user.accessPermissions);
  res.json({
    id: req.user._id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    profilePicture: req.user.profilePicture,
    isApproved: req.user.isApproved,
    accessPermissions: permissions,
  });
});

// Get all approved members
router.get('/members', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: true })
      .select('firstName lastName email role createdAt accessPermissions')
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

async function sendApprovalEmail(userEmail) {
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
}

async function sendRejectionEmail(userEmail) {
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
}

module.exports = router;