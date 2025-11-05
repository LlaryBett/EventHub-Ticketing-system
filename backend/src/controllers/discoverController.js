// controllers/discoverController.js
const Discover = require('../models/Discover');

// Get complete discover page data (PUBLIC - only active items)
exports.getDiscoverData = async (req, res, next) => {
  try {
    const discoverData = await Discover.findOne({ isActive: true })
      .select('heroSlides categories collections quickFilters version')
      .lean();

    if (!discoverData) {
      return res.status(404).json({
        success: false,
        message: 'Discover page configuration not found. Please contact administrator.'
      });
    }

    // Filter and sort active items (for public consumption)
    const responseData = {
      heroSlides: discoverData.heroSlides
        .filter(slide => slide.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      
      categories: discoverData.categories
        .filter(cat => cat.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      
      collections: discoverData.collections
        .filter(col => col.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      
      quickFilters: discoverData.quickFilters
        .filter(filter => filter.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      
      version: discoverData.version
    };

    res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Get complete discover page data for ADMIN (includes inactive items)
exports.getDiscoverDataForAdmin = async (req, res, next) => {
  try {
    const discoverData = await Discover.findOne({ isActive: true })
      .select('heroSlides categories collections quickFilters version')
      .lean();

    if (!discoverData) {
      return res.status(404).json({
        success: false,
        message: 'Discover page configuration not found. Please contact administrator.'
      });
    }

    // Return ALL data without filtering for admin (include inactive items)
    const responseData = {
      heroSlides: discoverData.heroSlides.sort((a, b) => a.displayOrder - b.displayOrder),
      categories: discoverData.categories.sort((a, b) => a.displayOrder - b.displayOrder),
      collections: discoverData.collections.sort((a, b) => a.displayOrder - b.displayOrder),
      quickFilters: discoverData.quickFilters.sort((a, b) => a.displayOrder - b.displayOrder),
      version: discoverData.version
    };

    res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Create initial discover configuration (Admin only)
exports.createDiscoverConfig = async (req, res, next) => {
  try {
    const { heroSlides, categories, collections, quickFilters, version } = req.body;

    // Check if active config already exists
    const existingConfig = await Discover.findOne({ isActive: true });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: 'Active discover configuration already exists. Use update instead.'
      });
    }

    const discoverData = await Discover.create({
      heroSlides,
      categories,
      collections,
      quickFilters,
      version: version || '1.0.0',
      lastUpdatedBy: req.user.id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: discoverData,
      message: 'Discover configuration created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update discover configuration (Admin only)
exports.updateDiscoverData = async (req, res, next) => {
  try {
    const { heroSlides, categories, collections, quickFilters, version } = req.body;

    const discoverData = await Discover.findOneAndUpdate(
      { isActive: true },
      {
        heroSlides,
        categories,
        collections,
        quickFilters,
        version: version || '1.0.0',
        lastUpdatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!discoverData) {
      return res.status(404).json({
        success: false,
        message: 'No active discover configuration found to update'
      });
    }

    res.status(200).json({
      success: true,
      data: discoverData,
      message: 'Discover page updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update specific section (Admin only)
exports.updateDiscoverSection = async (req, res, next) => {
  try {
    const { section } = req.params; // 'heroSlides', 'categories', 'collections', 'quickFilters'
    const sectionData = req.body[section];

    if (!sectionData) {
      return res.status(400).json({
        success: false,
        message: `Section data for ${section} is required`
      });
    }

    const updateFields = {
      [section]: sectionData,
      lastUpdatedBy: req.user.id,
      updatedAt: new Date()
    };

    const discoverData = await Discover.findOneAndUpdate(
      { isActive: true },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!discoverData) {
      return res.status(404).json({
        success: false,
        message: 'No active discover configuration found'
      });
    }

    res.status(200).json({
      success: true,
      data: sectionData,  // ← FIX: Return the data that was saved, not the document field
      message: `${section} updated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate current discover configuration (Admin only)
exports.deactivateDiscoverConfig = async (req, res, next) => {
  try {
    const discoverData = await Discover.findOneAndUpdate(
      { isActive: true },
      { 
        isActive: false,
        lastUpdatedBy: req.user.id
      },
      { new: true }
    );

    if (!discoverData) {
      return res.status(404).json({
        success: false,
        message: 'No active discover configuration found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Discover configuration deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get discover configuration history (Admin only)
exports.getDiscoverHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const discoverConfigs = await Discover.find()
      .populate('lastUpdatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('version isActive lastUpdatedBy updatedAt createdAt');

    const total = await Discover.countDocuments();

    res.status(200).json({
      success: true,
      data: discoverConfigs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};