// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { validateNotificationPreferences } = require('../middleware/validation');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// =============================
// Notification Routes
// =============================

// Get all notifications for logged-in user
router.get(
  '/user/:userId',
  protect,
  notificationController.getUserNotifications
);

// Get single notification (must be owner or admin)
router.get(
  '/:id',
  protect,
  notificationController.getNotification
);

// Mark notification as read
router.patch(
  '/:id/read',
  protect,
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/user/:userId/read-all',
  protect,
  notificationController.markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  protect,
  notificationController.deleteNotification
);

// Clear all notifications
router.delete(
  '/user/:userId/clear-all',
  protect,
  notificationController.clearAllNotifications
);

// Get notification preferences
router.get(
  '/user/:userId/preferences',
  protect,
  notificationController.getNotificationPreferences
);

// Update notification preferences
router.put(
  '/user/:userId/preferences',
  protect,
  validateNotificationPreferences,
  notificationController.updateNotificationPreferences
);

// Create notification (system / admin only)
router.post(
  '/',
  protect,
  authorize('admin', 'organizer'), // restrict creation
  notificationController.createNotification
);

module.exports = router;
