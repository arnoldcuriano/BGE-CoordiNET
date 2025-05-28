const mongoose = require('mongoose');

const patchNoteSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Version 1.2.1 - May 22, 2025"
  content: { type: String, required: true }, // Blog-style content (HTML or Markdown)
  published: { type: Boolean, default: false }, // Whether the patch note is visible to users
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Superadmin who published the note
  publishedAt: { type: Date }, // Date when the patch note was published
}, { timestamps: true });

module.exports = mongoose.model('PatchNote', patchNoteSchema);