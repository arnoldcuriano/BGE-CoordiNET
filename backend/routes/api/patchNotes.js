const express = require('express');
const router = express.Router();
const PatchNote = require('../../models/PatchNote');

// Middleware to check if user is a superadmin
const isSuperadmin = (req, res, next) => {
  console.log('Backend: Checking superadmin status for user:', req.user);
  if (!req.user || req.user.role !== 'superadmin') {
    console.log('Backend: Access denied - not a superadmin');
    return res.status(403).json({ message: 'Access denied. Superadmin privileges required.' });
  }
  next();
};

// Get all published patch notes (accessible to all users, including unauthenticated)
router.get('/', async (req, res) => {
  try {
    console.log('Backend: Received GET request to /api/patch-notes');
    const patchNotes = await PatchNote.find({ published: true })
      .sort({ publishedAt: -1 }); // Sort by publish date, newest first
    console.log('Backend: Fetched patch notes:', patchNotes);
    res.json(patchNotes);
  } catch (error) {
    console.error('Backend: Error fetching patch notes:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new patch note (superadmin only)
router.post('/', isSuperadmin, async (req, res) => {
  try {
    console.log('Backend: Received POST request to /api/patch-notes with body:', req.body);
    const { title, content, published } = req.body;
    if (!title || !content) {
      console.log('Backend: Missing title or content');
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const patchNote = new PatchNote({
      title,
      content,
      published: published !== undefined ? published : false,
      publishedBy: req.user._id,
      publishedAt: published ? new Date() : null,
    });

    console.log('Backend: Creating patch note:', patchNote);
    await patchNote.save();
    console.log('Backend: Patch note created:', patchNote);
    res.status(201).json({ message: 'Patch note created successfully', patchNote });
  } catch (error) {
    console.error('Backend: Error creating patch note:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a patch note (superadmin only)
router.put('/:id', isSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;
    console.log(`Backend: Received PUT request to /api/patch-notes/${id} with body:`, req.body);

    const patchNote = await PatchNote.findById(id);
    if (!patchNote) {
      console.log('Backend: Patch note not found:', id);
      return res.status(404).json({ message: 'Patch note not found' });
    }

    patchNote.title = title || patchNote.title;
    patchNote.content = content || patchNote.content;
    if (typeof published !== 'undefined') {
      patchNote.published = published;
      if (published && !patchNote.publishedAt) {
        patchNote.publishedAt = new Date();
      } else if (!published) {
        patchNote.publishedAt = null;
      }
    }
    patchNote.publishedBy = req.user._id;

    await patchNote.save();
    console.log('Backend: Patch note updated:', patchNote);
    res.json({ message: 'Patch note updated successfully', patchNote });
  } catch (error) {
    console.error('Backend: Error updating patch note:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a patch note (superadmin only)
router.delete('/:id', isSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Backend: Received DELETE request to /api/patch-notes/${id}`);
    const patchNote = await PatchNote.findByIdAndDelete(id);
    if (!patchNote) {
      console.log('Backend: Patch note not found:', id);
      return res.status(404).json({ message: 'Patch note not found' });
    }
    console.log('Backend: Patch note deleted:', id);
    res.json({ message: 'Patch note deleted successfully' });
  } catch (error) {
    console.error('Backend: Error deleting patch note:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;