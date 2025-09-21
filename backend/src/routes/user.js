const express = require('express');
const { body } = require('express-validator');
const {
  getMe,
  getUserProfile,
  updateDetails,
  updatePassword,
  updateOrganizerProfile,
  deleteAccount,
  getUserEvents,
  getUserOrderHistory,
  getUserTickets,
  // Organizer-specific imports
  getOrganizerAttendees,
  getEventAttendees,
  exportEventAttendees,
  checkInAttendee,
  // Admin-specific imports
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  getUserStatistics,
  searchUsers,
  getOrganizers,
  getOrganizerById,
  verifyOrganizer,
  getAdminDashboardStats // Add this import
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateDetailsValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^(?:254|\+254|0)?(?:7|1[0-1])?[0-9]{8}$/)
    .withMessage('Please provide a valid Kenyan phone number (e.g., 0712345678, 254712345678, or 0110123456)')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const organizerProfileValidation = [
  body('organizationName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters'),
  body('businessType')
    .isIn(['individual', 'company', 'nonprofit', 'other'])
    .withMessage('Please select a valid business type'),
  body('businessAddress')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Please provide a valid business address'),
  body('city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Please provide a valid city'),
  body('state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Please provide a valid state'),
  body('zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  body('taxId')
    .optional({ nullable: true, checkFalsy: true }) // Makes field completely optional
    .trim()
    .isLength({ max: 20 })
    .withMessage('If provided, Tax ID cannot be more than 20 characters'),
  body('website')
    .optional({ nullable: true, checkFalsy: true }) // Makes field completely optional
    .isURL()
    .withMessage('If provided, website must be a valid URL')
];

// User profile routes (existing)
router.get('/me', protect, getMe);
router.get('/:id', getUserProfile);
router.get('/:id/events', protect, getUserEvents);
router.get('/:id/orders', protect, getUserOrderHistory);
router.get('/:id/tickets', protect, getUserTickets);

// User account management (existing)
router.put('/updatedetails', protect, updateDetailsValidation, updateDetails);
router.put('/updatepassword', protect, updatePasswordValidation, updatePassword);
router.put('/organizer/profile', protect, organizerProfileValidation, updateOrganizerProfile);
router.delete('/delete', protect, deleteAccount);

// Organizer attendee management routes (existing)
router.get('/organizer/attendees', protect, getOrganizerAttendees);
router.get('/organizer/events/:eventId/attendees', protect, getEventAttendees);
router.get('/organizer/events/:eventId/attendees/export', protect, exportEventAttendees);
router.post('/organizer/tickets/:ticketId/checkin', protect, checkInAttendee);

// ========== ADMIN ROUTES ==========
// Dashboard route (ADD THIS NEW ROUTE)
router.get('/admin/dashboard', protect, authorize('admin'), getAdminDashboardStats);

// User management
router.get('/admin/users', protect, authorize('admin'), getUsers);
router.get('/admin/users/:id', protect, authorize('admin'), getUserById);
router.put('/admin/users/:id', protect, authorize('admin'), updateUser);
router.patch('/admin/users/:id/status', protect, authorize('admin'), deactivateUser);
router.delete('/admin/users/:id', protect, authorize('admin'), deleteUser);
router.get('/admin/statistics/users', protect, authorize('admin'), getUserStatistics);
router.get('/admin/users/search/:query', protect, authorize('admin'), searchUsers);

// Organizer management
router.get('/admin/organizers', protect, authorize('admin'), getOrganizers);
router.get('/admin/organizers/:id', protect, authorize('admin'), getOrganizerById);
router.patch('/admin/organizers/:id/verification', protect, authorize('admin'), verifyOrganizer);

module.exports = router;