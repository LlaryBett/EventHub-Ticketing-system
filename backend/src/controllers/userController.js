// C:\Users\Admin\E-Ticket Application\backend\src\controllers\userController.js
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Generate JWT Token (needed for updatePassword)
const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Send response with token (needed for updatePassword)
const sendTokenResponse = (user, statusCode, res, userType) => {
  const token = generateToken(user._id, userType);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: user,
    userType
  });
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let userData = await User.findById(req.user.id);

    // If user is organizer, include organizer profile
    if (req.user.userType === 'organizer') {
      const organizerProfile = await Organizer.findOne({ userId: req.user.id });
      userData = userData.toObject();
      userData.organizerProfile = organizerProfile;
    }

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, user.userType);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update organizer profile
// @route   PUT /api/users/organizer/profile
// @access  Private (organizer only)
exports.updateOrganizerProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user is an organizer
    if (req.user.userType !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Organizer account required.'
      });
    }

    const {
      organizationName,
      businessType,
      businessAddress,
      city,
      state,
      zipCode,
      taxId,
      website
    } = req.body;

    const organizer = await Organizer.findOneAndUpdate(
      { userId: req.user.id },
      {
        organizationName,
        businessType,
        businessAddress,
        city,
        state,
        zipCode,
        taxId: taxId || null,
        website: website || null
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: organizer
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/delete
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is organizer, delete organizer profile first
    if (req.user.userType === 'organizer') {
      await Organizer.findOneAndDelete({ userId: req.user.id });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Your account has been successfully deleted'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get events for a user by ID
// @route   GET /api/v1/user/:id/events
// @access  Private
exports.getUserEvents = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const Event = require('../models/Event');
    // Find events where user is registered or is the organizer
    const events = await Event.find({
      $or: [
        { registeredUsers: userId }, // if you have a registeredUsers array
        { organizer: userId }        // if user is the organizer
      ]
    });
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};