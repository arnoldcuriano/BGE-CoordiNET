const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: 'viewer', enum: ['viewer', 'admin', 'superadmin'] },
  profilePicture: { type: String },
  googleId: { type: String },
  displayName: { type: String },
  isApproved: { type: Boolean, default: false },
  accessPermissions: {
    type: Map,
    of: Boolean,
    default: {
      dashboard: false,
      members: false,
      partners: false,
      hrManagement: false,
      projects: false,
      itInventory: false,
      quickTools: false,
      superadminDashboard: false,
      help: true,
      patchNotes: true,
      profileSettings: true,
      accountSettings: true,
    },
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    console.log('Hashing password in pre-save hook for user:', this.email);
    this.password = await bcrypt.hash(this.password, 10);
    console.log('Password hashed in pre-save hook');
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log('Comparing password for user:', this.email);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

module.exports = mongoose.model('User', userSchema);