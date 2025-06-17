const express = require('express');
const router = express.Router();
const InventoryItem = require('../../models/InventoryItem');
const InventoryAssignment = require('../../models/InventoryAssignment');
const InventoryNotification = require('../../models/InventoryNotifications');
const User = require('../../models/User');
const multer = require('multer');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { bucket } = require('../../s3config');

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

// Configure multer for memory storage (we'll upload to S3 directly)
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/inventory - Fetch all inventory items
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    console.log('Fetched inventory items:', items);
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory items:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory - Add a new inventory item
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const newItem = new InventoryItem(req.body);
    await newItem.save();

    // Add a notification for the new item
    const notification = new InventoryNotification({
      message: `New inventory item added: ${newItem.name}`,
      itemId: newItem._id,
    });
    await notification.save();

    // Log the activity
    newItem.activityLog.push({
      action: 'Item created',
      performedBy: req.user._id,
      details: `Item ${newItem.name} created by ${req.user.firstName} ${req.user.lastName}`,
    });
    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding inventory item:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/inventory/:id - Update an inventory item
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    Object.assign(item, req.body);

    // Log the activity
    item.activityLog.push({
      action: `Item updated: ${item.name}`,
      performedBy: req.user._id,
      details: `Item ${item.name} updated by ${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    res.json(item);
  } catch (err) {
    console.error('Error updating inventory item:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/inventory/:id - Delete an inventory item
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if the item is assigned to any user
    const assignment = await InventoryAssignment.findOne({ itemId: req.params.id });
    if (assignment) {
      return res.status(400).json({ message: 'Cannot delete item that is currently assigned' });
    }

    // Log the activity before deleting
    item.activityLog.push({
      action: `Item deleted: ${item.name}`,
      performedBy: req.user._id,
      details: `Item ${item.name} deleted by ${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    await InventoryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('Error deleting inventory item:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory/:id/assign - Assign an inventory item to a user
router.post('/:id/assign', isAuthenticated, upload.single('acknowledgmentDocument'), async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (item.status !== 'Available') {
      return res.status(400).json({ message: 'Item is not available for assignment' });
    }

    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let acknowledgmentDocumentUrl = null;
    if (req.file) {
      const file = req.file;

      // File validation
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Only PDF and Word documents are allowed.' });
      }
      if (file.size > maxSize) {
        return res.status(400).json({ message: 'File size exceeds 10 MB limit.' });
      }

      const fileExtension = file.originalname.split('.').pop();
      const fileName = `inventory-acknowledgment-docs/${Date.now()}-${req.params.id}.${fileExtension}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await req.s3Client.send(command);
      acknowledgmentDocumentUrl = `https://bge-user-files.s3.amazonaws.com/${fileName}`;
      console.log('Acknowledgment document uploaded to S3:', acknowledgmentDocumentUrl);
    }

    const assignment = new InventoryAssignment({
      itemId: req.params.id,
      userId: req.body.userId,
      assignedAt: new Date(),
      acknowledgmentDocument: acknowledgmentDocumentUrl,
    });

    await assignment.save();

    item.status = 'Assigned';
    item.activityLog.push({
      action: `Assigned to user: ${user.firstName} ${user.lastName}`,
      performedBy: req.user._id,
      details: `Item ${item.name} assigned to ${user.firstName} ${user.lastName} by ${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    user.assignedItems.push(req.params.id);
    await user.save();

    const notification = new InventoryNotification({
      message: `Inventory item assigned to ${user.firstName} ${user.lastName}: ${item.name}`,
      itemId: req.params.id,
    });
    await notification.save();

    res.status(201).json(assignment);
  } catch (err) {
    console.error('Error assigning inventory item:', {
      message: err.message,
      stack: err.stack,
      itemId: req.params.id,
      userId: req.body.userId,
      file: req.file ? { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : null,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory/:id/return - Return an inventory item
router.post('/:id/return', isAuthenticated, async (req, res) => {
  try {
    const assignment = await InventoryAssignment.findOne({ itemId: req.params.id });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const user = await User.findById(assignment.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete acknowledgment document from S3 if it exists
    if (assignment.acknowledgmentDocument && assignment.acknowledgmentDocument.startsWith('https://')) {
      try {
        // Extract the file key correctly after the updated endpoint
        const fileKey = assignment.acknowledgmentDocument.split('bge-user-files.s3.amazonaws.com/')[1];
        const deleteParams = {
          Bucket: bucket,
          Key: fileKey,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await req.s3Client.send(deleteCommand);
        console.log(`Deleted acknowledgment document from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error('Error deleting acknowledgment document from S3:', {
          message: deleteError.message,
          stack: deleteError.stack,
          fileKey: assignment.acknowledgmentDocument.split('bge-user-files.s3.amazonaws.com/')[1] || 'unknown',
        });
        // Continue despite deletion error
      }
    }

    item.status = 'Available';
    item.activityLog.push({
      action: `Returned by user: ${user.firstName} ${user.lastName}`,
      performedBy: req.user._id,
      details: `Item ${item.name} returned by ${user.firstName} ${user.lastName}, action performed by ${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    user.assignedItems = user.assignedItems.filter(itemId => itemId.toString() !== req.params.id);
    await user.save();

    await InventoryAssignment.deleteOne({ itemId: req.params.id });

    const notification = new InventoryNotification({
      message: `Inventory item returned by ${user.firstName} ${user.lastName}: ${item.name}`,
      itemId: req.params.id,
    });
    await notification.save();

    res.json({ message: 'Item returned successfully' });
  } catch (err) {
    console.error('Error returning inventory item:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory/:id/reassign - Reassign an inventory item to a new user
router.post('/:id/reassign', isAuthenticated, async (req, res) => {
  try {
    const { assignmentId, newUserId } = req.body;
    const assignment = await InventoryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const oldUser = await User.findById(assignment.userId);
    if (!oldUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    const newUser = await User.findById(newUserId);
    if (!newUser) {
      return res.status(404).json({ message: 'New user not found' });
    }

    // Update the assignment
    assignment.userId = newUserId;
    await assignment.save();

    // Update the old user's assigned items
    oldUser.assignedItems = oldUser.assignedItems.filter(itemId => itemId.toString() !== req.params.id);
    await oldUser.save();

    // Update the new user's assigned items
    newUser.assignedItems.push(req.params.id);
    await newUser.save();

    // Log the activity
    item.activityLog.push({
      action: `Reassigned to user: ${newUser.firstName} ${newUser.lastName}`,
      performedBy: req.user._id,
      details: `Item ${item.name} reassigned from ${oldUser.firstName} ${oldUser.lastName} to ${newUser.firstName} ${newUser.lastName} by ${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    const notification = new InventoryNotification({
      message: `Inventory item reassigned to ${newUser.firstName} ${newUser.lastName}: ${item.name}`,
      itemId: req.params.id,
    });
    await notification.save();

    res.json({ message: 'Item reassigned successfully' });
  } catch (err) {
    console.error('Error reassigning inventory item:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/inventory/assignments - Fetch all inventory assignments
router.get('/assignments', isAuthenticated, async (req, res) => {
  try {
    const assignments = await InventoryAssignment.find()
      .populate('itemId', 'name serialNumber category status warrantyEndDate supportDetails')
      .populate('userId', 'firstName lastName profilePicture');
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching inventory assignments:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/inventory/notifications - Fetch inventory notifications
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const notifications = await InventoryNotification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching inventory notifications:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory/notifications/:id/read - Mark an inventory notification as read
router.post('/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notification = await InventoryNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking inventory notification as read:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/inventory/bulk-upload - Bulk upload inventory items from CSV
router.post('/bulk-upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const rows = csvData.split('\n').map(row => row.split(','));

    // Skip the header row
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      if (row.length < 3) continue; // Skip incomplete rows

      const [name, category, serialNumber, warrantyEndDate, supportDetails] = row;
      const newItem = new InventoryItem({
        name: name.trim(),
        category: category.trim(),
        serialNumber: serialNumber.trim(),
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate.trim()) : undefined,
        supportDetails: supportDetails ? supportDetails.trim() : undefined,
      });

      await newItem.save();

      // Log the activity
      newItem.activityLog.push({
        action: 'Item created via bulk upload',
        performedBy: req.user._id,
        details: `Item ${newItem.name} created via bulk upload by ${req.user.firstName} ${req.user.lastName}`,
      });
      await newItem.save();
    }

    res.status(201).json({ message: 'Bulk upload completed successfully' });
  } catch (err) {
    console.error('Error during bulk upload:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;