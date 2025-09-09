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
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  price: {
    type: Number,
    required: [true, 'Event price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
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
  }]
}, {
  timestamps: true
});

// Compound index for frequent queries (filtering by category, featured, and sorting by date)
eventSchema.index({ category: 1, featured: 1, date: 1 });

// Ensure registered never exceeds capacity
eventSchema.pre('save', function (next) {
  if (this.registered > this.capacity) {
    return next(new Error('Registered count cannot exceed event capacity'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
