const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  lastName: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
  googleId: { type: String, unique: true, sparse: true }, // Optional, only for Super Admin
  department: { type: String, required: function() { return !this.googleId; } }, // Required for non-Google OAuth users
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
  }
});

module.exports = mongoose.model('User', userSchema);