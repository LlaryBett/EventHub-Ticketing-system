// src/middleware/validation.js
const { body } = require('express-validator');

// Event validation
const validateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters'),

  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),

  body('time')
    .notEmpty()
    .withMessage('Time is required'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),

  body('organizer')
    .trim()
    .notEmpty()
    .withMessage('Organizer is required'),

  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1')
];

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),

  body('icon')
    .trim()
    .notEmpty()
    .withMessage('Icon is required'),

  body('color')
    .trim()
    .notEmpty()
    .withMessage('Color is required')
];

module.exports = {
  validateEvent,
  validateCategory
};
