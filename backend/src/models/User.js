const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    match: [/^(\+\d{1,3}[- ]?)?\d{10}$/, 'Please add a valid phone number']
  },
  userType: {
    type: String,
    enum: ['attendee', 'organizer', 'admin'],
    default: 'attendee'
  },
  status: {
    type: String,
    enum: ['active', 'pending_verification', 'suspended', 'inactive'],
    default: 'active'
  },
  profileImage: {
    type: String,
    default: 'default-user.jpg'
  },
  acceptTerms: {
    type: Boolean,
    default: false
  },
  marketingConsent: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  // New field to track if user was created through checkout
  createdThroughCheckout: {
    type: Boolean,
    default: false
  },
  // Add these two fields for event tracking
  eventsAttended: {
    type: Number,
    default: 0
  },
  upcomingEvents: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ... rest of the schema remains exactly the same ...
// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ status: 1 });

// Virtual for organizer profile
UserSchema.virtual('organizerProfile', {
  ref: 'Organizer',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual for events (if user is organizer)
UserSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'organizerId'
});

// Virtual for orders (if user is attendee)
UserSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'userId'
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update last login and increment login count
UserSchema.methods.updateLoginStats = function() {
  this.lastLogin = Date.now();
  this.loginCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);