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

  body('venue') // Changed from 'location' to 'venue'
    .trim()
    .notEmpty()
    .withMessage('Venue is required'),

  // REMOVE the single price validation
  // body('price')
  //   .isFloat({ min: 0 })
  //   .withMessage('Valid price is required'),

  // ADD validation for tickets array
  body('tickets')
    .isArray({ min: 1 })
    .withMessage('At least one ticket type is required')
    .custom((tickets) => {
      // If tickets is a string, try to parse it as JSON
      if (typeof tickets === 'string') {
        try {
          tickets = JSON.parse(tickets);
        } catch (error) {
          throw new Error('Tickets must be a valid JSON array');
        }
      }
      
      // Validate each ticket object
      for (const ticket of tickets) {
        if (!ticket.type || typeof ticket.type !== 'string' || ticket.type.trim() === '') {
          throw new Error('Each ticket must have a valid type');
        }
        
        if (typeof ticket.price !== 'number' || ticket.price < 0) {
          throw new Error('Each ticket must have a valid price (number >= 0)');
        }
        
        if (typeof ticket.quantity !== 'number' || ticket.quantity < 1) {
          throw new Error('Each ticket must have a valid quantity (number >= 1)');
        }
      }
      
      return true;
    }),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),

  body('organizer')
    .trim()
    .notEmpty()
    .withMessage('Organizer is required'),

  // REMOVE capacity validation since it's now calculated from tickets
  // body('capacity')
  //   .isInt({ min: 1 })
  //   .withMessage('Capacity must be at least 1')
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

// Cart validation rules
const validateAddToCart = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid Event ID'),

  body('ticketType')
    .notEmpty()
    .withMessage('Ticket type is required'),

  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

const validateUpdateCartItem = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];
// Ticket validation
const validateTicket = [
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Ticket type is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

// Ticket reservation validation
const validateReservation = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

module.exports = {
  validateEvent,
  validateCategory,
  validateAddToCart,
  validateUpdateCartItem,
  validateTicket,
  validateReservation
};
