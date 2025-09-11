const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  ticketType: {
    type: String,
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
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total price virtual
CartSchema.virtual('total').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Add instance method to get total (more reliable than virtual field)
CartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Add instance method to find item by ID
CartSchema.methods.findItemById = function(itemId) {
  return this.items.id(itemId);
};

// Add instance method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Ensure virtual fields are serialized
CartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema);