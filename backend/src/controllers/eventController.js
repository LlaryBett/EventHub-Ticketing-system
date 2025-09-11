// src/controllers/eventController.js
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { uploadImage, deleteImage } = require('../utils/helpers');

// Get all events with filtering, sorting and pagination
const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      featured,
      organizer,
      search,
      sortBy = 'date',
      order = 'asc'
    } = req.query;

    const filter = {};

    // Filter by category (name → id)
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
        console.log("🔎 Matched category:", categoryDoc.name, "=>", categoryDoc._id);
      }
    }

    // Filter by featured
    if (featured !== undefined) filter.featured = featured === 'true';

    // Filter by organizer (id or name)
    if (organizer) {
      if (/^[0-9a-fA-F]{24}$/.test(organizer)) {
        // Organizer is an ObjectId
        filter.organizer = organizer;
        const organizerDoc = await Organizer.findById(organizer);
        if (organizerDoc) {
          console.log("🔎 Matched organizer by ID:", organizerDoc._id, "=>", organizerDoc.name);
        } else {
          console.log("⚠️ Organizer ID not found:", organizer);
        }
      } else {
        // Organizer is a name
        const organizerDoc = await Organizer.findOne({ name: organizer });
        if (organizerDoc) {
          filter.organizer = organizerDoc._id;
          console.log("🔎 Matched organizer by name:", organizer, "=>", organizerDoc._id);
        } else {
          console.log("⚠️ Organizer name not found:", organizer);
        }
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
      console.log("🔎 Search applied:", search);
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Query events
    const events = await Event.find(filter)
      .populate('category', 'name')
      .populate('organizer', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Transform to new format
    const transformedEvents = events.map(event => {
      return {
        id: event._id,
        title: event.title,
        description: event.description,
        image: event.image,
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        venue: event.venue,
        tickets: event.tickets,
        category: event.category?.name || null,
        organizer: event.organizer?.name || null,
        capacity: event.capacity,
        registered: event.registered,
        featured: event.featured,
        tags: event.tags
      };
    });

    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: transformedEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ getAllEvents error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};




// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('tickets') // ✅ populate ticket refs
      .populate('category', 'name icon color') // get extra info if needed
      .populate('organizer', 'organizationName businessType logo'); // ✅ fixed

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const transformedEvent = {
      id: event._id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date ? event.date.toISOString().split('T')[0] : null,
      time: event.time,
      venue: event.venue,
      tickets: event.tickets.map(ticket => ({
        id: ticket._id,
        type: ticket.type,
        price: ticket.price,
        quantity: ticket.quantity,
        available: ticket.available,
        description: ticket.description,
        benefits: ticket.benefits,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        minOrder: ticket.minOrder,
        maxOrder: ticket.maxOrder,
        isActive: ticket.isActive
      })),
      category: event.category ? {
        id: event.category._id,
        name: event.category.name,
        icon: event.category.icon,
        color: event.category.color
      } : null,
      organizer: event.organizer ? {
        id: event.organizer._id,
        organizationName: event.organizer.organizationName,
        businessType: event.organizer.businessType,
        logo: event.organizer.logo
      } : null,
      capacity: event.capacity,
      registered: event.registered,
      featured: event.featured,
      tags: event.tags
    };

    res.status(200).json({
      success: true,
      data: transformedEvent
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};




// Create a new event
// Create a new event
const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Ensure category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Ensure organizer exists
    const organizer = await Organizer.findById(req.body.organizer);
    if (!organizer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organizer ID'
      });
    }

    // Handle image upload if present
    if (req.file) {
      const imageUrl = await uploadImage(req.file, 'events');
      req.body.image = imageUrl;
    }

    // Parse and validate tickets
    let tickets = [];
    if (req.body.tickets) {
      try {
        // If tickets is a JSON string, parse it
        tickets = typeof req.body.tickets === 'string' 
          ? JSON.parse(req.body.tickets) 
          : req.body.tickets;
        
        // Validate each ticket
        for (const ticket of tickets) {
          if (!ticket.type || !ticket.price || !ticket.quantity) {
            return res.status(400).json({
              success: false,
              message: 'Each ticket must have type, price, and quantity'
            });
          }
          
          if (ticket.price < 0) {
            return res.status(400).json({
              success: false,
              message: 'Ticket price cannot be negative'
            });
          }
          
          if (ticket.quantity < 0) {
            return res.status(400).json({
              success: false,
              message: 'Ticket quantity cannot be negative'
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tickets format'
        });
      }
    }

    // Calculate total capacity from tickets
    const capacity = tickets.reduce((total, ticket) => total + ticket.quantity, 0);

    // Create event with category and organizer IDs
    const eventData = {
      ...req.body,
      tickets: tickets,
      capacity: capacity, // Set capacity as sum of all ticket quantities
      category: category._id,
      organizer: organizer._id
    };

    // Remove the old single price field if it exists
    delete eventData.price;

    const event = new Event(eventData);
    await event.save();

    await event.populate('category', 'name');
    await event.populate('organizer', 'name');

    const transformedEvent = {
      id: event._id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      venue: event.venue, // Changed from location to venue
      tickets: event.tickets, // Include tickets array instead of single price
      category: event.category.name,
      organizer: event.organizer.name,
      capacity: event.capacity,
      registered: event.registered,
      featured: event.featured,
      tags: event.tags
    };

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: transformedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


// Update an event
const updateEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if event exists
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Handle category update if provided
    if (req.body.category) {
      let category = await Category.findOne({ name: req.body.category });
      if (!category) {
        category = new Category({ name: req.body.category });
        await category.save();
      }
      req.body.category = category._id;
    }

    // Handle organizer update if provided
    if (req.body.organizer) {
      let organizer = await Organizer.findOne({ name: req.body.organizer });
      if (!organizer) {
        organizer = new Organizer({ 
          name: req.body.organizer,
          email: req.body.organizerEmail || `${req.body.organizer.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: req.body.organizerPhone || '+1-555-0123'
        });
        await organizer.save();
      }
      req.body.organizer = organizer._id;
    }

    // Handle image upload if present
    if (req.file) {
      // Delete old image if exists
      if (event.image) {
        await deleteImage(event.image);
      }
      
      const imageUrl = await uploadImage(req.file, 'events');
      req.body.image = imageUrl;
    }

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name').populate('organizer', 'name');

    // Transform data to match your expected format
    const transformedEvent = {
      id: updatedEvent._id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      image: updatedEvent.image,
      date: updatedEvent.date.toISOString().split('T')[0],
      time: updatedEvent.time,
      location: updatedEvent.location,
      price: updatedEvent.price,
      category: updatedEvent.category.name,
      organizer: updatedEvent.organizer.name,
      capacity: updatedEvent.capacity,
      registered: updatedEvent.registered,
      featured: updatedEvent.featured,
      tags: updatedEvent.tags
    };

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: transformedEvent
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete associated image if exists
    if (event.image) {
      await deleteImage(event.image);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get featured events
const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({ featured: true })
      .populate('category', 'name')
      .populate('organizer', 'name')
      .limit(10);

    // Transform data to match your expected format
    const transformedEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      price: event.price,
      category: event.category.name,
      organizer: event.organizer.name,
      capacity: event.capacity,
      registered: event.registered,
      featured: event.featured,
      tags: event.tags
    }));

    res.status(200).json({
      success: true,
      data: transformedEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Register user for an event
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is at capacity
    if (event.registered >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is at full capacity'
      });
    }

    // Check if user is already registered
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Add user to attendees and increment registered count
    event.attendees.push(req.user.id);
    event.registered += 1;
    
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for the event'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
  registerForEvent
};