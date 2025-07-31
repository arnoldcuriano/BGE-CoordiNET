const mongoose = require("mongoose");

const PartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  projectName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Hot", "Warm", "Cold"],
    default: "Cold",
  },
  manualStatus: {
    type: Boolean,
    default: false, // Tracks if status was set manually
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  durationStatus: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Custom"],
    default: "Upcoming",
  },
  durationStatusCustom: {
    type: String,
    default: "",
  },
  category: {
    type: String,
  },
  contact: {
    type: {
      email: String,
      phone: String,
      person: String,
      role: String,
    },
  },
  services: [
    {
      name: {
        type: String,
        required: true,
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      termSheets: [String],
      cost: Number,
      status: String,
    },
  ],
  milestones: [
    {
      title: {
        type: String,
        required: true,
      },
      description: String,
      date: {
        type: Date,
        required: true,
      },
    },
  ],
  activityLog: [
    {
      action: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: String,
      details: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  comments: [
    {
      comment: {
        type: String,
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Partner", PartnerSchema);
