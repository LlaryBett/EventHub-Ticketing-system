const express = require('express');
const { body } = require('express-validator');
const {
  registerAttendee,
  registerOrganizerStep1,
  registerOrganizerStep2,
  login,
  logout,
  forgotPassword,
  resetPassword,
  registerAtCheckout,
  loginAtCheckout,
  claimAccount,
  sendClaimEmail,
  validateClaimToken
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const attendeeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('phone')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Please provide a valid phone number'),
  body('acceptTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions')
];

const checkoutRegisterValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const checkoutLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const claimAccountValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
];

const sendClaimEmailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
];

const organizerStep1Validation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('phone')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Please provide a valid phone number')
];

const organizerStep2Validation = [
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
    .withMessage('Please provide a valid website URL'),
  body('acceptTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Public routes
router.post('/register/attendee', attendeeValidation, registerAttendee);
router.post('/register/organizer/step1', organizerStep1Validation, registerOrganizerStep1);
router.post('/register/organizer/step2', organizerStep2Validation, registerOrganizerStep2);
router.post('/login', loginValidation, login);

// New checkout authentication routes
router.post('/register/checkout', checkoutRegisterValidation, registerAtCheckout);
router.post('/login/checkout', checkoutLoginValidation, loginAtCheckout);
router.post('/claim-account', claimAccountValidation, claimAccount);
router.post('/send-claim-email', sendClaimEmailValidation, sendClaimEmail);
router.get('/validate-claim-token', validateClaimToken);

router.post('/forgotpassword', forgotPasswordValidation, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, resetPassword);

// Protected routes
router.get('/logout', protect, logout);

module.exports = router;