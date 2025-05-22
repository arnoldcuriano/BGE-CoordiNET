const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const multer = require('multer');
const s3 = require('../../s3config');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Test route
router.post('/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

// Get user info
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let permissions = {
    help: true,
    patchNotes: true,
    profileSettings: true,
    accountSettings: true,
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
      help: true,
      patchNotes: true,
      profileSettings: true,
      accountSettings: true,
      settings: true,
    },
  };

  if (req.user.role === 'superadmin') {
    permissions = { ...roleDefaults.superadmin };
  } else {
    const userPermissions = req.user.accessPermissions || {};
    permissions = { ...permissions, ...userPermissions };
  }

  res.json({
    id: req.user._id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    createdAt: req.user.createdAt,
    role: req.user.role,
    profilePicture: req.user.profilePicture,
    isApproved: req.user.isApproved,
    accessPermissions: permissions,
  });
});

// Upload profile picture
router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only JPEG and PNG files are allowed.' });
    }
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File size exceeds 5 MB limit.' });
    }

    const fileName = `profile-pics/user-${req.user._id}-${Date.now()}.${file.originalname.split('.').pop()}`;
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Note: ACL parameter is removed to avoid the error
    };

    const command = new PutObjectCommand(uploadParams);
    const uploadResult = await s3.send(command);
    console.log('S3 Upload Result:', uploadResult);

    const newProfilePictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    if (user.profilePicture) {
      const oldFileKey = user.profilePicture.split('/').slice(-2).join('/');
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: oldFileKey,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3.send(deleteCommand);
      console.log(`Deleted old profile picture: ${oldFileKey}`);
    }

    user.profilePicture = newProfilePictureUrl;
    await user.save();
    console.log('User profile updated with new picture URL:', newProfilePictureUrl);

    res.status(200).json({
      message: 'Profile picture updated successfully.',
      profilePicture: newProfilePictureUrl,
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err.stack);
    res.status(500).json({
      message: 'Failed to upload profile picture.',
      error: err.message,
    });
  }
});

// Remove profile picture
router.post('/remove-profile-picture', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.profilePicture) {
      const fileKey = user.profilePicture.split('/').slice(-2).join('/');
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3.send(deleteCommand);

      user.profilePicture = '';
      await user.save();
    }

    res.status(200).json({ message: 'Profile picture removed successfully.' });
  } catch (err) {
    console.error('Error removing profile picture:', err.message);
    res.status(500).json({ message: 'Failed to remove profile picture.', error: err.message });
  }
});

// Update profile
router.post('/update-profile', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
});

// Update email
router.post('/update-email', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.email = email;
    await user.save();

    res.status(200).json({ message: 'Email updated successfully.' });
  } catch (err) {
    console.error('Error updating email:', err.message);
    res.status(500).json({ message: 'Failed to update email.', error: err.message });
  }
});

// Update password
router.post('/update-password', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err.message);
    res.status(500).json({ message: 'Failed to update password.', error: err.message });
  }
});

// Delete account
router.post('/delete-account', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.profilePicture) {
      const fileKey = user.profilePicture.split('/').slice(-2).join('/');
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3.send(deleteCommand);
    }

    await User.findByIdAndDelete(req.user._id);

    setImmediate(async () => {
      try {
        await sendDeletionEmail(user.email);
      } catch (emailError) {
        console.error('Error sending deletion email:', emailError);
      }
    });

    res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting account:', err.message);
    res.status(500).json({ message: 'Failed to delete account.', error: err.message });
  }
});

// Approve user (superadmin only)
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
    user.accessPermissions = {
      help: true,
      patchNotes: true,
      settings: true,
      profileSettings: true,
      accountSettings: true,
    };
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
    console.error('Error approving user:', error.message);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// Get approved members (superadmin only)
router.get('/members', async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: true })
      .select('firstName lastName email role createdAt accessPermissions')
      .lean();
    res.json(users);
  } catch (error) {
    console.error('Error fetching members:', error.message);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// Update user (superadmin only)
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
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Update access permissions (superadmin only)
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
    console.error('Error updating access:', error.message);
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Get pending users (admin or superadmin)
router.get('/pending-users', async (req, res) => {
  if (!req.user || !['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  try {
    const users = await User.find({ isApproved: false })
      .select('firstName lastName email createdAt')
      .lean();
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error.message);
    res.status(500).json({ message: 'Error fetching pending users', error: error.message });
  }
});

// Reject user (superadmin only)
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
    console.error('Error rejecting user:', error.message);
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

// Delete user
router.delete('/delete-user/:userId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { userId } = req.params;
  try {
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserRole = req.user.role;
    const targetUserRole = userToDelete.role;

    if (currentUserRole === 'admin' && targetUserRole === 'superadmin') {
      return res.status(403).json({ message: 'Admins cannot delete superadmin members' });
    }

    await User.findByIdAndDelete(userId);

    setImmediate(async () => {
      try {
        await sendDeletionEmail(userToDelete.email);
      } catch (emailError) {
        console.error('Error sending deletion email:', emailError);
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Deletion failed', error: error.message });
  }
});

// Email functions (unchanged)
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
}

module.exports = router;