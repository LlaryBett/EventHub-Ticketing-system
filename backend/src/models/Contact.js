const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters'],
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['general', 'support', 'billing', 'partnership', 'feedback'],
      message: 'Category must be one of: general, support, billing, partnership, feedback'
    },
    default: 'general'
  },
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'resolved', 'closed'],
      message: 'Status must be one of: pending, in-progress, resolved, closed'
    },
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // Can be null for guest submissions
  },
  
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [2000, 'Admin response cannot exceed 2000 characters']
  },
  
  responseDate: {
    type: Date
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  ipAddress: {
    type: String,
    trim: true
  },
  
  userAgent: {
    type: String,
    trim: true
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
contactSchema.index({ status: 1, category: 1 });
contactSchema.index({ user: 1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ email: 1 });

// Virtual for response time
contactSchema.virtual('responseTime').get(function() {
  if (this.responseDate && this.submittedAt) {
    return Math.ceil((this.responseDate - this.submittedAt) / (1000 * 60 * 60)); // in hours
  }
  return null;
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  if (this.isModified('adminResponse') && this.adminResponse && !this.responseDate) {
    this.responseDate = new Date();
  }
  
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Static methods
contactSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $and: ['$responseDate', '$submittedAt'] },
              { $divide: [{ $subtract: ['$responseDate', '$submittedAt'] }, 1000 * 60 * 60] },
              null
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Contact', contactSchema);