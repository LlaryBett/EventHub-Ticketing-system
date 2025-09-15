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
  getUserOrderHistory, // ⬅️ import new controller
   getUserTickets // ⬅️ import new controller
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

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
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Please provide a valid phone number')
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
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Tax ID cannot be more than 20 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

// Protected routes
router.get('/me', protect, getMe);
router.get('/:id', getUserProfile);
router.get('/:id/events', protect, getUserEvents);
router.get('/:id/orders', protect, getUserOrderHistory);  // ⬅️ NEW route
router.get('/:id/tickets', protect, getUserTickets); // ⬅️ NEW route
router.put('/updatedetails', protect, updateDetailsValidation, updateDetails);
router.put('/updatepassword', protect, updatePasswordValidation, updatePassword);
router.put('/organizer/profile', protect, organizerProfileValidation, updateOrganizerProfile);
router.delete('/delete', protect, deleteAccount);

module.exports = router;
