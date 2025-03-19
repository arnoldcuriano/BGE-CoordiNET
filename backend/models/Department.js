const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manager: {
    firstName: { type: String },
    lastName: { type: String },
    profilePicture: { type: String },
  },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
});

module.exports = mongoose.model('Department', departmentSchema);