const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
  },
  image: {
    type: String
  }
});

const billingInfoSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  }
});

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['mpesa', 'card', 'paypal']
  },
  phone: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  }
});

const discountSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  percentage: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  }
});

const orderSchema = new mongoose.Schema({
  // User can be null for guest orders
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // Guest order identifier
  guestOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
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
  items: [orderItemSchema],
  billingAddress: billingInfoSchema,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mpesa', 'card', 'paypal']
  },
  paymentDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  discountCode: {
    type: String,
    trim: true
  },
  totals: {
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  claimToken: {
    type: String,
    index: true
  },
  claimTokenExpires: {
    type: Date
  },
  convertedToUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ isGuestOrder: 1, status: 1 });
orderSchema.index({ claimToken: 1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD-${timestamp.slice(-6)}${random}`;
  }
  
  // Generate guest order ID for guest orders
  if (this.isNew && this.isGuestOrder && !this.guestOrderId) {
    this.guestOrderId = `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  next();
});

// Instance methods
orderSchema.methods.canBeClaimed = function() {
  return this.isGuestOrder && !this.convertedToUser && 
         (!this.claimTokenExpires || this.claimTokenExpires > new Date());
};

orderSchema.methods.generateClaimToken = function() {
  const crypto = require('crypto');
  this.claimToken = crypto.randomBytes(32).toString('hex');
  this.claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.claimToken;
};

// Static methods
orderSchema.statics.findGuestOrdersByEmail = function(email) {
  return this.find({ 
    customerEmail: email.toLowerCase(), 
    isGuestOrder: true,
    convertedToUser: false 
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);