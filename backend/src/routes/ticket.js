// backend/src/routes/tickets.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { validateTicket, validateReservation } = require('../middleware/validation');

// -------------------
// Public routes
// -------------------
// Get all tickets for an event
router.get('/event/:eventId', ticketController.getEventTickets);

// Get a single ticket by ID
router.get('/:id', ticketController.getTicket);

// -------------------
// Protected routes
// -------------------
router.use(protect);

// Organizer and Admin routes
router.post(
  '/event/:eventId',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.createTicket
);

router.put(
  '/:id',
  authorize('organizer', 'admin'),
  validateTicket,
  ticketController.updateTicket
);

router.delete(
  '/:id',
  authorize('organizer', 'admin'),
  ticketController.deleteTicket
);

// -------------------
// Reservation route
// -------------------
// Any logged-in user can reserve a ticket
router.post('/:ticketId/reserve', validateReservation, ticketController.reserveTickets);

module.exports = router;
