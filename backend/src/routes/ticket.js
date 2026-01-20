// backend/src/routes/tickets.js - UPDATED TO MATCH CONTROLLER
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { validateTicket, validateReservation } = require('../middleware/validation');

// -------------------
// Public routes - MUST BE BEFORE protect middleware
// -------------------
// Get ticket by event ID and ticket ID (MOST specific)
router.get('/event/:eventId/ticket/:ticketId', ticketController.getTicketByEvent);

// Lookup tickets by email
router.get('/lookup/email', ticketController.lookupTicketsByEmail);

// Get all tickets for an event
router.get('/event/:eventId', ticketController.getEventTickets);

// Get a single ticket by ID (LEAST specific)
router.get('/:id', ticketController.getTicket);

// -------------------
// Apply protection middleware - ALL ROUTES AFTER THIS REQUIRE AUTH
// -------------------
router.use(protect);

// Protected routes
router.get('/user/mytickets', ticketController.getMyTickets);

// Reserve tickets during checkout
router.post(
  '/:ticketId/reserve', 
  validateReservation,
  ticketController.reserveTickets
);

// -------------------
// Organizer and Admin routes
// -------------------
// CREATE: Event-specific ticket creation (specific route)
router.post(
  '/event/:eventId/create',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.createTicketForEvent
);

// UPDATE: Event-specific ticket update (specific route) - USE NEW FUNCTION
router.put(
  '/event/:eventId/:ticketId',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.updateTicketForEvent  // Changed to use new function
);

// DELETE: Event-specific ticket deletion (specific route) - USE NEW FUNCTION
router.delete(
  '/event/:eventId/:ticketId',
  authorize('organizer', 'admin'),
  ticketController.deleteTicketForEvent  // Changed to use new function
);

// -------------------
// Organizer and Admin routes - GENERAL TICKET OPERATIONS
// -------------------
// CREATE: General ticket creation (event ID in body)
router.post(
  '/',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.createTicket
);

// UPDATE: Direct ticket update by ID
router.put(
  '/:id',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.updateTicket
);

// DELETE: Direct ticket deletion by ID
router.delete(
  '/:id',
  authorize('organizer', 'admin'),
  ticketController.deleteTicket
);

module.exports = router;