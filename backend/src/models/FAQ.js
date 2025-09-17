const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    minlength: [10, 'Question must be at least 10 characters'],
    maxlength: [200, 'Question cannot exceed 200 characters']
  },
  
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    minlength: [10, 'Answer must be at least 10 characters'],
    maxlength: [1000, 'Answer cannot exceed 1000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    minlength: [2, 'Category must be at least 2 characters'],
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order must be a non-negative number']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  helpful: {
    type: Number,
    default: 0
  },
  
  notHelpful: {
    type: Number,
    default: 0
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ createdAt: -1 });

// Virtual for helpfulness score
faqSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpful + this.notHelpful;
  return total > 0 ? (this.helpful / total) * 100 : 0;
});

// Pre-save middleware
faqSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Instance methods
faqSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

faqSchema.methods.markHelpful = function(isHelpful) {
  if (isHelpful) {
    this.helpful += 1;
  } else {
    this.notHelpful += 1;
  }
  return this.save();
};

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;   // ✅ export the model
