const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

router.get('/user', (req, res) => {
  console.log('GET /auth/user - req.user:', req.user);
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let permissions = {
    help: true,
    patchNotes: true,
    settings: true,
  };

  const roleDefaults = {
    viewer: { dashboard: true },
    admin: { dashboard: true, members: true, 'pending-users': true },
    superadmin: {
      dashboard: true,
      member: true,
      partners: true,
      hrManagement: true,
      projects: true,
      itInventory: true,
      quickTools: true,
      superadminDashboard: true,
      analytics: true,
      financeManagement: true,
    },
  };

  if (req.user.role && roleDefaults[req.user.role]) {
    Object.assign(permissions, roleDefaults[req.user.role]);
  }

  const userPermissions = req.user.accessPermissions && typeof req.user.accessPermissions === 'object'
    ? req.user.accessPermissions
    : {};
  Object.keys(permissions).forEach((key) => {
    if (key in userPermissions) {
      permissions[key] = userPermissions[key];
    }
  });

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

router.post('/approve-user', async (req, res) => {
  console.log('POST /auth/approve-user - req.user:', req.user);
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
    const roleDefaults = {
      viewer: { help: true, patchNotes: true, settings: true, dashboard: true },
      admin: { help: true, patchNotes: true, settings: true, dashboard: true, members: true, 'pending-users': true },
      superadmin: {
        help: true,
        patchNotes: true,
        settings: true,
        dashboard: true,
        member: true,
        partners: true,
        hrManagement: true,
        projects: true,
        itInventory: true,
        quickTools: true,
        superadminDashboard: true,
        analytics: true,
        financeManagement: true,
      },
    };
    user.accessPermissions = roleDefaults[role] || { help: true, patchNotes: true, settings: true };
    await user.save();

    setImmediate(async () => {
      try {
        await sendApprovalEmail(user.email);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

router.get('/members', async (req, res) => {
  console.log('GET /auth/members - req.user:', req.user);
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

router.put('/update-user', async (req, res) => {
  console.log('PUT /auth/update-user - req.user:', req.user);
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

router.put('/update-access', async (req, res) => {
  console.log('PUT /auth/update-access - req.user:', req.user);
  if (!req.user || req.user.role !== 'superadmin') {
    console.log('Update access failed: Access denied. Insufficient permissions.');
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  const { userId, accessPermissions } = req.body;
  console.log(`Updating access for user ID: ${userId} with permissions:`, accessPermissions);
  try {
    const user = await User.updateOne(
      { _id: userId },
      { $set: { accessPermissions } }
    );
    if (user.matchedCount === 0) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User access updated successfully:', userId);
    res.json({ message: 'User access updated successfully' });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

router.get('/pending-users', async (req, res) => {
  console.log('GET /auth/pending-users - req.user:', req.user);
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

router.post('/reject-user', async (req, res) => {
  console.log('POST /auth/reject-user - req.user:', req.user);
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

router.delete('/delete-user/:userId', async (req, res) => {
  console.log('DELETE /auth/delete-user/:userId - Headers:', req.headers);
  console.log('DELETE /auth/delete-user/:userId - Cookies:', req.cookies);
  console.log('DELETE /auth/delete-user/:userId - Session:', req.session);
  console.log('DELETE /auth/delete-user/:userId - req.user:', req.user);
  if (!req.user) {
    console.log('Delete user failed: Not authenticated');
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { userId } = req.params;
  console.log(`Attempting to delete user with ID: ${userId} by user: ${req.user?.email || 'unknown'} (${req.user?.role || 'unknown'})`);
  try {
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserRole = req.user.role;
    const targetUserRole = userToDelete.role;
    console.log(`Current user role: ${currentUserRole}, Target user role: ${targetUserRole}`);

    if (currentUserRole === 'admin' && targetUserRole === 'superadmin') {
      console.log('Delete failed: Admins cannot delete superadmin members');
      return res.status(403).json({ message: 'Admins cannot delete superadmin members' });
    }

    await User.findByIdAndDelete(userId);
    console.log(`User deleted successfully: ${userId}`);

    setImmediate(async () => {
      try {
        await sendDeletionEmail(userToDelete.email);
      } catch (emailError) {
        console.error('Error sending deletion email:', emailError);
      }
    });

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

async function sendDeletionEmail(userEmail) {
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
    subject: 'Your Account Has Been Deleted',
    text: 'Your account has been deleted by an administrator. If this was a mistake, please contact support.',
  };

  await transporter.sendMail(mailOptions);
  console.log('Deletion email sent successfully to:', userEmail);
}

module.exports = router;