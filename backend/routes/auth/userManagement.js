const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { s3Client: s3 } = require('../../s3config');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE = '/images/default-avatar.png';

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log('isAuthenticated middleware:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
  });
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  console.error('Authentication failed: User not authenticated or req.user is undefined');
  res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  console.error('Access denied: Insufficient permissions for user:', req.user?.email);
  res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
};

// Middleware to check if user is admin or superadmin
const isAdminOrSuperAdmin = (req, res, next) => {
  if (req.user && ['superadmin', 'admin'].includes(req.user.role)) {
    return next();
  }
  console.error('Access denied: Insufficient permissions for user:', req.user?.email);
  res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
};

// Test route
router.post('/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

// Get user info
router.get('/user', isAuthenticated, (req, res) => {
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
    profilePicture: req.user.profilePicture
      ? req.user.profilePicture.startsWith('http')
        ? req.user.profilePicture // S3 URL
        : DEFAULT_PROFILE_PICTURE // Fallback to default
      : DEFAULT_PROFILE_PICTURE, // Fallback to default if no image
    isApproved: req.user.isApproved,
    accessPermissions: permissions,
  });
});

// Get all users (for ITInventory assignments)
router.get('/users', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find().select('firstName lastName profilePicture assignedItems');
    const usersWithImageUrls = users.map(user => {
      const profilePicture = user.profilePicture
        ? user.profilePicture.startsWith('http')
          ? user.profilePicture // Already an S3 URL
          : DEFAULT_PROFILE_PICTURE // Fallback to default
        : DEFAULT_PROFILE_PICTURE; // Fallback to default if no image
      console.log(`User ${user.email || user._id}: Profile picture set to ${profilePicture}`);
      return {
        ...user._doc,
        profilePicture,
      };
    });
    res.json(usersWithImageUrls);
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user by ID (for detailed views or reassignments)
router.get('/users/:userId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('firstName lastName profilePicture assignedItems');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const profilePicture = user.profilePicture
      ? user.profilePicture.startsWith('http')
        ? user.profilePicture // Already an S3 URL
        : DEFAULT_PROFILE_PICTURE // Fallback to default
      : DEFAULT_PROFILE_PICTURE; // Fallback to default if no image
    console.log(`User ${user.email || user._id}: Profile picture set to ${profilePicture}`);
    res.json({
      ...user._doc,
      profilePicture,
    });
  } catch (error) {
    console.error('Error fetching user:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // File validation
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only JPEG and PNG files are allowed.' });
    }
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File size exceeds 5 MB limit.' });
    }

    // Generate unique file name
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `profile-pics/user-${req.user._id}-${Date.now()}.${fileExtension}`;

    // Upload to S3 without ACL (rely on bucket policy for public access)
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    const uploadResult = await s3.send(command);
    console.log('S3 Upload Result:', uploadResult);

    const newProfilePictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Delete old profile picture if it exists
    if (user.profilePicture && user.profilePicture.startsWith('https://')) {
      try {
        const oldFileKey = user.profilePicture.split('/').slice(-2).join('/');
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: oldFileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted old profile picture: ${oldFileKey}`);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', {
          message: deleteError.message,
          stack: deleteError.stack,
          oldFileKey: user.profilePicture.split('/').slice(-2).join('/'),
        });
        // Continue despite deletion error to ensure the new picture is saved
      }
    }

    // Update user's profile picture URL
    user.profilePicture = newProfilePictureUrl;
    await user.save();
    console.log('User profile updated with new picture URL:', newProfilePictureUrl);

    res.status(200).json({
      message: 'Profile picture uploaded successfully.',
      profilePictureUrl: newProfilePictureUrl,
    });
  } catch (err) {
    console.error('Error uploading profile picture:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
      file: req.file ? { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : null,
    });
    res.status(500).json({
      message: 'Failed to upload profile picture.',
      error: err.message,
    });
  }
});

// Remove profile picture
router.post('/remove-profile-picture', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.profilePicture && user.profilePicture.startsWith('https://')) {
      try {
        const fileKey = user.profilePicture.split('/').slice(-2).join('/');
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted profile picture from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error('Error deleting profile picture from S3:', {
          message: deleteError.message,
          stack: deleteError.stack,
          fileKey: user.profilePicture.split('/').slice(-2).join('/'),
        });
        // Continue despite deletion error to ensure the field is cleared
      }
    }

    user.profilePicture = null;
    await user.save();
    console.log('User profile picture cleared for user:', req.user._id);

    res.status(200).json({ message: 'Profile picture removed successfully.' });
  } catch (err) {
    console.error('Error removing profile picture:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res.status(500).json({ message: 'Failed to remove profile picture.', error: err.message });
  }
});

// Update profile
router.post('/update-profile', isAuthenticated, async (req, res) => {
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
    console.log('User profile updated:', { userId: req.user._id, firstName, lastName });

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
});

// Update email
router.post('/update-email', isAuthenticated, async (req, res) => {
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
    console.log('User email updated:', { userId: req.user._id, email });

    res.status(200).json({ message: 'Email updated successfully.' });
  } catch (err) {
    console.error('Error updating email:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res.status(500).json({ message: 'Failed to update email.', error: err.message });
  }
});

// Update password
router.post('/update-password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({ message: 'No password set. Please use password reset.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password with the same salt rounds as reset-password (10)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();
    console.log('User password updated:', { userId: req.user._id });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in update-password:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    res.status(500).json({ message: 'Server error', error: 'Failed to update password' });
  }
});

// Delete account
router.post('/delete-account', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete profile picture from S3 if it exists
    if (user.profilePicture && user.profilePicture.startsWith('https://')) {
      try {
        const fileKey = user.profilePicture.split('/').slice(-2).join('/');
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted profile picture from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error('Error deleting profile picture during account deletion:', {
          message: deleteError.message,
          stack: deleteError.stack,
          fileKey: user.profilePicture.split('/').slice(-2).join('/'),
        });
        // Continue despite deletion error to ensure the account is deleted
      }
    }

    await User.findByIdAndDelete(req.user._id);
    console.log('User account deleted:', { userId: req.user._id, email: user.email });

    setImmediate(async () => {
      try {
        await sendDeletionEmail(user.email);
      } catch (emailError) {
        console.error('Error sending deletion email:', {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting account:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res.status(500).json({ message: 'Failed to delete account.', error: err.message });
  }
});

// Approve user (superadmin only)
router.post('/approve-user', isAuthenticated, isSuperAdmin, async (req, res) => {
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
    console.log('User approved:', { userId, role });

    setImmediate(async () => {
      try {
        await sendApprovalEmail(user.email);
      } catch (emailError) {
        console.error('Error sending approval email:', {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// Get approved members (superadmin only)
router.get('/members', isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ isApproved: true })
      .select('firstName lastName email role createdAt accessPermissions')
      .lean();
    res.json(users);
  } catch (error) {
    console.error('Error fetching members:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// Update user (superadmin only)
router.put('/update-user', isAuthenticated, isSuperAdmin, async (req, res) => {
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
    console.log('User updated:', { userId, firstName, lastName, role });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Update access permissions (superadmin only)
router.put('/update-access', isAuthenticated, isSuperAdmin, async (req, res) => {
  const { userId, accessPermissions } = req.body;
  try {
    const user = await User.updateOne(
      { _id: userId },
      { $set: { accessPermissions } }
    );
    if (user.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User access permissions updated:', { userId, accessPermissions });

    res.json({ message: 'User access updated successfully' });
  } catch (error) {
    console.error('Error updating access:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Get pending users (admin or superadmin)
router.get('/pending-users', isAuthenticated, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ isApproved: false })
      .select('firstName lastName email createdAt')
      .lean();
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error fetching pending users', error: error.message });
  }
});

// Reject user (superadmin only)
router.post('/reject-user', isAuthenticated, isSuperAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User rejected and removed:', { userId, email: user.email });

    setImmediate(async () => {
      try {
        await sendRejectionEmail(user.email);
      } catch (emailError) {
        console.error('Error sending rejection email:', {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    console.error('Error rejecting user:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

// Delete user (admin or superadmin)
router.delete('/delete-user/:userId', isAuthenticated, isAdminOrSuperAdmin, async (req, res) => {
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

    // Delete profile picture from S3 if it exists
    if (userToDelete.profilePicture && userToDelete.profilePicture.startsWith('https://')) {
      try {
        const fileKey = userToDelete.profilePicture.split('/').slice(-2).join('/');
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted profile picture from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error('Error deleting profile picture during user deletion:', {
          message: deleteError.message,
          stack: deleteError.stack,
          fileKey: userToDelete.profilePicture.split('/').slice(-2).join('/'),
        });
        // Continue despite deletion error to ensure the user is deleted
      }
    }

    await User.findByIdAndDelete(userId);
    console.log('User deleted:', { userId, email: userToDelete.email });

    setImmediate(async () => {
      try {
        await sendDeletionEmail(userToDelete.email);
      } catch (emailError) {
        console.error('Error sending deletion email:', {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
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