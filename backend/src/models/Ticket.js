const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  benefits: [{
    type: String,
    trim: true
  }],
  salesStart: {
    type: Date,
    default: Date.now
  },
  salesEnd: {
    type: Date,
    required: true
  },
  minOrder: {
    type: Number,
    default: 1,
    min: 1
  },
  maxOrder: {
    type: Number,
    default: 10,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
TicketSchema.index({ event: 1, type: 1 }, { unique: true });
TicketSchema.index({ salesEnd: 1, isActive: 1 });

// Virtual for checking if ticket is available for sale
TicketSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return this.isActive && 
         this.available > 0 && 
         now >= this.salesStart && 
         now <= this.salesEnd;
});

// Method to check if a quantity can be purchased
TicketSchema.methods.canPurchase = function(quantity) {
  if (!this.isAvailable) return false;
  if (quantity < this.minOrder || quantity > this.maxOrder) return false;
  return quantity <= this.available;
};

// Method to reserve tickets
TicketSchema.methods.reserveTickets = function(quantity) {
  if (!this.canPurchase(quantity)) {
    throw new Error(`Cannot reserve ${quantity} tickets`);
  }
  this.available -= quantity;
  return this.save();
};

// Method to release reserved tickets
TicketSchema.methods.releaseTickets = function(quantity) {
  this.available += quantity;
  // Ensure available doesn't exceed total quantity
  this.available = Math.min(this.available, this.quantity);
  return this.save();
};

// Static method to get available tickets for an event
TicketSchema.statics.getAvailableTickets = function(eventId) {
  return this.find({
    event: eventId,
    isActive: true,
    available: { $gt: 0 },
    salesStart: { $lte: new Date() },
    salesEnd: { $gte: new Date() }
  }).sort({ price: 1 });
};

// Pre-save middleware to ensure available doesn't exceed quantity
TicketSchema.pre('save', function(next) {
  if (this.available > this.quantity) {
    this.available = this.quantity;
  }
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);