// models/Discover.js
const mongoose = require('mongoose');

const discoverSchema = new mongoose.Schema({
  // Hero Section
  heroSlides: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    subtitle: {
      type: String,
      required: true,
      maxlength: 200
    },
    imageUrl: {
      type: String,
      required: true
    },
    ctaText: {
      type: String,
      default: 'Explore Now'
    },
    ctaLink: {
      type: String,
      default: '/events'
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    backgroundColor: {
      type: String,
      default: 'from-blue-600 via-purple-600 to-pink-500'
    }
  }],

  // Categories for 3D Carousel
  categories: [{
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    slug: {
      type: String,
      required: true,
      lowercase: true
    },
    icon: {
      type: String, // Lucide React icon name
      required: true
    },
    colorGradient: {
      type: String,
      required: true
    },
    image: {
      type: String, // URL
      required: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Curated Collections
  collections: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      lowercase: true
    },
    icon: {
      type: String, // Lucide React icon name
      required: true
    },
    color: {
      type: String, // Tailwind classes
      required: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    filterRules: {
      // For dynamic event filtering
      categories: [String],
      tags: [String],
      priceRange: {
        min: Number,
        max: Number
      },
      isFree: Boolean
    }
  }],

  // Quick Search Filters
  quickFilters: [{
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Only one active discover configuration
discoverSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('Discover', discoverSchema);