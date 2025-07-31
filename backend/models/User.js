const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: {
    type: String,
    default: "viewer",
    enum: ["viewer", "employee", "manager", "hr", "admin", "superadmin"],
  },
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
  assignedItems: [
    { type: mongoose.Schema.Types.ObjectId, ref: "InventoryAssignment" },
  ],
  createdAt: { type: Date, default: Date.now },
  // New Fields
  employeeId: { type: String, unique: true, sparse: true },
  department: {
    type: String,
    enum: [
      "HR",
      "Admin",
      "Audit",
      "Finance",
      "Digital Marketing",
      "Culture",
      "Fullfillment",
      "Other",
    ],
    default: "Other",
  },
  position: { type: String },
  status: {
    type: String,
    enum: ["Active", "On Leave", "Resigned"],
    default: "Active",
  },
  contactNumber: { type: String },
  birthdate: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  civilStatus: {
    type: String,
    enum: ["Single", "Married", "Divorced", "Widowed"],
  },
  governmentIds: {
    sss: { type: String },
    philHealth: { type: String },
    tin: { type: String },
    pagIbig: { type: String },
  },
  hireDate: { type: Date },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    console.log("Hashing password in pre-save hook for user:", this.email);
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Password hashed in pre-save hook");
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("Comparing password for user:", this.email);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log("Password match result:", isMatch);
  return isMatch;
};

module.exports = mongoose.model("User", userSchema);
