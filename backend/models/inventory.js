const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  brand: { type: String, required: true },
  serialNumber: { type: String, required: true },
  assignedUser: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Inventory', inventorySchema);