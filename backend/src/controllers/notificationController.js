const Notification = require('../models/Notification');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all notifications for a user
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is authorized to view these notifications
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these notifications'
      });
    }
    
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('relatedEvent', 'title dates venue')
      .populate('relatedTicket', 'ticketType price');
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Get single notification
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('user', 'name email')
      .populate('relatedEvent', 'title dates venue')
      .populate('relatedTicket', 'ticketType price');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is authorized to view this notification
    if (notification.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notification'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is authorized to update this notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user is authorized
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update these notifications'
      });
    }
    
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is authorized to delete this notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Clear all notifications for a user
exports.clearAllNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user is authorized
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to clear these notifications'
      });
    }
    
    const result = await Notification.deleteMany({ user: userId });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences for a user
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user is authorized
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these preferences'
      });
    }
    
    const user = await User.findById(userId).select('notificationPreferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.notificationPreferences || {}
    });
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { userId } = req.params;
    
    // Check if user is authorized
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update these preferences'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

// Create a new notification (typically used by other services)
exports.createNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { userId, type, title, message, relatedEvent, relatedTicket } = req.body;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const notificationData = {
      user: userId,
      type,
      title,
      message,
      relatedEvent,
      relatedTicket
    };
    
    const notification = await Notification.create(notificationData);
    
    // Populate the created notification for response
    await notification.populate('relatedEvent', 'title dates venue');
    await notification.populate('relatedTicket', 'ticketType price');
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};