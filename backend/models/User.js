const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  lastName: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  googleId: { type: String, unique: true, sparse: true }, // Optional, only for Super Admin
  department: { type: String, required: false, function() { return !this.googleId; } }, // Required for non-Google OAuth users
  displayName: String, // For Google OAuth users
  profilePicture: String, // For Google OAuth users
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'viewer'], 
    default: 'viewer',
    required: true 
  },
  isApproved: { 
    type: Boolean, 
    default: function() { 
      return this.role === 'superadmin'; // Auto-approve superadmins
    } 
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);