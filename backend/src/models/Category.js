// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String, // Store Lucide React icon name: 'Music', 'Trophy', etc.
    required: [true, 'Icon name is required'],
    default: 'Folder'
  },
  colorGradient: {
    type: String, // 'from-purple-500 to-pink-500'
    required: [true, 'Color gradient is required'],
    default: 'from-gray-500 to-gray-700'
  },
  image: {
    type: String, // URL to category image
    required: [true, 'Category image is required']
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  eventCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);