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

    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
        console.log("🔎 Matched category:", categoryDoc.name, "=>", categoryDoc._id);
      }
    }

    if (featured !== undefined) filter.featured = featured === 'true';

    if (organizer) {
      if (/^[0-9a-fA-F]{24}$/.test(organizer)) {
        // Organizer is an ObjectId
        filter.organizer = organizer;
        const organizerDoc = await Organizer.findById(organizer);
        if (organizerDoc) {
          console.log("🔎 Matched organizer by ID:", organizerDoc._id, "=>", organizerDoc.organizationName);
        } else {
          console.log("⚠️ Organizer ID not found:", organizer);
        }
      } else {
        // Organizer is a name (organizationName)
        const organizerDoc = await Organizer.findOne({ organizationName: organizer });
        if (organizerDoc) {
          filter.organizer = organizerDoc._id;
          console.log("🔎 Matched organizer by organizationName:", organizer, "=>", organizerDoc._id);
        } else {
          console.log("⚠️ Organizer name not found:", organizer);
        }
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
      console.log("🔎 Search applied:", search);
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const events = await Event.find(filter)
      .populate('category', 'name')
      .populate('organizer', 'organizationName') // ✅ FIX: use organizationName
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const transformedEvents = events.map(event => {
      console.log("📌 Event found:", {
        id: event._id,
        title: event.title,
        organizer: event.organizer?.organizationName,
        organizerId: event.organizer?._id
      });
      return {
        id: event._id,
        title: event.title,
        description: event.description,
        image: event.image,
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        location: event.location,
        price: event.price,
        category: event.category?.name || null,
        organizer: event.organizer?.organizationName || null, // ✅ FIX
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
      .populate('category', 'name')
      .populate('organizer', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Transform data to match your expected format
    const transformedEvent = {
      id: event._id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      time: event.time,
      location: event.location,
      price: event.price,
      category: event.category.name,
      organizer: event.organizer.name,
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

    // Create event with category and organizer IDs
    const eventData = {
      ...req.body,
      category: category._id,
      organizer: organizer._id
    };

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
      location: event.location,
      price: event.price,
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