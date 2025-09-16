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

  body('venue')
    .trim()
    .notEmpty()
    .withMessage('Venue is required'),

  body('tickets')
    .isArray({ min: 1 })
    .withMessage('At least one ticket type is required')
    .custom((tickets) => {
      if (typeof tickets === 'string') {
        try {
          tickets = JSON.parse(tickets);
        } catch (error) {
          throw new Error('Tickets must be a valid JSON array');
        }
      }

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
    .withMessage('Organizer is required')
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

// Checkout validation
const validateCheckout = (method) => {
  switch (method) {
    case 'processCheckout':
      return [
        // Customer info validation (frontend format)
        body('customerInfo.fullName')
          .notEmpty().withMessage('Full name is required')
          .trim()
          .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
        
        body('customerInfo.email')
          .isEmail().withMessage('Valid email is required')
          .normalizeEmail(),
        
        body('customerInfo.phone')
          .notEmpty().withMessage('Phone number is required')
          .trim(),

        // Items validation
        body('items')
          .isArray({ min: 1 }).withMessage('At least one item is required'),
        
        body('items.*.eventId')
          .notEmpty().withMessage('Event ID is required for all items')
          .isMongoId().withMessage('Invalid Event ID format'),
        
        body('items.*.quantity')
          .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        
        body('items.*.price')
          .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        
        body('items.*.title')
          .notEmpty().withMessage('Item title is required'),

        // Payment validation
        body('paymentMethod')
          .isIn(['mpesa', 'card', 'paypal'])
          .withMessage('Valid payment method is required (mpesa, card, or paypal)'),

        // M-Pesa phone validation (frontend format)
        body('mpesaPhone')
          .if(body('paymentMethod').equals('mpesa'))
          .notEmpty().withMessage('Phone number is required for M-Pesa payments')
          .trim(),

        // Card payment validation (if needed - frontend would need to send this format)
        body('cardDetails.nameOnCard')
          .if(body('paymentMethod').equals('card'))
          .notEmpty().withMessage('Name on card is required for card payments')
          .trim(),

        body('cardDetails.cardNumber')
          .if(body('paymentMethod').equals('card'))
          .isLength({ min: 13, max: 19 })
          .withMessage('Valid card number is required')
          .isNumeric().withMessage('Card number must contain only numbers'),

        body('cardDetails.expiryDate')
          .if(body('paymentMethod').equals('card'))
          .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2,4})$/)
          .withMessage('Valid expiry date is required (MM/YY or MM/YYYY)'),

        body('cardDetails.cvv')
          .if(body('paymentMethod').equals('card'))
          .isLength({ min: 3, max: 4 })
          .withMessage('Valid CVV is required')
          .isNumeric().withMessage('CVV must contain only numbers'),

        // Totals validation
        body('totals.subtotal')
          .isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
        
        body('totals.discountAmount')
          .optional()
          .isFloat({ min: 0 }).withMessage('Discount amount must be a positive number'),
        
        body('totals.tax')
          .isFloat({ min: 0 }).withMessage('Tax must be a positive number'),
        
        body('totals.total')
          .isFloat({ min: 0 }).withMessage('Total must be a positive number')
      ];

    case 'createGuestOrder':
      return [
        body('customerEmail')
          .isEmail().withMessage('Valid email is required')
          .normalizeEmail(),
        
        body('customerName')
          .notEmpty().withMessage('Customer name is required')
          .trim(),
        
        body('items')
          .isArray({ min: 1 }).withMessage('At least one item is required'),
        
        body('items.*.event')
          .notEmpty().withMessage('Event ID is required for all items')
          .isMongoId().withMessage('Invalid Event ID format'),
        
        body('items.*.ticket')
          .optional()
          .isMongoId().withMessage('Invalid Ticket ID format'),
        
        body('items.*.quantity')
          .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        
        body('items.*.price')
          .optional()
          .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        
        body('items.*.title')
          .optional()
          .notEmpty().withMessage('Item title is required')
      ];

    case 'applyDiscount':
      return [
        body('discountCode')
          .notEmpty().withMessage('Discount code is required')
          .trim()
          .isLength({ min: 1, max: 20 }).withMessage('Discount code cannot exceed 20 characters')
      ];

    case 'claimAccount':
      return [
        body('token')
          .notEmpty().withMessage('Token is required'),
        
        body('email')
          .isEmail().withMessage('Valid email is required')
          .normalizeEmail(),
        
        body('password')
          .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        
        body('firstName')
          .notEmpty().withMessage('First name is required')
          .trim()
          .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
        
        body('lastName')
          .notEmpty().withMessage('Last name is required')
          .trim()
          .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
      ];

    case 'sendClaimEmail':
      return [
        body('email')
          .isEmail().withMessage('Valid email is required')
          .normalizeEmail(),
        
        body('orderId')
          .notEmpty().withMessage('Order ID is required')
          .isMongoId().withMessage('Invalid Order ID format')
      ];

    case 'convertGuestToUserOrder':
      return [
        body('userId')
          .notEmpty().withMessage('User ID is required')
          .isMongoId().withMessage('Invalid User ID format')
      ];

    default:
      return [];
  }
};




// Notification preferences validation
const validateNotificationPreferences = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean value'),
  
  body('eventReminders')
    .optional()
    .isBoolean()
    .withMessage('Event reminders must be a boolean value'),
  
  body('ticketUpdates')
    .optional()
    .isBoolean()
    .withMessage('Ticket updates must be a boolean value'),
  
  body('eventUpdates')
    .optional()
    .isBoolean()
    .withMessage('Event updates must be a boolean value'),
  
  body('promotionalEmails')
    .optional()
    .isBoolean()
    .withMessage('Promotional emails must be a boolean value'),
  
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications must be a boolean value'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean value'),
  
  body('showAttendance')
    .optional()
    .isBoolean()
    .withMessage('Show attendance must be a boolean value'),
  
  body('allowOrganizerContact')
    .optional()
    .isBoolean()
    .withMessage('Allow organizer contact must be a boolean value'),
  
  body('includeInNetworking')
    .optional()
    .isBoolean()
    .withMessage('Include in networking must be a boolean value')
];

// Create notification validation (for internal use)
const validateNotification = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  
  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn(['event_reminder', 'ticket_update', 'event_update', 'system', 'promotional'])
    .withMessage('Invalid notification type'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Notification title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Notification message is required')
    .isLength({ max: 500 })
    .withMessage('Message cannot be more than 500 characters'),
  
  body('relatedEvent')
    .optional()
    .isMongoId()
    .withMessage('Invalid Event ID format'),
  
  body('relatedTicket')
    .optional()
    .isMongoId()
    .withMessage('Invalid Ticket ID format')
];

module.exports = {
  validateEvent,
  validateCategory,
  validateAddToCart,
  validateUpdateCartItem,
  validateTicket,
  validateReservation,
  validateCheckout,
  validateNotificationPreferences, // Add this
  validateNotification // Add this
};