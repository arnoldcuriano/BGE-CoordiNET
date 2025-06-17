const mongoose = require('mongoose');

const InventoryAssignmentSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem', // Reference to the InventoryItem model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  returnedAt: {
    type: Date,
  },
  acknowledgmentDocument: {
    type: String, // URL or path to the uploaded document
  },
});

module.exports = mongoose.model('InventoryAssignment', InventoryAssignmentSchema);