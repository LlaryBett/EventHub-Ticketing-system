// ContactInfo.js - Contact information model
const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
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
  
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Zip code cannot exceed 10 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    },
    full: {
      type: String,
      trim: true,
      maxlength: [200, 'Full address cannot exceed 200 characters']
    }
  },
  
  businessHours: {
    monday: { type: String, trim: true },
    tuesday: { type: String, trim: true },
    wednesday: { type: String, trim: true },
    thursday: { type: String, trim: true },
    Friday: { type: String, trim: true },
    saturday: { type: String, trim: true },
    sunday: { type: String, trim: true },
    general: { type: String, trim: true }
  },
  
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.*$/, 'Invalid Facebook URL']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.*$/, 'Invalid Twitter URL']
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?instagram\.com\/.*$/, 'Invalid Instagram URL']
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Invalid LinkedIn URL']
    }
  },
  
  supportChannels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  emergencyContact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Only one active contact info at a time
contactInfoSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Fix: Only export the ContactInfo model
module.exports = mongoose.model('ContactInfo', contactInfoSchema);