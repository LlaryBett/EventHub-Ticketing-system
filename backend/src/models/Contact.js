const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Contact Form Submission Data
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
    match: [/^[+]?[\d\s\-\(\)]{8,}$/, 'Please provide a valid phone number']
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
    default: null
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
  },

  // === EMBEDDED CONFIGURATION DATA ===
  // This replaces hardcoded frontend values and allows backend management
  
  // Contact Information Configuration (replaces hardcoded contact info)
  contactConfig: {
    email: {
      type: String,
      default: 'hello@eventhub.com'
    },
    phone: {
      type: String,
      default: '+1 (555) 123-4567'
    },
    address: {
      type: String,
      default: '123 Event Street, San Francisco, CA 94102'
    },
    businessHours: {
      type: String,
      default: 'Monday - Friday, 9 AM - 6 PM EST'
    },
    socialMedia: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    },
    liveChat: {
      enabled: { type: Boolean, default: true },
      availability: { type: String, default: 'Available 24/7' }
    }
  },

  // Page Content Configuration (replaces hardcoded text)
  pageContent: {
    heroTitle: {
      type: String,
      default: 'Get in Touch'
    },
    heroDescription: {
      type: String,
      default: 'Have questions, feedback, or need help? We\'re here for you. Reach out and we\'ll respond as quickly as possible.'
    },
    formTitle: {
      type: String,
      default: 'Send us a Message'
    },
    sidebarTitle: {
      type: String,
      default: 'Other Ways to Reach Us'
    },
    faqTitle: {
      type: String,
      default: 'Frequently Asked Questions'
    },
    mapTitle: {
      type: String,
      default: 'Visit Our Office'
    },
    mapDescription: {
      type: String,
      default: 'We\'re located in the heart of San Francisco. Drop by for a coffee and chat!'
    }
  },

  // Form Configuration (replaces hardcoded form structure)
  formConfig: {
    successMessage: {
      type: String,
      default: 'Message sent successfully! We\'ll get back to you within 24 hours.'
    },
    errorMessage: {
      type: String,
      default: 'Failed to send message. Please try again.'
    },
    categories: [{
      value: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      description: String,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    fieldSettings: {
      name: { required: { type: Boolean, default: true } },
      email: { required: { type: Boolean, default: true } },
      phone: { required: { type: Boolean, default: false } },
      subject: { required: { type: Boolean, default: true } },
      message: { required: { type: Boolean, default: true } },
      category: { required: { type: Boolean, default: true } }
    }
  },

  // FAQ Configuration (replaces hardcoded FAQs)
  faqConfig: {
    faqs: [{
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      category: {
        type: String,
        default: 'general'
      },
      order: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },

  // Business Rules Configuration
  businessRules: {
    autoResponder: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: "We've received your message" }
    },
    notification: {
      adminEmail: { type: String, default: 'admin@eventhub.com' },
      enabled: { type: Boolean, default: true }
    },
    responseTime: {
      type: String,
      default: '24 hours'
    },
    workingHours: {
      type: String,
      default: '9 AM - 6 PM EST'
    }
  },

  // System Configuration
  systemConfig: {
    isActive: {
      type: Boolean,
      default: true
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
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
contactSchema.index({ 'contactConfig.email': 1 });
contactSchema.index({ 'systemConfig.isActive': 1 });

// Virtual for response time
contactSchema.virtual('responseTime').get(function() {
  if (this.responseDate && this.submittedAt) {
    return Math.ceil((this.responseDate - this.submittedAt) / (1000 * 60 * 60));
  }
  return null;
});

// Virtual to get active categories
contactSchema.virtual('activeCategories').get(function() {
  return this.formConfig.categories.filter(cat => cat.isActive);
});

// Virtual to get active FAQs
contactSchema.virtual('activeFaqs').get(function() {
  return this.faqConfig.faqs.filter(faq => faq.isActive);
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  if (this.isModified('adminResponse') && this.adminResponse && !this.responseDate) {
    this.responseDate = new Date();
  }
  
  // Update system config timestamp when configuration changes
  const configPaths = ['contactConfig', 'pageContent', 'formConfig', 'faqConfig', 'businessRules'];
  const isConfigModified = configPaths.some(path => this.isModified(path));
  
  if (isConfigModified) {
    this.systemConfig.lastUpdated = new Date();
  }
  
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Static method to get contact configuration
contactSchema.statics.getConfiguration = function() {
  return this.findOne({ 'systemConfig.isActive': true })
    .select('contactConfig pageContent formConfig faqConfig businessRules systemConfig')
    .sort({ 'systemConfig.lastUpdated': -1 });
};

// Static method to update configuration
contactSchema.statics.updateConfiguration = function(configData, userId) {
  return this.findOneAndUpdate(
    { 'systemConfig.isActive': true },
    {
      ...configData,
      'systemConfig.lastUpdated': new Date(),
      'systemConfig.updatedBy': userId
    },
    { 
      new: true,
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true
    }
  ).select('contactConfig pageContent formConfig faqConfig businessRules systemConfig');
};

// Static method to initialize default configuration
contactSchema.statics.initializeDefaults = function(userId) {
  return this.updateConfiguration({}, userId);
};

// Static methods for analytics
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