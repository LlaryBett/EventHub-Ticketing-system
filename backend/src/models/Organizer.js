// backend/src/models/Organizer.js
const mongoose = require('mongoose');

const OrganizerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  organizationName: {
    type: String,
    required: [true, 'Please add an organization name'],
    trim: true,
    maxlength: [100, 'Organization name cannot be more than 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Please select a business type'],
    enum: ['individual', 'company', 'nonprofit', 'other']
  },
  businessAddress: {
    type: String,
    required: [true, 'Please add a business address']
  },
  city: {
    type: String,
    required: [true, 'Please add a city']
  },
  state: {
    type: String,
    required: [true, 'Please add a state']
  },
  zipCode: {
    type: String,
    required: [true, 'Please add a ZIP code'],
    match: [/^\d{5}(-\d{4})?$/, 'Please add a valid ZIP code']
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: [20, 'Tax ID cannot be more than 20 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    default: 'default-organizer.jpg'
  },
  banner: {
    type: String
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified'],
    default: 'unverified'
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  bankAccount: {
    accountHolder: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    default: 'bank_transfer'
  },
  payoutEmail: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  commissionRate: {
    type: Number,
    default: 5, // 5% commission
    min: 0,
    max: 50
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
OrganizerSchema.index({ userId: 1 });
OrganizerSchema.index({ organizationName: 'text' });
OrganizerSchema.index({ approvalStatus: 1 });
OrganizerSchema.index({ city: 1, state: 1 });
OrganizerSchema.index({ isFeatured: 1 });

// Virtual for user details
OrganizerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for events
OrganizerSchema.virtual('events', {
  ref: 'Event',
  localField: 'userId',
  foreignField: 'organizerId'
});

// Virtual for reviews
OrganizerSchema.virtual('reviews', {
  ref: 'Review',
  localField: 'userId',
  foreignField: 'organizerId'
});

// Update rating average
OrganizerSchema.methods.updateRating = async function(newRating) {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ organizerId: this.userId });
  
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = total / reviews.length;
  this.rating.count = reviews.length;
  
  return this.save();
};

// Check if organizer is verified and approved
OrganizerSchema.virtual('isActive').get(function() {
  return this.approvalStatus === 'approved' && this.verificationStatus === 'verified';
});

// Update event count
OrganizerSchema.methods.incrementEventCount = function() {
  this.totalEvents += 1;
  return this.save();
};

// Update revenue
OrganizerSchema.methods.addRevenue = function(amount) {
  this.totalRevenue += amount;
  return this.save();
};

module.exports = mongoose.model('Organizer', OrganizerSchema);