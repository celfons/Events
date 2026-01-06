const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  description: {
    type: String,
    default: ''
  },
  permissions: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
groupSchema.index({ name: 1 });

const GroupModel = mongoose.model('Group', groupSchema);

module.exports = GroupModel;
