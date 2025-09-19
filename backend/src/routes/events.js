const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize, requireApprovedOrganizer } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);

// Protected routes (any authenticated user)
router.post('/:id/register', protect, eventController.registerForEvent);

// Organizer routes (require approved organizer status)
router.post(
  '/',
  protect,
  authorize('admin', 'organizer'),
  requireApprovedOrganizer, // ← NEW: Requires approved organizer
  validateEvent,
  eventController.createEvent
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'organizer'),
  requireApprovedOrganizer, // ← NEW: Requires approved organizer
  validateEvent,
  eventController.updateEvent
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'organizer'),
  requireApprovedOrganizer, // ← NEW: Requires approved organizer
  eventController.deleteEvent
);

// // Admin-only routes (no organizer approval required for admins)
// router.patch(
//   '/:id/approve',
//   protect,
//   authorize('admin'), // Only admin, not organizer
//   eventController.approveEvent
// );

// router.patch(
//   '/:id/status',
//   protect,
//   authorize('admin'), // Only admin, not organizer
//   eventController.updateEventStatus
// );

module.exports = router;