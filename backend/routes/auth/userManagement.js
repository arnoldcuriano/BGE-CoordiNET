const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const AuditLog = require("../../models/AuditLog");
const ResetToken = require("../../models/ResetToken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { s3Client: s3 } = require("../../s3config");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const stream = require("stream");
const rateLimit = require("express-rate-limit");

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

//Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
});

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE = "/images/default-avatar.png";

// Global middleware to log all requests
router.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`, {
    user: req.user?.email,
    session: req.sessionID,
  });
  next();
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log("isAuthenticated middleware:", {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
  });
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  console.error(
    "Authentication failed: User not authenticated or req.user is undefined"
  );
  return res.status(401).json({ message: "Not authenticated" });
};

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  console.log("isSuperAdmin:", { userId: req.user?._id, role: req.user?.role });
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  console.error(
    "Access denied: Insufficient permissions for user:",
    req.user?.email
  );
  return res
    .status(403)
    .json({ message: "Access denied. Insufficient permissions." });
};

// Middleware to check if user is admin or superadmin
const isAdminOrSuperAdmin = (req, res, next) => {
  console.log("isAdminOrSuperAdmin:", {
    userId: req.user?._id,
    role: req.user?.role,
  });
  if (req.user && ["superadmin", "admin"].includes(req.user.role)) {
    return next();
  }
  console.error(
    "Access denied: Insufficient permissions for user:",
    req.user?.email
  );
  return res
    .status(403)
    .json({ message: "Access denied. Insufficient permissions." });
};

// Middleware to check if user is HR, admin, or superadmin
const isHRAdminOrSuperAdmin = (req, res, next) => {
  console.log("isHRAdminOrSuperAdmin:", {
    userId: req.user?._id,
    role: req.user?.role,
    accessPermissions: req.user?.accessPermissions,
  });
  if (req.user && ["superadmin", "admin", "hr"].includes(req.user.role)) {
    return next();
  }
  console.error(
    "Access denied: Insufficient permissions for user:",
    req.user?.email
  );
  return res
    .status(403)
    .json({ message: "Access denied. Insufficient permissions." });
};

// Middleware to check if user is HR or superadmin
const isHROrSuperAdmin = (req, res, next) => {
  console.log("isHROrSuperAdmin:", {
    userId: req.user?._id,
    role: req.user?.role,
  });
  if (req.user && ["superadmin", "hr"].includes(req.user.role)) {
    return next();
  }
  console.error(
    "Access denied: Insufficient permissions for user:",
    req.user?.email
  );
  return res
    .status(403)
    .json({ message: "Access denied. Insufficient permissions." });
};

// Validate government IDs
const validateGovernmentIds = (ids) => {
  const errors = [];
  if (ids.sss && !/^\d{2}-\d{7}-\d$/.test(ids.sss)) {
    errors.push({
      field: "governmentIds.sss",
      message: "Invalid SSS number format.",
    });
  }
  if (ids.philHealth && !/^\d{2}-\d{9}-\d$/.test(ids.philHealth)) {
    errors.push({
      field: "governmentIds.philHealth",
      message: "Invalid PhilHealth number format.",
    });
  }
  if (ids.tin && !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(ids.tin)) {
    errors.push({ field: "governmentIds.tin", message: "Invalid TIN format." });
  }
  if (ids.pagIbig && !/^\d{4}-\d{4}-\d{4}$/.test(ids.pagIbig)) {
    errors.push({
      field: "governmentIds.pagIbig",
      message: "Invalid Pag-IBIG number format.",
    });
  }
  return errors;
};

// Test route
router.post("/test", (req, res) => {
  res.json({ message: "Test successful" });
});

// Get user info
router.get("/user", isAuthenticated, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error("User object missing or invalid:", req.user);
      return res.status(401).json({ message: "Invalid user session" });
    }

    const user = await User.findById(req.user._id).lean();
    if (!user) {
      console.error("User not found in database:", req.user._id);
      return res.status(404).json({ message: "User not found" });
    }

    const superadminPermissions = {
      dashboard: true,
      members: true,
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
    };

    let permissions = {
      help: true,
      patchNotes: true,
      profileSettings: true,
      accountSettings: true,
      settings: true,
    };

    if (user.role === "superadmin") {
      permissions = superadminPermissions;
    } else {
      const userPermissions = user.accessPermissions || {};
      permissions = { ...permissions, ...userPermissions };
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      role: user.role,
      profilePicture: user.profilePicture
        ? user.profilePicture.startsWith("http")
          ? user.profilePicture
          : DEFAULT_PROFILE_PICTURE
        : DEFAULT_PROFILE_PICTURE,
      isApproved: user.isApproved,
      accessPermissions: permissions,
      employeeId: user.employeeId || null,
      department: user.department || null,
      status: user.status || null,
      position: user.position || null,
      contactNumber: user.contactNumber || null,
      birthdate: user.birthdate || null,
      gender: user.gender || null,
      civilStatus: user.civilStatus || null,
      governmentIds: user.governmentIds || {
        sss: "",
        philHealth: "",
        tin: "",
        pagIbig: "",
      },
      hireDate: user.hireDate || null,
    });
  } catch (error) {
    console.error("Error fetching user info:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    res.status(500).json({
      message: "Server error fetching user info",
      error: error.message,
    });
  }
});

// Get all users (for ITInventory assignments)
router.get("/users", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find().select(
      "firstName lastName profilePicture assignedItems employeeId department status"
    );
    const usersWithImageUrls = users.map((user) => ({
      ...user._doc,
      profilePicture: user.profilePicture
        ? user.profilePicture.startsWith("http")
          ? user.profilePicture
          : DEFAULT_PROFILE_PICTURE
        : DEFAULT_PROFILE_PICTURE,
    }));
    res.json(usersWithImageUrls);
  } catch (error) {
    console.error("Error fetching users:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single user by ID (for detailed views or reassignments)
router.get("/users/:userId", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching user by ID:", req.params.userId);
    const user = await User.findById(req.params.userId).select(
      "firstName lastName profilePicture assignedItems employeeId department status position contactNumber birthdate gender civilStatus governmentIds hireDate role"
    );
    if (!user) {
      console.error("User not found for ID:", req.params.userId);
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      ...user._doc,
      profilePicture: user.profilePicture
        ? user.profilePicture.startsWith("http")
          ? user.profilePicture
          : DEFAULT_PROFILE_PICTURE
        : DEFAULT_PROFILE_PICTURE,
    });
  } catch (error) {
    console.error("Error fetching user:", {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch user details by ID
router.get(
  "/user/:userId",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    try {
      console.log("Fetch user route hit:", {
        userId: req.params.userId,
        requester: req.user?._id,
        requesterRole: req.user?.role,
      });
      const user = await User.findById(req.params.userId)
        .select(
          "firstName lastName email employeeId department position status role hireDate contactNumber birthdate gender civilStatus governmentIds profilePicture"
        )
        .lean();
      if (!user) {
        console.error("User not found for ID:", req.params.userId);
        return res.status(404).json({ message: "User not found" });
      }
      console.log("User found:", user);
      res.json({
        ...user,
        profilePicture: user.profilePicture
          ? user.profilePicture.startsWith("http")
            ? user.profilePicture
            : DEFAULT_PROFILE_PICTURE
          : DEFAULT_PROFILE_PICTURE,
      });
    } catch (error) {
      console.error("Error fetching user:", {
        message: error.message,
        stack: error.stack,
        userId: req.params.userId,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Upload profile picture
router.post(
  "/upload-profile-picture",
  isAuthenticated,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const allowedTypes = ["image/jpeg", "image/png"];
      const maxSize = 5 * 1024 * 1024;
      if (!allowedTypes.includes(file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Only JPEG and PNG files are allowed." });
      }
      if (file.size > maxSize) {
        return res
          .status(400)
          .json({ message: "File size exceeds 5 MB limit." });
      }

      const fileExtension = file.originalname.split(".").pop();
      const fileName = `profile-pics/user-${
        req.user._id
      }-${Date.now()}.${fileExtension}`;
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      const newProfilePictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      if (user.profilePicture && user.profilePicture.startsWith("https://")) {
        try {
          const oldFileKey = user.profilePicture.split("/").slice(-2).join("/");
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: oldFileKey,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
          console.log(`Deleted old profile picture: ${oldFileKey}`);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", {
            message: deleteError.message,
            stack: deleteError.stack,
          });
        }
      }

      user.profilePicture = newProfilePictureUrl;
      await user.save();

      await AuditLog.create({
        userId: req.user._id,
        modifiedBy: req.user._id,
        action: "update",
        changes: {
          profilePicture: {
            old: user.profilePicture,
            new: newProfilePictureUrl,
          },
        },
      });

      res.status(200).json({
        message: "Profile picture uploaded successfully.",
        profilePictureUrl: newProfilePictureUrl,
      });
    } catch (err) {
      console.error("Error uploading profile picture:", {
        message: err.message,
        stack: err.stack,
        userId: req.user?._id,
      });
      res.status(500).json({
        message: "Failed to upload profile picture.",
        error: err.message,
      });
    }
  }
);

// Remove profile picture
router.post(
  "/remove-profile-picture",
  isAuthenticated,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await User.findById(userId || req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (user.profilePicture && user.profilePicture.startsWith("https://")) {
        try {
          const fileKey = user.profilePicture.split("/").slice(-2).join("/");
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
          console.log(`Deleted profile picture from S3: ${fileKey}`);
        } catch (deleteError) {
          console.error("Error deleting profile picture from S3:", {
            message: deleteError.message,
            stack: deleteError.stack,
          });
        }
      }

      const oldProfilePicture = user.profilePicture;
      user.profilePicture = null;
      await user.save();

      await AuditLog.create({
        userId: user._id,
        modifiedBy: req.user._id,
        action: "update",
        changes: { profilePicture: { old: oldProfilePicture, new: null } },
      });

      res
        .status(200)
        .json({ message: "Profile picture removed successfully." });
    } catch (err) {
      console.error("Error removing profile picture:", {
        message: err.message,
        stack: err.stack,
        userId: req.body.userId || req.user?._id,
      });
      res.status(500).json({
        message: "Failed to remove profile picture.",
        error: err.message,
      });
    }
  }
);

// Update profile
router.post("/update-profile", isAuthenticated, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber,
      birthdate,
      gender,
      civilStatus,
      governmentIds,
    } = req.body;
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updates = {
      firstName,
      lastName,
      contactNumber,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      gender,
      civilStatus,
      governmentIds: governmentIds ? JSON.parse(governmentIds) : undefined,
    };

    if (governmentIds) {
      const parsedGovernmentIds = JSON.parse(governmentIds);
      const validationErrors = validateGovernmentIds(parsedGovernmentIds);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Invalid government ID formats.",
          errors: validationErrors,
        });
      }
    }

    const changes = {};
    Object.keys(updates).forEach((key) => {
      if (
        updates[key] !== undefined &&
        JSON.stringify(user[key]) !== JSON.stringify(updates[key])
      ) {
        changes[key] = { old: user[key], new: updates[key] };
      }
    });

    Object.assign(user, {
      ...updates,
      governmentIds: updates.governmentIds || user.governmentIds,
    });
    await user.save();

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        userId: req.user._id,
        modifiedBy: req.user._id,
        action: "update",
        changes,
      });
    }

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Error updating profile:", {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res
      .status(500)
      .json({ message: "Failed to update profile.", error: err.message });
  }
});

// Update email
router.post("/update-email", isAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const domain = email.split("@")[1];
    const allowedDomains = ["bgecorp.com", "beglobalecommercecorp.com"];
    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({ message: "Invalid email domain." });
    }

    const existingUser = await User.findOne({ email });
    if (
      existingUser &&
      existingUser._id.toString() !== req.user._id.toString()
    ) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const oldEmail = user.email;
    user.email = email;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      modifiedBy: req.user._id,
      action: "update",
      changes: { email: { old: oldEmail, new: email } },
    });

    res.status(200).json({ message: "Email updated successfully." });
  } catch (err) {
    console.error("Error updating email:", {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res
      .status(500)
      .json({ message: "Failed to update email.", error: err.message });
  }
});

// Update password
router.post("/update-password", isAuthenticated, async (req, res) => {
  try {
    const { setNewPassword } = req.body;
    if (!setNewPassword) {
      return res.status(400).json({ message: "New password is required." });
    }
    if (setNewPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(setNewPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      modifiedBy: req.user._id,
      action: "update",
      changes: { password: { old: "******", new: "******" } },
    });

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in update-password:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    res
      .status(500)
      .json({ message: "Failed to update password.", error: error.message });
  }
});

// Send password reset link
router.post(
  "/send-reset-link",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      if (!user.isApproved) {
        return res.status(403).json({
          message: "Account not approved. Contact the administrator.",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      await ResetToken.create({
        userId: user._id,
        token,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      const transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });

      const mailOptions = {
        from: '"BGE App" <support@beglobalecommercecorp.com>',
        to: user.email,
        subject: "Password Reset Request",
        html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color: #4285F4; text-align: center; margin-bottom: 20px;">BGE App</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              A password reset has been requested for your BGE account by an administrator.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Click the button below to reset your password (expires in 15 minutes):
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${resetUrl}" style="background-color: #34A853; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
              If you did not expect this request, please contact support.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © 2025 BGE App. All rights reserved.
          </div>
        </div>
      `,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Password reset link sent to the user’s email." });

      // Log audit in a separate try-catch to prevent affecting the response
      try {
        await AuditLog.create({
          userId: user._id,
          modifiedBy: req.user._id,
          action: "password_reset_request",
          changes: { email },
          timestamp: new Date(),
        });
      } catch (auditError) {
        console.error("Error logging audit for password reset request:", {
          message: auditError.message,
          stack: auditError.stack,
          email,
        });
      }
    } catch (error) {
      console.error("Error in send-reset-link:", {
        message: error.message,
        stack: error.stack,
        email: req.body.email,
      });
      res
        .status(500)
        .json({ message: "Failed to send reset link.", error: error.message });
    }
  }
);

// Delete account
router.post("/delete-account", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.profilePicture && user.profilePicture.startsWith("https://")) {
      try {
        const fileKey = user.profilePicture.split("/").slice(-2).join("/");
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted profile picture from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error(
          "Error deleting profile picture during account deletion:",
          {
            message: deleteError.message,
            stack: deleteError.stack,
          }
        );
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      modifiedBy: req.user._id,
      action: "delete",
      changes: { email: user.email, role: user.role },
    });

    await User.findByIdAndDelete(req.user._id);
    console.log("User account deleted:", {
      userId: req.user._id,
      email: user.email,
    });

    setImmediate(async () => {
      try {
        await sendDeletionEmail(user.email);
      } catch (emailError) {
        console.error("Error sending deletion email:", {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Error deleting account:", {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
    });
    res
      .status(500)
      .json({ message: "Failed to delete account.", error: err.message });
  }
});

// Add new member
router.post(
  "/add-member",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        contactNumber,
        employeeId,
        department,
        position,
        status,
        birthdate,
        gender,
        civilStatus,
        governmentIds,
        hireDate,
        role,
      } = req.body;

      if (!firstName || !lastName || !email || !employeeId) {
        return res.status(400).json({
          message:
            "First name, last name, email, and employee ID are required.",
        });
      }

      const domain = email.split("@")[1];
      const allowedDomains = ["bgecorp.com", "beglobalecommercecorp.com"];
      if (!allowedDomains.includes(domain)) {
        return res.status(400).json({ message: "Invalid email domain." });
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email or Employee ID already exists." });
      }

      const currentUserRole = req.user.role;
      if (role === "superadmin" && currentUserRole !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Only superadmins can assign superadmin role." });
      }
      if (
        role === "admin" &&
        !["superadmin", "admin"].includes(currentUserRole)
      ) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to assign admin role." });
      }

      if (governmentIds) {
        const parsedGovernmentIds = JSON.parse(governmentIds);
        const validationErrors = validateGovernmentIds(parsedGovernmentIds);
        if (validationErrors.length > 0) {
          return res.status(400).json({
            message: "Invalid government ID formats.",
            errors: validationErrors,
          });
        }
      }

      const defaultPassword = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      let profilePictureUrl = null;
      if (req.file) {
        const fileExtension = req.file.originalname.split(".").pop();
        const fileName = `profile-pics/user-${crypto
          .randomBytes(8)
          .toString("hex")}-${Date.now()}.${fileExtension}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);
        profilePictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      }

      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        employeeId,
        department: department || "Other",
        position,
        status: status || "Active",
        contactNumber,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        gender,
        civilStatus,
        governmentIds: governmentIds ? JSON.parse(governmentIds) : undefined,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        role: role || "employee",
        isApproved: true,
        profilePicture: profilePictureUrl,
      });

      await user.save();

      await AuditLog.create({
        userId: user._id,
        modifiedBy: req.user._id,
        action: "create",
        changes: { ...req.body, profilePicture: profilePictureUrl || "none" },
      });

      setImmediate(async () => {
        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: process.env.MAILTRAP_USER,
              pass: process.env.MAILTRAP_PASS,
            },
          });
          const mailOptions = {
            from: '"BGE App" <support@beglobalecommercecorp.com>',
            to: email,
            subject: "Your BGE Account Credentials",
            html: `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color: #4285F4; text-align: center; margin-bottom: 20px;">Welcome to BGE App</h1>
                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                  Your account has been created. Below are your login credentials:
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                  <strong>Email:</strong> ${email}<br />
                  <strong>Password:</strong> ${defaultPassword}
                </p>
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${process.env.FRONTEND_URL}/login" style="background-color: #34A853; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Log In
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                  Please change your password after logging in.
                </p>
              </div>
            </div>
          `,
          };

          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error("Error sending credentials email:", {
            message: emailError.message,
            stack: emailError.stack,
          });
        }
      });

      res
        .status(201)
        .json({ message: "Member added successfully.", userId: user._id });
    } catch (error) {
      console.error("Error adding member:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Edit member
router.put(
  "/edit-member/:userId",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        firstName,
        lastName,
        email,
        contactNumber,
        employeeId,
        department,
        position,
        status,
        birthdate,
        gender,
        civilStatus,
        governmentIds,
        hireDate,
        role,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !employeeId) {
        return res.status(400).json({
          message:
            "First name, last name, email, and employee ID are required.",
        });
      }

      const currentUserRole = req.user.role;
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found." });
      }

      if (role) {
        if (role === "superadmin" && currentUserRole !== "superadmin") {
          return res
            .status(403)
            .json({ message: "Only superadmins can assign superadmin role." });
        }
        if (
          role === "admin" &&
          !["superadmin", "admin"].includes(currentUserRole)
        ) {
          return res.status(403).json({
            message: "Insufficient permissions to assign admin role.",
          });
        }
        if (
          targetUser.role === "superadmin" &&
          currentUserRole !== "superadmin"
        ) {
          return res.status(403).json({
            message: "Only superadmins can modify superadmin accounts.",
          });
        }
      }

      if (email && email !== targetUser.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== userId) {
          return res.status(400).json({ message: "Email already in use." });
        }
      }
      if (employeeId && employeeId !== targetUser.employeeId) {
        const existingEmployeeId = await User.findOne({ employeeId });
        if (
          existingEmployeeId &&
          existingEmployeeId._id.toString() !== userId
        ) {
          return res
            .status(400)
            .json({ message: "Employee ID already in use." });
        }
      }

      if (governmentIds) {
        const parsedGovernmentIds = JSON.parse(governmentIds);
        const validationErrors = validateGovernmentIds(parsedGovernmentIds);
        if (validationErrors.length > 0) {
          return res.status(400).json({
            message: "Invalid government ID formats.",
            errors: validationErrors,
          });
        }
      }

      let profilePictureUrl = targetUser.profilePicture;
      if (
        req.file &&
        (req.user._id.toString() === userId || currentUserRole === "superadmin")
      ) {
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 5 * 1024 * 1024;
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res
            .status(400)
            .json({ message: "Only JPEG and PNG files are allowed." });
        }
        if (req.file.size > maxSize) {
          return res
            .status(400)
            .json({ message: "File size exceeds 5 MB limit." });
        }

        const fileExtension = req.file.originalname.split(".").pop();
        const fileName = `profile-pics/user-${userId}-${Date.now()}.${fileExtension}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);
        profilePictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        if (
          targetUser.profilePicture &&
          targetUser.profilePicture.startsWith("https://")
        ) {
          try {
            const oldFileKey = targetUser.profilePicture
              .split("/")
              .slice(-2)
              .join("/");
            const deleteParams = {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: oldFileKey,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3.send(deleteCommand);
            console.log(`Deleted old profile picture: ${oldFileKey}`);
          } catch (deleteError) {
            console.error("Error deleting old profile picture:", {
              message: deleteError.message,
              stack: deleteError.stack,
            });
          }
        }
      } else if (
        req.body.profilePicture === "" &&
        currentUserRole === "superadmin"
      ) {
        if (
          targetUser.profilePicture &&
          targetUser.profilePicture.startsWith("https://")
        ) {
          try {
            const oldFileKey = targetUser.profilePicture
              .split("/")
              .slice(-2)
              .join("/");
            const deleteParams = {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: oldFileKey,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3.send(deleteCommand);
            console.log(`Deleted profile picture from S3: ${oldFileKey}`);
          } catch (deleteError) {
            console.error("Error deleting profile picture:", {
              message: deleteError.message,
              stack: deleteError.stack,
            });
          }
        }
        profilePictureUrl = null;
      }

      const updates = {
        firstName,
        lastName,
        email,
        contactNumber,
        employeeId,
        department: department || "Other",
        position: position || "",
        status: status || "Active",
        birthdate: birthdate ? new Date(birthdate) : undefined,
        gender,
        civilStatus,
        governmentIds: governmentIds ? JSON.parse(governmentIds) : undefined,
        hireDate: hireDate
          ? new Date(hireDate)
          : targetUser.hireDate || new Date(),
        role: role || targetUser.role,
        profilePicture: profilePictureUrl,
      };

      Object.keys(updates).forEach(
        (key) => updates[key] === undefined && delete updates[key]
      );

      const changes = {};
      Object.keys(updates).forEach((key) => {
        if (JSON.stringify(targetUser[key]) !== JSON.stringify(updates[key])) {
          changes[key] = { old: targetUser[key], new: updates[key] };
        }
      });

      await User.updateOne({ _id: userId }, { $set: updates });

      if (Object.keys(changes).length > 0) {
        await AuditLog.create({
          userId,
          modifiedBy: req.user._id,
          action: "update",
          changes,
        });
      }

      if (status === "Resigned" && targetUser.status !== "Resigned") {
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              accessPermissions: {
                help: true,
                patchNotes: true,
                profileSettings: true,
                accountSettings: true,
              },
            },
          }
        );
        await AuditLog.create({
          userId,
          modifiedBy: req.user._id,
          action: "status_change",
          changes: { status: { old: targetUser.status, new: "Resigned" } },
        });
      }

      res.json({ message: "Member updated successfully." });
    } catch (error) {
      console.error("Error editing member:", {
        message: error.message,
        stack: error.stack,
        userId,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get all members with search and filter
router.get(
  "/hr-members",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    console.log("HR Members route hit:", req.query);
    try {
      const {
        department,
        status,
        role,
        search,
        dateHiredStart,
        dateHiredEnd,
        page = 1,
        limit = 10,
      } = req.query;
      const query = { isApproved: true };

      if (department) query.department = department;
      if (status) query.status = status;
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }
      if (dateHiredStart || dateHiredEnd) {
        query.hireDate = {};
        if (dateHiredStart) query.hireDate.$gte = new Date(dateHiredStart);
        if (dateHiredEnd) query.hireDate.$lte = new Date(dateHiredEnd);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const users = await User.find(query)
        .select(
          "firstName lastName email employeeId department position status role profilePicture hireDate contactNumber birthdate gender civilStatus governmentIds"
        )
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      const total = await User.countDocuments(query);

      const usersWithImageUrls = users.map((user) => ({
        ...user,
        profilePicture: user.profilePicture
          ? user.profilePicture.startsWith("http")
            ? user.profilePicture
            : DEFAULT_PROFILE_PICTURE
          : DEFAULT_PROFILE_PICTURE,
      }));

      res.json({ members: usersWithImageUrls, total });
    } catch (error) {
      console.error("Error fetching members:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get member history/logs
router.get(
  "/member-logs/:userId",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const logs = await AuditLog.find({ userId })
        .populate("modifiedBy", "firstName lastName email")
        .sort({ timestamp: -1 })
        .lean();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching member logs:", {
        message: error.message,
        stack: error.stack,
        userId: req.params.userId,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Approve user (superadmin only)
router.post(
  "/approve-user",
  isAuthenticated,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        return res
          .status(400)
          .json({ message: "User ID and role are required." });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      user.isApproved = true;
      user.role = role;
      user.accessPermissions = {
        help: true,
        patchNotes: true,
        profileSettings: true,
        accountSettings: true,
        settings: true,
      };
      await user.save();

      await AuditLog.create({
        userId,
        modifiedBy: req.user._id,
        action: "update",
        changes: {
          isApproved: { old: false, new: true },
          role: { old: user.role, new: role },
        },
      });

      setImmediate(async () => {
        try {
          await sendApprovalEmail(user.email);
        } catch (emailError) {
          console.error("Error sending approval email:", {
            message: emailError.message,
            stack: emailError.stack,
          });
        }
      });

      res.json({ message: "User approved successfully." });
    } catch (error) {
      console.error("Error approving user:", {
        message: error.message,
        stack: error.stack,
        userId: req.body.userId,
      });
      res
        .status(500)
        .json({ message: "Approval failed.", error: error.message });
    }
  }
);

// Get approved members (superadmin only)
router.get("/members", isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ isApproved: true })
      .select(
        "firstName lastName email role createdAt accessPermissions employeeId department status position hireDate"
      )
      .lean();
    res.json(users);
  } catch (error) {
    console.error("Error fetching members:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Error fetching members.", error: error.message });
  }
});

// Update user (superadmin only)
router.put("/update-user", isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const { userId, firstName, lastName, role, password } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (role) updateFields.role = role;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const changes = {};
    Object.keys(updateFields).forEach((key) => {
      if (JSON.stringify(user[key]) !== JSON.stringify(updateFields[key])) {
        changes[key] = { old: user[key], new: updateFields[key] };
      }
    });

    const updatedUser = await User.updateOne(
      { _id: userId },
      { $set: updateFields }
    );
    if (updatedUser.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        userId,
        modifiedBy: req.user._id,
        action: "update",
        changes,
      });
    }

    res.json({ message: "User updated successfully." });
  } catch (error) {
    console.error("Error updating user:", {
      message: error.message,
      stack: error.stack,
      userId: req.body.userId,
    });
    res.status(500).json({ message: "Update failed.", error: error.message });
  }
});

// Update access permissions (superadmin only)
router.put(
  "/update-access",
  isAuthenticated,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { userId, accessPermissions } = req.body;
      if (!userId || !accessPermissions) {
        return res
          .status(400)
          .json({ message: "User ID and access permissions are required." });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const changes = {
        accessPermissions: {
          old: user.accessPermissions,
          new: accessPermissions,
        },
      };
      const updatedUser = await User.updateOne(
        { _id: userId },
        { $set: { accessPermissions } }
      );
      if (updatedUser.matchedCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      await AuditLog.create({
        userId,
        modifiedBy: req.user._id,
        action: "update",
        changes,
      });

      res.json({ message: "User access updated successfully." });
    } catch (error) {
      console.error("Error updating access:", {
        message: error.message,
        stack: error.stack,
        userId: req.body.userId,
      });
      res.status(500).json({ message: "Update failed.", error: error.message });
    }
  }
);

// Get pending users (admin or superadmin)
router.get(
  "/pending-users",
  isAuthenticated,
  isAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const users = await User.find({ isApproved: false })
        .select("firstName lastName email createdAt")
        .lean();
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending users:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        message: "Error fetching pending users.",
        error: error.message,
      });
    }
  }
);

// Reject user (superadmin only)
router.post("/reject-user", isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.profilePicture && user.profilePicture.startsWith("https://")) {
      try {
        const fileKey = user.profilePicture.split("/").slice(-2).join("/");
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand);
        console.log(`Deleted profile picture from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error("Error deleting profile picture during rejection:", {
          message: deleteError.message,
          stack: deleteError.stack,
        });
      }
    }

    await AuditLog.create({
      userId,
      modifiedBy: req.user._id,
      action: "delete",
      changes: { email: user.email, role: user.role },
    });

    await User.findByIdAndDelete(userId);
    console.log("User rejected and removed:", { userId, email: user.email });

    setImmediate(async () => {
      try {
        await sendRejectionEmail(user.email);
      } catch (emailError) {
        console.error("Error sending rejection email:", {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
    });

    res.json({ message: "User rejected and removed." });
  } catch (error) {
    console.error("Error rejecting user:", {
      message: error.message,
      stack: error.stack,
      userId: req.body.userId,
    });
    res
      .status(500)
      .json({ message: "Rejection failed.", error: error.message });
  }
});

// Delete user (admin or superadmin)
router.delete(
  "/delete-user/:userId",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found." });
      }

      const currentUserRole = req.user.role;
      const targetUserRole = userToDelete.role;

      if (
        currentUserRole === "hr" &&
        ["admin", "superadmin"].includes(targetUserRole)
      ) {
        return res
          .status(403)
          .json({ message: "HR cannot delete admin or superadmin members." });
      }
      if (currentUserRole === "admin" && targetUserRole === "superadmin") {
        return res
          .status(403)
          .json({ message: "Admins cannot delete superadmin members." });
      }

      if (
        userToDelete.profilePicture &&
        userToDelete.profilePicture.startsWith("https://")
      ) {
        try {
          const fileKey = userToDelete.profilePicture
            .split("/")
            .slice(-2)
            .join("/");
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
          console.log(`Deleted profile picture from S3: ${fileKey}`);
        } catch (deleteError) {
          console.error(
            "Error deleting profile picture during user deletion:",
            {
              message: deleteError.message,
              stack: deleteError.stack,
            }
          );
        }
      }

      await AuditLog.create({
        userId,
        modifiedBy: req.user._id,
        action: "delete",
        changes: { email: userToDelete.email, role: userToDelete.role },
      });

      await User.findByIdAndDelete(userId);
      console.log("User deleted:", { userId, email: userToDelete.email });

      setImmediate(async () => {
        try {
          await sendDeletionEmail(userToDelete.email);
        } catch (emailError) {
          console.error("Error sending deletion email:", {
            message: emailError.message,
            stack: emailError.stack,
          });
        }
      });

      res.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", {
        message: error.message,
        stack: error.stack,
        userId,
      });
      res
        .status(500)
        .json({ message: "Deletion failed.", error: error.message });
    }
  }
);

// Export members to CSV
router.get(
  "/export-members",
  isAuthenticated,
  isHRAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const { department, status, role, search, dateHiredStart, dateHiredEnd } =
        req.query;
      const query = { isApproved: true };

      if (department) query.department = department;
      if (status) query.status = status;
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }
      if (dateHiredStart || dateHiredEnd) {
        query.hireDate = {};
        if (dateHiredStart) query.hireDate.$gte = new Date(dateHiredStart);
        if (dateHiredEnd) query.hireDate.$lte = new Date(dateHiredEnd);
      }

      const users = await User.find(query)
        .select(
          "firstName lastName email employeeId department position status role hireDate contactNumber birthdate gender civilStatus governmentIds"
        )
        .lean();

      const fields = [
        "firstName",
        "lastName",
        "email",
        "employeeId",
        "department",
        "position",
        "status",
        "role",
        "hireDate",
        "contactNumber",
        "birthdate",
        "gender",
        "civilStatus",
        "governmentIds.sss",
        "governmentIds.philHealth",
        "governmentIds.tin",
        "governmentIds.pagIbig",
      ];

      const csvData = users.map((user) => ({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        status: user.status,
        role: user.role,
        hireDate: user.hireDate ? new Date(user.hireDate).toISOString() : "",
        contactNumber: user.contactNumber || "",
        birthdate: user.birthdate ? new Date(user.birthdate).toISOString() : "",
        gender: user.gender || "",
        civilStatus: user.civilStatus || "",
        "governmentIds.sss": user.governmentIds?.sss || "",
        "governmentIds.philHealth": user.governmentIds?.philHealth || "",
        "governmentIds.tin": user.governmentIds?.tin || "",
        "governmentIds.pagIbig": user.governmentIds?.pagIbig || "",
      }));

      const parser = new Parser({ fields });
      const csvContent = parser.parse(csvData);

      res.header("Content-Type", "text/csv");
      res.attachment("members.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting members:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Parse CSV for import preview
router.post(
  "/parse-csv",
  isAuthenticated,
  isHROrSuperAdmin,
  limiter,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const results = [];
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      bufferStream
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          res.json({ rows: results });
        })
        .on("error", (error) => {
          console.error("Error parsing CSV:", error);
          res.status(500).json({ message: "Failed to parse CSV file." });
        });
    } catch (error) {
      console.error("Error in parse-csv:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Import selected members
router.post(
  "/import-selected",
  isAuthenticated,
  isHROrSuperAdmin,
  async (req, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res
          .status(400)
          .json({ message: "No rows provided for import." });
      }

      const addedCount = [];
      const errors = [];

      for (const row of rows) {
        try {
          const {
            firstName,
            lastName,
            email,
            employeeId,
            department,
            position,
            status,
            role,
            hireDate,
            contactNumber,
            birthdate,
            gender,
            civilStatus,
            "governmentIds.sss": sss,
            "governmentIds.philHealth": philHealth,
            "governmentIds.tin": tin,
            "governmentIds.pagIbig": pagIbig,
          } = row;

          if (!firstName || !lastName || !email || !employeeId) {
            errors.push({ row, message: "Missing required fields." });
            continue;
          }

          const domain = email.split("@")[1];
          const allowedDomains = ["bgecorp.com", "beglobalecommercecorp.com"];
          if (!allowedDomains.includes(domain)) {
            errors.push({ row, message: "Invalid email domain." });
            continue;
          }

          const existingUser = await User.findOne({
            $or: [{ email }, { employeeId }],
          });
          if (existingUser) {
            errors.push({
              row,
              message: "Email or Employee ID already exists.",
            });
            continue;
          }

          const governmentIdsParsed = {
            sss: sss || "",
            philHealth: philHealth || "",
            tin: tin || "",
            pagIbig: pagIbig || "",
          };
          const validationErrors = validateGovernmentIds(governmentIdsParsed);
          if (validationErrors.length > 0) {
            errors.push({
              row,
              message: "Invalid government ID formats.",
              details: validationErrors,
            });
            continue;
          }

          const defaultPassword = crypto.randomBytes(8).toString("hex");
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);

          const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            employeeId,
            department: department || "Other",
            position: position || "",
            status: status || "Active",
            contactNumber: contactNumber || null,
            birthdate: birthdate ? new Date(birthdate) : null,
            gender: gender || null,
            civilStatus: civilStatus || null,
            governmentIds: governmentIdsParsed,
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            role: role || "employee",
            isApproved: true,
            profilePicture: null,
          });

          await user.save();

          await AuditLog.create({
            userId: user._id,
            modifiedBy: req.user._id,
            action: "create",
            changes: row,
          });

          setImmediate(async () => {
            try {
              const transporter = nodemailer.createTransport({
                host: "smtp.mailtrap.io",
                port: 2525,
                auth: {
                  user: process.env.MAILTRAP_USER,
                  pass: process.env.MAILTRAP_PASS,
                },
              });
              const mailOptions = {
                from: '"BGE App" <support@beglobalecommercecorp.com>',
                to: email,
                subject: "Your BGE Account Credentials",
                html: `
                  <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                      <h1 style="color: #4285F4; text-align: center; margin-bottom: 20px;">Welcome to BGE App</h1>
                      <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        Your account has been created. Below are your login credentials:
                      </p>
                      <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        <strong>Email:</strong> ${email}<br />
                        <strong>Password:</strong> ${defaultPassword}
                      </p>
                      <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #34A853; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                          Log In
                        </a>
                      </div>
                      <p style="color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                        Please change your password after logging in.
                      </p>
                    </div>
                  </div>
                `,
              };

              await transporter.sendMail(mailOptions);
            } catch (emailError) {
              console.error(
                "Error sending credentials email for imported user:",
                {
                  message: emailError.message,
                  stack: emailError.stack,
                  email,
                }
              );
            }
          });

          addedCount.push(user._id);
        } catch (rowError) {
          console.error("Error importing row:", rowError, row);
          errors.push({ row, message: rowError.message });
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({
          message: `Imported ${addedCount.length} members successfully. ${errors.length} errors occurred.`,
          errors,
        });
      } else {
        return res
          .status(200)
          .json({ message: "All selected members imported successfully." });
      }
    } catch (error) {
      console.error("Error importing selected members:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Email functions
async function sendApprovalEmail(userEmail) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: userEmail,
      subject: "Your Account Has Been Approved",
      text: "Your account has been approved by the administrator. You can now log in.",
    };

    await transporter.sendMail(mailOptions);
    console.log("Approval email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending approval email:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

async function sendRejectionEmail(userEmail) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: userEmail,
      subject: "Your Registration Has Been Rejected",
      text: "Your registration request has been reviewed and rejected by the administrator.",
    };

    await transporter.sendMail(mailOptions);
    console.log("Rejection email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending rejection email:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

async function sendDeletionEmail(userEmail) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"BGE App" <support@beglobalecommercecorp.com>',
      to: userEmail,
      subject: "Your Account Has Been Deleted",
      text: "Your account has been deleted by an administrator. If this was a mistake, please contact support.",
    };

    await transporter.sendMail(mailOptions);
    console.log("Deletion email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending deletion email:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = router;
