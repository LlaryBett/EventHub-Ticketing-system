// C:\Users\Admin\E-Ticket Application\backend\src\controllers\userController.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
// In userController.js
const IssuedTicket = require('../models/IssuedTicket'); // make sure this path is correct
const Order = require('../models/Order');
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

    // Count user's past and upcoming events
    const now = new Date();

    // Fetch orders and populate the event reference inside items
    const userOrders = await Order.find({ userId: req.user.id })
      .populate('items.eventId'); // make sure items.eventId ref: 'Event'

    // Past events
    const pastEventsCount = userOrders.filter(order => {
      return order.items.some(item => {
        if (item.eventId && item.eventId.date) {
          return new Date(item.eventId.date) < now;
        }
        return false;
      });
    }).length;

    // Upcoming events
    const upcomingEventsCount = userOrders.filter(order => {
      return order.items.some(item => {
        if (item.eventId && item.eventId.date) {
          return new Date(item.eventId.date) >= now;
        }
        return false;
      });
    }).length;

    // If user is organizer, include organizer profile
    if (req.user.userType === 'organizer') {
      const organizerProfile = await Organizer.findOne({ userId: req.user.id });
      userData = userData.toObject();
      userData.organizerProfile = organizerProfile;
    } else {
      userData = userData.toObject();
    }

    // Add overview stats
    userData.eventsAttended = pastEventsCount;
    userData.upcomingEvents = upcomingEventsCount;
    userData.joinedDate = userData.createdAt;

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




// 

exports.getUserEvents = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log('➡️ Incoming userId param:', userId);

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('⚠️ Invalid userId:', userId);
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    console.log('✅ Valid MongoDB ObjectId string');

    // Authorization
    console.log('🔑 Logged-in user ID:', req.user.id, 'Type:', req.user.userType);
    if (req.user.id !== userId && req.user.userType !== 'admin') {
      console.warn('❌ Not authorized');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    console.log('✅ User authorized');

    // Fetch all issued tickets for this user
    const tickets = await IssuedTicket.find({ userId })
      .populate('eventId', 'title venue date time image') // populate event details
      .lean();

    console.log('📌 Issued tickets found:', tickets.length);

    // Extract unique event IDs
    const eventIds = [...new Set(tickets.map(t => t.eventId?._id).filter(Boolean))];

    // Fetch events the user is attending
    const events = await Event.find({ _id: { $in: eventIds } }).lean();

    console.log('✅ Events fetched. Count:', events.length);
    if (events.length > 0) console.log('📌 Sample event:', events[0]);

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('🔥 Get user events error caught:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};






// @desc    Get order history for a user
// @route   GET /api/users/:id/orders
// @access  Private (user can only see their own orders)
exports.getUserOrderHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Ensure only the logged-in user or admin can view this
    if (req.user.id.toString() !== userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order history'
      });
    }

    // Fetch orders and populate related events
    const orders = await Order.find({ userId })
      .populate({
        path: 'items.eventId',
        select: 'title date time venue image' // only return useful fields
      })
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get user order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all issued tickets for a user
// @route   GET /api/users/:id/tickets
// @access  Private (user can only see their own tickets)
exports.getUserTickets = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (req.user.id.toString() !== userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tickets'
      });
    }

    // Fetch issued tickets directly
    const issuedTickets = await IssuedTicket.find({ userId })
      .populate('eventId', 'title venue date time image')
      .lean();

    console.log('🔹 Issued tickets fetched:', issuedTickets); // <---- LOG HERE

    res.status(200).json({
      success: true,
      count: issuedTickets.length,
      data: issuedTickets
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

