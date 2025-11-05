// src/models/Event.js
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
  registered: {
    type: Number,
    default: 0,
    min: [0, 'Registered count cannot be negative']
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
  }
}, {
  timestamps: true
});

// Compound index for frequent queries
eventSchema.index({ category: 1, featured: 1, date: 1 });
eventSchema.index({ status: 1, date: 1 }); // Added for status-based queries

// Ensure registered never exceeds capacity
eventSchema.pre('save', function (next) {
  if (this.registered > this.capacity) {
    return next(new Error('Registered count cannot exceed event capacity'));
  }
  next();
});

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.registered >= this.capacity;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

module.exports = mongoose.model('Event', eventSchema);