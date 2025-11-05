const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize, requireApprovedOrganizer } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');
const { body } = require('express-validator');

// Story validation rules
const storyValidation = [
  body('eventId')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  body('slides')
    .isArray({ min: 1 })
    .withMessage('At least one slide is required'),
  body('slides.*.type')
    .isIn(['image', 'video'])
    .withMessage('Slide type must be image or video'),
  body('slides.*.media')
    .notEmpty()
    .withMessage('Slide media URL is required'),
  body('slides.*.title')
    .notEmpty()
    .withMessage('Slide title is required'),
  body('slides.*.duration')
    .optional()
    .isInt({ min: 1000, max: 30000 })
    .withMessage('Duration must be between 1 and 30 seconds'),
  body('slides.*.subtitle')
    .optional()
    .trim(),
  body('slides.*.description')
    .optional()
    .trim(),
  body('slides.*.cta')
    .optional()
    .trim(),
  body('slides.*.link')
    .optional()
    .isURL()
    .withMessage('CTA link must be a valid URL')
];

// ===== PUBLIC ROUTES =====

// Event routes
router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);

// Story public routes
router.get('/stories/discover', eventController.getDiscoverStories);
router.get('/stories/event/:eventId', eventController.getEventStories);

// ===== PROTECTED ROUTES (Any authenticated user) =====

router.use(protect);

// Event registration
router.post('/:id/register', eventController.registerForEvent);

// ===== ORGANIZER ROUTES (Require approved organizer status) =====

// Event CRUD operations
router.post(
  '/',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  validateEvent,
  eventController.createEvent
);

router.put(
  '/:id',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  validateEvent,
  eventController.updateEvent
);

router.delete(
  '/:id',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  eventController.deleteEvent
);

// Story CRUD operations
router.get(
  '/stories/organizer',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  eventController.getOrganizerStories
);

router.post(
  '/stories',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  storyValidation,
  eventController.createStory
);

router.put(
  '/stories/:id',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  storyValidation,
  eventController.updateStory
);

router.delete(
  '/stories/:id',
  authorize('admin', 'organizer'),
  requireApprovedOrganizer,
  eventController.deleteStory
);

// ===== ADMIN-ONLY ROUTES =====
// (Uncomment if needed - these were commented out in your original file)

// router.patch(
//   '/:id/approve',
//   protect,
//   authorize('admin'),
//   eventController.approveEvent
// );

// router.patch(
//   '/:id/status',
//   protect,
//   authorize('admin'),
//   eventController.updateEventStatus
// );

module.exports = router;