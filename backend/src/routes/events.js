const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/:id/register', protect, eventController.registerForEvent);

// Admin/Organizer routes
router.post(
  '/',
  protect,
  authorize('admin', 'organizer'),
  validateEvent,
  eventController.createEvent
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'organizer'),
  validateEvent,
  eventController.updateEvent
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'organizer'),
  eventController.deleteEvent
);

module.exports = router;
