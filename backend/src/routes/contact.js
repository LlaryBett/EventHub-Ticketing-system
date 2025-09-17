const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  submitContactForm,
  getAllContactSubmissions,
  getContactSubmission,
  updateContactStatus,
  deleteContactSubmission,
  getUserContactSubmissions,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getContactInfo,
  updateContactInfo
} = require('../controllers/contactController');

const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const contactFormValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['general', 'support', 'billing', 'partnership', 'feedback'])
    .withMessage('Invalid category selected')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  
  body('response')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Response must be between 10 and 2000 characters'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID')
];

const faqValidation = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Question must be between 10 and 200 characters'),
  
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Answer must be between 10 and 1000 characters'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

const contactInfoValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('businessHours')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Business hours must not exceed 100 characters'),
  
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  
  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  
  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid')
];

// Public routes
// Submit contact form (can be accessed by guests or logged-in users)
router.post('/submit', contactFormValidation, submitContactForm);

// Get all FAQs (public)
router.get('/faqs', getAllFAQs);

// Get contact information (public)
router.get('/info', getContactInfo);

// Protected routes (require authentication)
// Get user's own contact submissions
router.get('/user/:userId', protect, getUserContactSubmissions);

// Get single contact submission (user can view their own, admin can view all)
router.get('/:id', protect, getContactSubmission);

// Admin only routes
// Get all contact submissions with filtering and pagination
router.get('/', protect, authorize('admin'), getAllContactSubmissions);

// Update contact submission status
router.put('/:id/status', protect, authorize('admin'), statusUpdateValidation, updateContactStatus);

// Delete contact submission
router.delete('/:id', protect, authorize('admin'), deleteContactSubmission);

// FAQ management routes (Admin only)
// Create FAQ
router.post('/faqs', protect, authorize('admin'), faqValidation, createFAQ);

// Update FAQ
router.put('/faqs/:id', protect, authorize('admin'), faqValidation, updateFAQ);

// Delete FAQ
router.delete('/faqs/:id', protect, authorize('admin'), deleteFAQ);

// Contact information management (Admin only)
// Update contact information
router.put('/info', protect, authorize('admin'), contactInfoValidation, updateContactInfo);

module.exports = router;