// src/controllers/ticketController.js
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const IssuedTicket = require('../models/IssuedTicket');
const Organization = require('../models/Organizer');
const { validationResult } = require('express-validator');

// Get single ticket
exports.getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id)
      .populate('event', 'title date venue image organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive,
        event: {
          id: ticket.event._id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
          image: ticket.event.image,
          organizer: ticket.event.organizer
        }
      }
    });
  } catch (error) {
    console.error('❌ getTicket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all tickets for an event
exports.getEventTickets = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('organizer', 'organizationName businessType logo')
      .select('title date venue image organizer');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const tickets = await Ticket.find({ event: eventId });
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      data: {
        tickets: tickets.map(ticket => ({
          id: ticket._id,
          type: ticket.type,
          price: ticket.price,
          quantity: ticket.quantity,
          available: ticket.available,
          description: ticket.description,
          benefits: ticket.benefits || [],
          minOrder: ticket.minOrder,
          maxOrder: ticket.maxOrder,
          salesStart: ticket.salesStart,
          salesEnd: ticket.salesEnd,
          isActive: ticket.isActive
        })),
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          venue: event.venue,
          image: event.image,
          organizer: event.organizer
        }
      }
    });
  } catch (error) {
    console.error('❌ getEventTickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
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
    console.log("📌 Incoming ticket payload:", req.body);
    console.log("📌 Event ID param:", eventId);
    
    const event = await Event.findById(eventId);
    if (!event) {
      console.log("⚠️ Event not found:", eventId);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const organization = await Organization.findOne({
      _id: event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tickets for this event'
      });
    }
    
    const ticketData = {
      ...req.body,
      event: eventId,
      available: req.body.quantity || req.body.available || 0
    };
    
    const ticket = await Ticket.create(ticketData);
    
    event.tickets.push(ticket._id);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive
      }
    });
  } catch (error) {
    console.error("❌ Ticket creation error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
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
    
    const { id } = req.params;
    
    let ticket = await Ticket.findById(id)
      .populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const organization = await Organization.findOne({
      _id: ticket.event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }
    
    const updateData = { ...req.body };
    if (updateData.quantity !== undefined) {
      const quantityChange = updateData.quantity - ticket.quantity;
      updateData.available = Math.max(0, ticket.available + quantityChange);
    }
    
    ticket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive
      }
    });
  } catch (error) {
    console.error("❌ Ticket update error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// NEW: Event-specific controller functions
// ============================================

// Update ticket for specific event (organizer only)
exports.updateTicketForEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { eventId, ticketId } = req.params;
    
    // Find ticket and verify it belongs to the event
    let ticket = await Ticket.findOne({
      _id: ticketId,
      event: eventId
    }).populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or does not belong to this event'
      });
    }
    
    // Check if user is the event organizer
    const organization = await Organization.findOne({
      _id: ticket.event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }
    
    // Calculate new available quantity if total quantity is being updated
    const updateData = { ...req.body };
    if (updateData.quantity !== undefined) {
      const quantityChange = updateData.quantity - ticket.quantity;
      updateData.available = Math.max(0, ticket.available + quantityChange);
    }
    
    ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive,
        eventId: eventId
      }
    });
  } catch (error) {
    console.error("❌ updateTicketForEvent error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete ticket for specific event (organizer only)
exports.deleteTicketForEvent = async (req, res, next) => {
  try {
    const { eventId, ticketId } = req.params;
    
    // Find ticket and verify it belongs to the event
    const ticket = await Ticket.findOne({
      _id: ticketId,
      event: eventId
    }).populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or does not belong to this event'
      });
    }
    
    // Check if user is the event organizer
    const organization = await Organization.findOne({
      _id: ticket.event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ticket'
      });
    }
    
    await ticket.deleteOne();
    
    // Remove ticket from event's tickets array
    await Event.findByIdAndUpdate(
      ticket.event._id,
      { $pull: { tickets: ticketId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error("❌ deleteTicketForEvent error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// Existing functions (unchanged)
// ============================================

// Get tickets for authenticated user
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await IssuedTicket.find({ 
      $or: [
        { userId: req.user.id },
        { attendeeEmail: req.user.email }
      ],
      isUsed: false
    })
    .populate('eventId', 'title date venue image organizer')
    .populate('ticketId', 'type price')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets.map(ticket => ({
        id: ticket._id,
        ticketCode: ticket.ticketCode,
        qrCode: ticket.qrCode,
        isUsed: ticket.isUsed,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        price: ticket.price,
        ticketType: ticket.ticketType,
        event: {
          id: ticket.eventId._id,
          title: ticket.eventId.title,
          date: ticket.eventId.date,
          venue: ticket.eventId.venue,
          image: ticket.eventId.image,
          organizer: ticket.eventId.organizer
        },
        ticketDetails: {
          id: ticket.ticketId._id,
          type: ticket.ticketId.type,
          price: ticket.ticketId.price
        }
      }))
    });
  } catch (error) {
    console.error('❌ getMyTickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Lookup tickets by email (for logged-out users)
exports.lookupTicketsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    console.log(`🔍 Looking up tickets for email: ${email}`);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const tickets = await IssuedTicket.find({ 
      attendeeEmail: email.toLowerCase(),
      isUsed: false
    })
    .populate('eventId', 'title date venue image organizer')
    .populate('ticketId', 'type price')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${tickets.length} tickets for email: ${email}`);
    
    // Debug: Check each ticket's populated fields
    tickets.forEach((ticket, index) => {
      console.log(`\n📋 Ticket ${index + 1}:`);
      console.log(`   Ticket ID: ${ticket._id}`);
      console.log(`   Ticket Code: ${ticket.ticketCode}`);
      console.log(`   Event ID reference: ${ticket.eventId}`);
      console.log(`   Ticket Type ID reference: ${ticket.ticketId}`);
      
      // Check if populated fields exist
      if (!ticket.eventId) {
        console.log(`   ⚠️  WARNING: eventId is NULL for ticket ${ticket._id}`);
      } else {
        console.log(`   ✅ Event populated: ${ticket.eventId._id} - ${ticket.eventId.title}`);
      }
      
      if (!ticket.ticketId) {
        console.log(`   ⚠️  WARNING: ticketId is NULL for ticket ${ticket._id}`);
      } else {
        console.log(`   ✅ Ticket type populated: ${ticket.ticketId._id} - ${ticket.ticketId.type}`);
      }
    });

    // Map tickets with error handling for null references
    const mappedTickets = tickets.map(ticket => {
      try {
        console.log(`\n🔄 Processing ticket: ${ticket._id}`);
        
        if (!ticket.eventId) {
          console.log(`   🚨 eventId is null for ticket ${ticket._id}`);
          throw new Error(`Event not found for ticket ${ticket._id}`);
        }
        
        if (!ticket.ticketId) {
          console.log(`   🚨 ticketId is null for ticket ${ticket._id}`);
          throw new Error(`Ticket type not found for ticket ${ticket._id}`);
        }
        
        console.log(`   ✅ Both references populated successfully`);
        
        return {
          id: ticket._id,
          ticketCode: ticket.ticketCode,
          qrCode: ticket.qrCode,
          isUsed: ticket.isUsed,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          price: ticket.price,
          ticketType: ticket.ticketType,
          event: {
            id: ticket.eventId._id,
            title: ticket.eventId.title,
            date: ticket.eventId.date,
            venue: ticket.eventId.venue,
            image: ticket.eventId.image,
            organizer: ticket.eventId.organizer
          },
          ticketDetails: {
            id: ticket.ticketId._id,
            type: ticket.ticketId.type,
            price: ticket.ticketId.price
          }
        };
      } catch (mapError) {
        console.error(`   ❌ Error mapping ticket ${ticket._id}:`, mapError.message);
        console.log(`   💾 Ticket raw data:`, JSON.stringify(ticket, null, 2));
        return null; // Return null for failed mappings
      }
    });

    // Filter out null values from failed mappings
    const validTickets = mappedTickets.filter(ticket => ticket !== null);
    
    console.log(`\n📊 Final result:`);
    console.log(`   Total tickets found: ${tickets.length}`);
    console.log(`   Valid tickets mapped: ${validTickets.length}`);
    console.log(`   Failed mappings: ${tickets.length - validTickets.length}`);

    res.status(200).json({
      success: true,
      count: validTickets.length,
      invalidCount: tickets.length - validTickets.length,
      data: validTickets
    });
    
  } catch (error) {
    console.error('❌ lookupTicketsByEmail error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request query:', req.query);
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// Delete ticket (organizer only) - original version
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findById(id)
      .populate('event', 'organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const organization = await Organization.findOne({
      _id: ticket.event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ticket'
      });
    }
    
    await ticket.deleteOne();
    
    await Event.findByIdAndUpdate(
      ticket.event._id,
      { $pull: { tickets: id } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error("❌ Ticket deletion error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Reserve tickets for purchase (during checkout)
exports.reserveTickets = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticket.available} tickets available`
      });
    }
    
    if (!ticket.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This ticket type is not available for purchase'
      });
    }
    
    const now = new Date();
    if (ticket.salesStart && now < ticket.salesStart) {
      return res.status(400).json({
        success: false,
        message: 'Ticket sales have not started yet'
      });
    }
    
    if (ticket.salesEnd && now > ticket.salesEnd) {
      return res.status(400).json({
        success: false,
        message: 'Ticket sales have ended'
      });
    }
    
    ticket.available -= quantity;
    await ticket.save();
    
    res.status(200).json({
      success: true,
      message: 'Tickets reserved successfully',
      data: {
        reserved: quantity,
        available: ticket.available,
        ticketId: ticket._id,
        type: ticket.type,
        price: ticket.price
      }
    });
  } catch (error) {
    console.error('❌ reserveTickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get ticket by event ID and ticket ID
exports.getTicketByEvent = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;
    
    const ticket = await Ticket.findOne({
      _id: ticketId,
      event: eventId
    })
    .populate('event', 'title date venue image organizer');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or does not belong to this event'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive,
        event: {
          id: ticket.event._id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
          image: ticket.event.image,
          organizer: ticket.event.organizer
        }
      }
    });
  } catch (error) {
    console.error('❌ getTicketByEvent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create ticket for specific event (alternative route)
exports.createTicketForEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const organization = await Organization.findOne({
      _id: event.organizer,
      userId: req.user.id
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tickets for this event'
      });
    }
    
    const ticketData = {
      ...req.body,
      event: eventId,
      available: req.body.quantity || req.body.available || 0
    };
    
    const ticket = await Ticket.create(ticketData);
    
    event.tickets.push(ticket._id);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: {
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits || [],
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        isActive: ticket.isActive
      }
    });
  } catch (error) {
    console.error("❌ createTicketForEvent error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type already exists for this event'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};