const Category = require('../models/Category');
const Event = require('../models/Event');
const { validationResult } = require('express-validator');

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Get event counts for each category (no status filter)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Event.countDocuments({ category: category._id });
        return {
          id: category._id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          count
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    next(error);
  }
};


// Get single category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Count all events for this category (no status filter)
    const eventCount = await Event.countDocuments({ category: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        count: eventCount
      }
    });
  } catch (error) {
    next(error);
  }
};


// Create new category (Admin only)
exports.createCategory = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, description, icon, color } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const category = await Category.create({
      name,
      description,
      icon,
      color
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        count: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, description, icon, color } = req.body;
    
    // Check if category exists
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if another category already has the new name
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists'
        });
      }
    }
    
    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, color },
      { new: true, runValidators: true }
    );
    
    const eventCount = await Event.countDocuments({ 
      category: req.params.id, 
      status: 'published' 
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        count: eventCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has events
    const eventCount = await Event.countDocuments({ category: req.params.id });
    
    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated events'
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get category statistics (for dashboard)
exports.getCategoryStats = async (req, res, next) => {
  try {
    const categories = await Category.find();
    
    const stats = await Promise.all(
      categories.map(async (category) => {
        const eventCount = await Event.countDocuments({ 
          category: category._id, 
          status: 'published' 
        });
        
        return {
          id: category._id,
          name: category.name,
          eventCount: eventCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};