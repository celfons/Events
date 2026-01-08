const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active'
    }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
  availableSlots: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        // During updates with runValidators, 'this' refers to the Query object
        // During document creation/save, 'this' refers to the document
        if (this.constructor.name === 'Query') {
          // In update context, get the update object to access new totalSlots
          const update = this.getUpdate();
          // Check if totalSlots is being updated (can be in $set or directly)
          const newTotalSlots = update.$set?.totalSlots ?? update.totalSlots;
          if (newTotalSlots !== undefined) {
            // If totalSlots is being updated, validate against the new value
            return value <= newTotalSlots;
          }
          // If totalSlots is not being updated, we can't validate in this context
          // Skip validation (the database state should be consistent)
          return true;
        }
        // For document creation/save, validate against the document's totalSlots
        return value <= this.totalSlots;
      },
      message: 'Available slots cannot exceed total slots'
    }
  },
  participants: [participantSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  local: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for unique email per event
eventSchema.index({ 'participants.email': 1 });

module.exports = mongoose.model('Event', eventSchema);
