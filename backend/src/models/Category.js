const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    default: '📁'
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    default: 'bg-gray-500'
  }
}, {
  timestamps: true
});

// Index for better performance
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);