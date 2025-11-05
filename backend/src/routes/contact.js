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
  updateContactInfo,
  getContactPageContent,
  updateContactPageContent,
  getContactFormConfig,
  updateContactFormConfig,
  getBusinessRules,
  updateBusinessRules,
  getCompleteConfiguration,
  initializeConfiguration
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
    .optional()
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

const pageContentValidation = [
  body('heroTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Hero title must not exceed 100 characters'),
  
  body('heroDescription')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Hero description must not exceed 300 characters'),
  
  body('formTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Form title must not exceed 100 characters'),
  
  body('sidebarTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sidebar title must not exceed 100 characters'),
  
  body('faqTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('FAQ title must not exceed 100 characters'),
  
  body('mapTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Map title must not exceed 100 characters'),
  
  body('mapDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Map description must not exceed 200 characters')
];

const formConfigValidation = [
  body('successMessage')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Success message must not exceed 200 characters'),
  
  body('errorMessage')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Error message must not exceed 200 characters'),
  
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  
  body('categories.*.value')
    .trim()
    .notEmpty()
    .withMessage('Category value is required'),
  
  body('categories.*.label')
    .trim()
    .notEmpty()
    .withMessage('Category label is required'),
  
  body('fieldSettings.name.required')
    .optional()
    .isBoolean()
    .withMessage('Name required must be boolean'),
  
  body('fieldSettings.email.required')
    .optional()
    .isBoolean()
    .withMessage('Email required must be boolean'),
  
  body('fieldSettings.phone.required')
    .optional()
    .isBoolean()
    .withMessage('Phone required must be boolean'),
  
  body('fieldSettings.subject.required')
    .optional()
    .isBoolean()
    .withMessage('Subject required must be boolean'),
  
  body('fieldSettings.message.required')
    .optional()
    .isBoolean()
    .withMessage('Message required must be boolean'),
  
  body('fieldSettings.category.required')
    .optional()
    .isBoolean()
    .withMessage('Category required must be boolean')
];

const businessRulesValidation = [
  body('autoResponder.enabled')
    .optional()
    .isBoolean()
    .withMessage('Auto responder enabled must be boolean'),
  
  body('autoResponder.subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Auto responder subject must not exceed 100 characters'),
  
  body('notification.enabled')
    .optional()
    .isBoolean()
    .withMessage('Notification enabled must be boolean'),
  
  body('notification.adminEmail')
    .optional()
    .isEmail()
    .withMessage('Admin email must be valid'),
  
  body('responseTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Response time must not exceed 50 characters'),
  
  body('workingHours')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Working hours must not exceed 100 characters')
];

// ===== PUBLIC ROUTES =====

// Submit contact form (can be accessed by guests or logged-in users)
router.post('/submit', contactFormValidation, submitContactForm);

// Get all FAQs (public)
router.get('/faqs', getAllFAQs);

// Get contact information (public)
router.get('/info', getContactInfo);

// Get contact page content (public)
router.get('/content', getContactPageContent);

// Get contact form configuration (public)
router.get('/form-config', getContactFormConfig);

// ===== PROTECTED ROUTES (Require authentication) =====

// Get user's own contact submissions
router.get('/user/:userId', protect, getUserContactSubmissions);

// Get single contact submission (user can view their own, admin can view all)
router.get('/:id', protect, getContactSubmission);

// ===== ADMIN ONLY ROUTES =====

// Contact submissions management
router.get('/', protect, authorize('admin'), getAllContactSubmissions);
router.put('/:id/status', protect, authorize('admin'), statusUpdateValidation, updateContactStatus);
router.delete('/:id', protect, authorize('admin'), deleteContactSubmission);

// FAQ management routes
router.post('/faqs', protect, authorize('admin'), faqValidation, createFAQ);
router.put('/faqs/:index', protect, authorize('admin'), faqValidation, updateFAQ);
router.delete('/faqs/:index', protect, authorize('admin'), deleteFAQ);

// Configuration management routes
router.put('/info', protect, authorize('admin'), contactInfoValidation, updateContactInfo);
router.put('/content', protect, authorize('admin'), pageContentValidation, updateContactPageContent);
router.put('/form-config', protect, authorize('admin'), formConfigValidation, updateContactFormConfig);
router.put('/business-rules', protect, authorize('admin'), businessRulesValidation, updateBusinessRules);

// Get business rules (Admin only - contains sensitive info)
router.get('/business-rules', protect, authorize('admin'), getBusinessRules);

// Complete configuration management
router.get('/config/all', protect, authorize('admin'), getCompleteConfiguration);
router.post('/config/initialize', protect, authorize('admin'), initializeConfiguration);

module.exports = router;