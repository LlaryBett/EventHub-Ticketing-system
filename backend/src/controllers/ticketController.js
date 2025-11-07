const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const IssuedTicket = require('../models/IssuedTicket');
const Organization = require('../models/Organizer'); // Add this line
const { validationResult } = require('express-validator');

// Get single ticket
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title dates venue image'); // Added image field
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// Get all tickets for an event
exports.getEventTickets = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .select('title dates venue image organizer'); // Added image field
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const tickets = await Ticket.getAvailableTickets(eventId);
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      data: {
        tickets,
        event // Include full event data including image
      }
    });
  } catch (error) {
    next(error);
  }
};



// Create new ticket (organizer only)
exports.createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { eventId } = req.params;
    console.log("📌 Incoming ticket payload (raw body):", req.body);
    console.log("📌 Event ID param:", eventId);
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log("⚠️ Event not found:", eventId);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user owns the organization that created the event
    const organization = await Organization.findOne({
      _id: event.organizer,
      userId: req.user.id
    });
    console.log("👤 Authenticated user:", req.user.id);
    console.log("🏢 Event organizer:", event.organizer);
    console.log("🏢 Matching organization for user:", organization?._id || "Not found");
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tickets for this event'
      });
    }
    
    const ticketData = {
      ...req.body,
      event: eventId,
      available: req.body.quantity
    };
    console.log("📦 Ticket data being saved:", ticketData);
    
    const ticket = await Ticket.create(ticketData);
    console.log("✅ Ticket created:", ticket);
    
    // Add ticket to event's tickets array
    event.tickets.push(ticket._id);
    await event.save();
    console.log("📌 Ticket ID added to event:", ticket._id);
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error("❌ Ticket creation error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    next(error);
  }
};


// Update ticket (organizer only)
exports.updateTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let ticket = await Ticket.findById(req.params.id)
      .populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Check if user is the event organizer
    if (ticket.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }
    
    // Calculate new available quantity if total quantity is being updated
    if (req.body.quantity !== undefined) {
      const quantityChange = req.body.quantity - ticket.quantity;
      req.body.available = Math.max(0, ticket.available + quantityChange);
    }
    
    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    next(error);
  }
};


// Get tickets for authenticated user
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await IssuedTicket.find({ 
      $or: [
        { userId: req.user.id },
        { attendeeEmail: req.user.email }
      ],
      isUsed: false // Only show active tickets
    })
    .populate('eventId', 'title date venue image organizer') // Changed 'dates' to 'date'
    .populate('ticketId', 'type price')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// Lookup tickets by email (for logged-out users)
exports.lookupTicketsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const tickets = await IssuedTicket.find({ 
      attendeeEmail: email.toLowerCase(),
      isUsed: false // Only show active tickets
    })
    .populate('eventId', 'title date venue image organizer') // Changed 'dates' to 'date'
    .populate('ticketId', 'type price')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};
// Delete ticket (organizer only)
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Check if user is the event organizer
    if (ticket.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ticket'
      });
    }
    
    await ticket.deleteOne();
    
    // Remove ticket from event's tickets array
    await Event.findByIdAndUpdate(
      ticket.event._id,
      { $pull: { tickets: ticket._id } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Reserve tickets for purchase
exports.reserveTickets = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { quantity } = req.body;
    
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (!ticket.canPurchase(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reserve ${quantity} tickets. Available: ${ticket.available}`
      });
    }
    
    await ticket.reserveTickets(quantity);
    
    res.status(200).json({
      success: true,
      message: 'Tickets reserved successfully',
      data: {
        reserved: quantity,
        available: ticket.available
      }
    });
  } catch (error) {
    next(error);
  }
};