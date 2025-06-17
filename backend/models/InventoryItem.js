const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Laptop', 'Monitor', 'Peripheral', 'PC', 'Accessory', 'Other'],
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Assigned', 'Under Repair', 'Retired'],
    default: 'Available',
  },
  warrantyEndDate: {
    type: Date,
  },
  supportDetails: {
    type: String,
  },
  stockThreshold: {
    type: Number,
    default: 5, // Threshold for low stock alert
  },
  maxLoanPeriodDays: {
    type: Number,
    default: 30, // Max days before overdue alert
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  activityLog: [
    {
      action: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      details: { type: String },
    },
  ],
});

// Middleware to update the updatedAt field before saving
InventoryItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);