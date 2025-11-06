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

// Indexes for efficient queries
TicketSchema.index({ event: 1, type: 1 }, { unique: true });
TicketSchema.index({ salesEnd: 1, isActive: 1 });

// Virtual for checking if ticket is currently available
TicketSchema.virtual('isAvailable').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.available > 0 &&
    now >= this.salesStart &&
    now <= this.salesEnd
  );
});

// Method to check if a quantity can be purchased with detailed errors
TicketSchema.methods.canPurchase = function (quantity) {
  const now = new Date();

  if (!this.isActive) {
    throw new Error("Ticket sales are closed.");
  }
  if (now < this.salesStart) {
    throw new Error("Ticket sales have not started yet.");
  }
  if (now > this.salesEnd) {
    throw new Error("Ticket sales period has ended.");
  }
  if (this.available <= 0) {
    throw new Error("Tickets are sold out.");
  }
  if (quantity < this.minOrder) {
    throw new Error(`Minimum order is ${this.minOrder} tickets.`);
  }
  if (quantity > this.maxOrder) {
    throw new Error(`Maximum order is ${this.maxOrder} tickets.`);
  }
  if (quantity > this.available) {
    throw new Error(`Only ${this.available} tickets are available.`);
  }

  return true;
};

// FIXED: Method to reserve tickets (VALIDATION ONLY - NO DEDUCTION)
TicketSchema.methods.reserveTickets = async function (quantity) {
  this.canPurchase(quantity); // Validate but DON'T deduct
  return this; // No changes to available count
};

// FIXED: Method to release reserved tickets (NO ACTION NEEDED)
TicketSchema.methods.releaseTickets = async function (quantity) {
  // Since reserveTickets doesn't deduct, no need to add back
  return this;
};

// FIXED: Method to confirm ticket purchase (ONLY PLACE DEDUCTION HAPPENS)
TicketSchema.methods.confirmPurchase = async function (quantity) {
  this.canPurchase(quantity); // Validate first
  this.available -= quantity; // This is the ONLY place we deduct tickets
  await this.save();
  return this;
};

// Static method to get available tickets for an event
TicketSchema.statics.getAvailableTickets = function (eventId) {
  return this.find({
    event: eventId,
    isActive: true,
    available: { $gt: 0 },
    salesStart: { $lte: new Date() },
    salesEnd: { $gte: new Date() }
  }).sort({ price: 1 });
};

// Pre-save middleware to ensure available never exceeds quantity
TicketSchema.pre('save', function (next) {
  if (this.available > this.quantity) {
    this.available = this.quantity;
  }
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);