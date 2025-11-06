// src/models/Event.js - INDUSTRY STANDARD VERSION
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  image: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required']
  },
  tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  // CHANGED: Now uses category slug from Discover schema instead of Category model
  category: {
    type: String, // This stores the category slug from Discover.categories
    required: [true, 'Event category is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: [true, 'Event organizer is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  // ADDED: Pricing type for free/paid events
  pricingType: {
    type: String,
    enum: ['paid', 'free'],
    default: 'paid'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ADDED: Status field for event lifecycle management
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  // ADDED: New event detail fields
  duration: {
    type: String, // e.g., "2-3 hours", "4 hours", "All day"
    default: '2-3 hours'
  },
  ageRestriction: {
    type: String, // e.g., "All ages welcome", "18+", "21+"
    default: 'All ages welcome'
  },
  ticketDelivery: {
    type: String, // e.g., "E-tickets provided", "Mobile tickets", "Print at home"
    default: 'E-tickets provided'
  },
  // Optional additional fields:
  venueAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  eventType: {
    type: String,
    enum: ['in_person', 'virtual', 'hybrid'],
    default: 'in_person'
  }
}, {
  timestamps: true
});

// Compound index for frequent queries
eventSchema.index({ category: 1, featured: 1, date: 1 });
eventSchema.index({ status: 1, date: 1 }); // Added for status-based queries
eventSchema.index({ pricingType: 1, date: 1 }); // Added for free/paid event queries

// Virtual for checking if event is sold out (now calculates from orders)
eventSchema.virtual('isSoldOut').get(function() {
  // This will be calculated in real-time from orders
  // The implementation will be in the controller
  return false; // Default, will be overridden by real calculation
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Virtual for free event display
eventSchema.virtual('displayPrice').get(function() {
  return this.pricingType === 'free' ? 'Free' : 'Paid';
});

// Virtual for action button text
eventSchema.virtual('actionButtonText').get(function() {
  return this.pricingType === 'free' ? 'Reserve Spot' : 'Buy Tickets';
});

// REMOVED: The pre-save hook for registered count validation
// since we're calculating from orders in real-time

module.exports = mongoose.model('Event', eventSchema);