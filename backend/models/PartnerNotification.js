const mongoose = require("mongoose");

const PartnerNotificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(
  "PartnerNotification",
  PartnerNotificationSchema
);
