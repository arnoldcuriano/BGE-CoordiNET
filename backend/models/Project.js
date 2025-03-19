const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Warm', 'Cold', 'Hot'], default: 'Warm' },
  department: { type: String, required: true },
  files: [{ type: String }], // Store file URLs from AWS S3
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);