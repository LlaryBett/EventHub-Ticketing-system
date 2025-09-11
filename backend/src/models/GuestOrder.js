const mongoose = require('mongoose');

const guestOrderSchema = new mongoose.Schema({
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    title: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'converted'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  sessionData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for automatic cleanup
guestOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if order is expired
guestOrderSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('GuestOrder', guestOrderSchema);