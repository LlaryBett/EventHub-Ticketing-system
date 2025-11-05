// models/Story.js
const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  media: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 5000
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  cta: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  }
});

const storySchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  slides: [slideSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
storySchema.index({ organizerId: 1, createdAt: -1 });
storySchema.index({ eventId: 1, isActive: 1 });
storySchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Story', storySchema);