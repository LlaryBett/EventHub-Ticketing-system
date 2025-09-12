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
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
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

const totalsSchema = new mongoose.Schema({
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  discountAmount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  tax: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
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
  totals: totalsSchema,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded', 'failed'],
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
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentGatewayResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ isGuestOrder: 1, status: 1 });
orderSchema.index({ claimToken: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'paymentDetails.phone': 1 }); // For M-Pesa lookups

// Virtual for formatted order total
orderSchema.virtual('formattedTotal').get(function() {
  return `KES ${this.totals.total.toLocaleString()}`;
});

// Virtual for order age
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

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
  
  // Update payment status based on order status
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.paymentStatus = 'completed';
    } else if (this.status === 'cancelled' || this.status === 'failed') {
      this.paymentStatus = 'failed';
    }
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

orderSchema.methods.updatePaymentStatus = function(status, gatewayResponse = {}) {
  this.paymentStatus = status;
  this.paymentGatewayResponse = gatewayResponse;
  
  if (status === 'completed') {
    this.status = 'completed';
  } else if (status === 'failed') {
    this.status = 'failed';
  }
  
  return this.save();
};

orderSchema.methods.getPaymentMethodDisplay = function() {
  const methodMap = {
    'mpesa': 'M-Pesa',
    'card': 'Credit/Debit Card',
    'paypal': 'PayPal'
  };
  return methodMap[this.paymentMethod] || this.paymentMethod;
};

// Static methods
orderSchema.statics.findGuestOrdersByEmail = function(email) {
  return this.find({ 
    customerEmail: email.toLowerCase(), 
    isGuestOrder: true,
    convertedToUser: false 
  }).sort({ createdAt: -1 });
};

orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findByPaymentTransactionId = function(transactionId) {
  return this.findOne({ 'paymentDetails.transactionId': transactionId });
};

// Query helpers
orderSchema.query.byStatus = function(status) {
  return this.where({ status });
};

orderSchema.query.byPaymentMethod = function(method) {
  return this.where({ paymentMethod: method });
};

orderSchema.query.byCustomerEmail = function(email) {
  return this.where({ customerEmail: email.toLowerCase() });
};

module.exports = mongoose.model('Order', orderSchema);