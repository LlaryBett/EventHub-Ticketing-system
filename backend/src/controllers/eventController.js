// src/controllers/eventController.js
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Discover = require('../models/Discover'); // Add this import
const Ticket = require('../models/Ticket');
const Story = require('../models/Story');
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
      order = 'asc',
      startDate,
      endDate,
      filter // new: quick-filter slug (today, weekend, free, near-me, virtual, etc.)
    } = req.query;

    // Log incoming query params
    console.log('➡️ getAllEvents called with query:', {
      page, limit, category, featured, organizer, search, sortBy, order, startDate, endDate, filter,
      rawQuery: req.query
    });

    const filterQuery = {};

    // CHANGED: Handle 'filter' quick-slug mapping
    if (filter) {
      const f = String(filter).toLowerCase().trim();

      console.log('🔎 Interpreting quick-filter:', f);

      // Map date-based filters
      if (f === 'today') {
        const today = new Date();
        const start = new Date(today);
        start.setHours(0,0,0,0);
        const end = new Date(today);
        end.setHours(23,59,59,999);
        filterQuery.date = { $gte: start, $lte: end };
        console.log('  ↳ mapped filter "today" to date range:', filterQuery.date);
      } else if (f === 'weekend' || f === 'this-weekend') {
        const today = new Date();
        const day = today.getDay(); // 0 Sun .. 6 Sat
        const daysToSat = (6 - day + 7) % 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysToSat);
        saturday.setHours(0,0,0,0);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23,59,59,999);
        filterQuery.date = { $gte: saturday, $lte: sunday };
        console.log('  ↳ mapped filter "weekend" to date range:', filterQuery.date);
      } else if (f === 'virtual') {
        // Expect events to optionally have an isVirtual boolean
        filterQuery.isVirtual = true;
        console.log('  ↳ mapped filter "virtual" to isVirtual=true');
      } else if (f === 'free' || f === 'free-events') {
        // We'll later translate this into an _id filter using tickets
        filterQuery._requireFree = true;
        console.log('  ↳ mapped filter "free" to require free tickets marker');
      } else if (f === 'near-me') {
        // near-me requires lat/lng query params — handled on frontend; here we accept lat/lng if provided
        // If lat & lng provided, the query below should implement geo filtering (requires geolocation field on Event)
        // We set a marker; actual geo-query will be attempted if coords exist on Event documents/index
        filterQuery._nearMe = true;
        console.log('  ↳ mapped filter "near-me" to near-me marker (expects lat/lng in query)');
      } else {
        // Unknown filter: pass as generic filter key for frontend/backends that support it
        filterQuery._customFilter = f;
        console.log('  ↳ unknown filter, preserved as _customFilter:', f);
      }
    }

    // CHANGED: Filter by category (now using slug from Discover schema)
    if (category) {
      const discoverData = await Discover.findOne({ isActive: true });
      if (discoverData) {
        const validCategory = discoverData.categories.find(cat =>
          (cat.slug === category || cat.name === category) && cat.isActive
        );
        if (validCategory) {
          // events store category as slug string
          filterQuery.category = validCategory.slug;
          console.log('🔎 Resolved category param to discover slug:', {
            input: category,
            resolvedSlug: validCategory.slug,
            name: validCategory.name
          });
        } else {
          console.log('⚠️ Discover category not found or inactive for input:', category);
        }
      } else {
        console.log('⚠️ No active Discover config found while resolving category:', category);
      }
    }

    // Log interim filterQuery so far
    console.log('🔧 Interim filterQuery after filters and category mapping:', filterQuery);

    // Filter by featured
    if (featured !== undefined) filterQuery.featured = featured === 'true';

    // Filter by organizer (id or organizationName)
    if (organizer) {
      if (/^[0-9a-fA-F]{24}$/.test(organizer)) {
        filterQuery.organizer = organizer;
      } else {
        const organizerDoc = await Organizer.findOne({ organizationName: organizer });
        if (organizerDoc) {
          filterQuery.organizer = organizerDoc._id;
        }
      }
    }

    // Search filter
    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
      console.log('🔎 Applied search filter for:', search);
    }

    // Support explicit startDate/endDate query params (override/augment filter.slug date range)
    if (startDate || endDate) {
      const s = startDate ? new Date(startDate) : new Date(0);
      const e = endDate ? new Date(endDate) : new Date('2100-01-01');
      filterQuery.date = Object.assign(filterQuery.date || {}, { $gte: s, $lte: e });
      console.log('📅 Applied explicit startDate/endDate:', { startDate: s, endDate: e });
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    console.log('🔢 Pagination & sort:', { page, limit, skip, sort });

    // Handle special 'free' filter: translate to event _id set from tickets with price 0
    if (filterQuery._requireFree) {
      console.log('🔍 Resolving free-events -> querying Ticket collection for price=0');
      // find events that have at least one ticket priced 0
      const freeEventIds = await Ticket.find({ price: 0 }).distinct('event');
      console.log('🔎 freeEventIds found:', freeEventIds?.length || 0);
      // if none, ensure no events returned
      if (!freeEventIds || freeEventIds.length === 0) {
        console.log('ℹ️ No free events found, returning empty result set');
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
        });
      }
      filterQuery._id = { $in: freeEventIds };
      delete filterQuery._requireFree;
    }

    // NOTE: _nearMe handling requires event docs to have geolocation fields (e.g. location: { type:'Point', coordinates: [lng, lat] })
    // If client sent lat/lng/radius, attempt geospatial query
    if (filterQuery._nearMe) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radiusKm = parseFloat(req.query.radius) || 50; // default 50km
      console.log('📍 near-me params from query:', { lat, lng, radiusKm });
      if (!isNaN(lat) && !isNaN(lng)) {
        // convert km to meters for $centerSphere (Earth radius ~6378.1 km)
        const radiusInRadians = radiusKm / 6378.1;
        // assume Event model uses 'location' GeoJSON field: { type: 'Point', coordinates: [lng, lat] }
        filterQuery.location = {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusInRadians]
          }
        };
        console.log('  ↳ added geo filter to filterQuery');
      } else {
        console.log('  ↳ no lat/lng provided, geo filter skipped');
      }
      delete filterQuery._nearMe;
    }

    // Final filterQuery log before DB call
    console.log('✅ Final filterQuery to be used for Event.find():', JSON.stringify(filterQuery, null, 2));

    // Query events
    const events = await Event.find(filterQuery)
      .populate('organizer', 'organizationName businessType logo')
      .populate('tickets')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`📦 Retrieved ${events.length} events from DB (limit ${limit}, skip ${skip})`);

    // Get discover categories for category info
    const discoverDataFinal = await Discover.findOne({ isActive: true });
    const discoverCategories = discoverDataFinal?.categories || [];

    // Transform to consistent format
    const transformedEvents = events.map(event => {
      const categoryDetails = discoverCategories.find(cat => cat.slug === event.category);

      return {
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        image: event.image,
        date: event.date ? event.date.toISOString().split('T')[0] : null,
        time: event.time || null,
        venue: event.venue || null,
        tickets: (event.tickets || []).map(ticket => ({
          id: ticket._id.toString(),
          type: ticket.type,
          price: ticket.price,
          quantity: ticket.quantity,
          available: ticket.available,
          description: ticket.description || null,
          benefits: ticket.benefits || [],
          minOrder: ticket.minOrder,
          maxOrder: ticket.maxOrder,
          salesStart: ticket.salesStart,
          salesEnd: ticket.salesEnd,
          isActive: ticket.isActive
        })),
        category: categoryDetails ? {
          id: categoryDetails.slug,
          name: categoryDetails.name,
          icon: categoryDetails.icon,
          color: categoryDetails.colorGradient,
          slug: categoryDetails.slug
        } : {
          id: event.category,
          name: event.category,
          icon: 'Users',
          color: 'from-gray-500 to-gray-700',
          slug: event.category
        },
        organizer: event.organizer ? {
          id: event.organizer._id,
          organizationName: event.organizer.organizationName,
          businessType: event.organizer.businessType,
          logo: event.organizer.logo
        } : null,
        capacity: event.capacity,
        registered: event.registered,
        featured: event.featured,
        tags: event.tags || [],
        status: event.status || 'draft'
      };
    });

    const total = await Event.countDocuments(filterQuery);

    console.log('📊 Pagination result:', { page: parseInt(page), limit: parseInt(limit), total });

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
      .populate('tickets')
      .populate('organizer', 'organizationName businessType logo');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get discover categories for category info
    const discoverData = await Discover.findOne({ isActive: true });
    const discoverCategories = discoverData?.categories || [];
    const categoryDetails = discoverCategories.find(cat => cat.slug === event.category);

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
      // CHANGED: Category from discover schema
      category: categoryDetails ? {
        id: categoryDetails.slug,
        name: categoryDetails.name,
        icon: categoryDetails.icon,
        color: categoryDetails.colorGradient,
        slug: categoryDetails.slug
      } : {
        id: event.category,
        name: event.category,
        icon: 'Users',
        color: 'from-gray-500 to-gray-700',
        slug: event.category
      },
      organizer: event.organizer ? {
        id: event.organizer._id,
        organizationName: event.organizer.organizationName,
        businessType: event.organizer.businessType,
        logo: event.organizer.logo
      } : null,
      capacity: event.capacity,
      registered: event.registered,
      featured: event.featured,
      tags: event.tags,
      status: event.status || 'draft'
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
const createEvent = async (req, res) => {
  try {
    // 1️⃣ Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // 2️⃣ CHANGED: Validate category against discover schema
    const discoverData = await Discover.findOne({ isActive: true });
    if (!discoverData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active discover configuration found' 
      });
    }

    const validCategory = discoverData.categories.find(cat => 
      cat.slug === req.body.category && cat.isActive
    );
    
    if (!validCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or inactive category' 
      });
    }

    // 3️⃣ Get organizer from authenticated user
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    // 4️⃣ Verify organizer ownership
    if (organizer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to create events for this organizer' 
      });
    }

    // 5️⃣ Handle image upload
    if (req.file) {
      const imageUrl = await uploadImage(req.file, 'events');
      req.body.image = imageUrl;
    }

    // 6️⃣ Parse tickets
    let ticketsInput = [];
    if (req.body.tickets) {
      ticketsInput = typeof req.body.tickets === 'string'
        ? JSON.parse(req.body.tickets)
        : req.body.tickets;

      // Validate each ticket
      for (const ticket of ticketsInput) {
        if (!ticket.type || ticket.price == null || ticket.quantity == null) {
          return res.status(400).json({
            success: false,
            message: 'Each ticket must have type, price, and quantity'
          });
        }
        if (ticket.price < 0) {
          return res.status(400).json({ success: false, message: 'Ticket price cannot be negative' });
        }
        if (ticket.quantity < 0) {
          return res.status(400).json({ success: false, message: 'Ticket quantity cannot be negative' });
        }

        // Normalize benefits into an array
        if (ticket.benefits && !Array.isArray(ticket.benefits)) {
          ticket.benefits = ticket.benefits
            .split(',')
            .map(b => b.trim())
            .filter(Boolean);
        }
      }
    }

    // 7️⃣ Calculate capacity
    const capacity = ticketsInput.reduce((total, t) => total + t.quantity, 0);

    // 8️⃣ Create event first without tickets
    const eventData = {
      ...req.body,
      tickets: [],
      capacity,
      // CHANGED: category is now the slug string
      category: req.body.category,
      organizer: organizer._id,
      status: 'draft'
    };
    delete eventData.price;

    const event = new Event(eventData);
    await event.save();

    // 9️⃣ Create ticket documents and link them to event
    const ticketDocs = await Promise.all(
      ticketsInput.map(ticket => Ticket.create({
        ...ticket,
        event: event._id,
        available: ticket.quantity,
        salesStart: ticket.salesStart || new Date(),
        salesEnd: ticket.salesEnd || new Date('2100-01-01')
      }))
    );

    // 🔟 Update event with ticket ObjectIds
    event.tickets = ticketDocs.map(t => t._id);
    await event.save();

    // 1️⃣1️⃣ Populate organizer for response
    await event.populate('organizer', 'organizationName');

    const transformedEvent = {
      id: event._id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date?.toISOString().split('T')[0],
      time: event.time,
      venue: event.venue,
      tickets: ticketDocs.map(t => ({
        id: t._id,
        type: t.type,
        price: t.price,
        quantity: t.quantity,
        available: t.available,
        benefits: t.benefits,
        salesStart: t.salesStart,
        salesEnd: t.salesEnd,
        minOrder: t.minOrder,
        maxOrder: t.maxOrder
      })),
      // CHANGED: Category is now the slug, details come from discover schema
      category: validCategory.name,
      organizer: event.organizer.organizationName,
      capacity: event.capacity,
      registered: event.registered,
      featured: event.featured,
      tags: event.tags,
      status: event.status
    };

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: transformedEvent
    });

  } catch (error) {
    console.error('🔥 createEvent error:', error);
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

    // CHANGED: Handle category update if provided (validate against discover schema)
    if (req.body.category) {
      const discoverData = await Discover.findOne({ isActive: true });
      if (discoverData) {
        const validCategory = discoverData.categories.find(cat => 
          cat.slug === req.body.category && cat.isActive
        );
        if (!validCategory) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive category'
          });
        }
      }
      // req.body.category remains as the slug string
    }

    // Handle image upload if present
    if (req.file) {
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
    ).populate('organizer', 'organizationName');

    // Get category details for response
    const discoverData = await Discover.findOne({ isActive: true });
    const discoverCategories = discoverData?.categories || [];
    const categoryDetails = discoverCategories.find(cat => cat.slug === updatedEvent.category);

    const transformedEvent = {
      id: updatedEvent._id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      image: updatedEvent.image,
      date: updatedEvent.date.toISOString().split('T')[0],
      time: updatedEvent.time,
      venue: updatedEvent.venue,
      category: categoryDetails ? categoryDetails.name : updatedEvent.category,
      organizer: updatedEvent.organizer.organizationName,
      capacity: updatedEvent.capacity,
      registered: updatedEvent.registered,
      featured: updatedEvent.featured,
      tags: updatedEvent.tags,
      status: updatedEvent.status || 'draft'
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
    const events = await Event.find({ featured: true, status: 'published' })
      .populate('organizer', 'organizationName')
      .populate('tickets')
      .limit(10);

    // Get discover categories for category info
    const discoverData = await Discover.findOne({ isActive: true });
    const discoverCategories = discoverData?.categories || [];

    const transformedEvents = events.map(event => {
      const categoryDetails = discoverCategories.find(cat => cat.slug === event.category);
      
      return {
        id: event._id,
        title: event.title,
        description: event.description,
        image: event.image,
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        venue: event.venue,
        price: event.tickets && event.tickets.length > 0 ? event.tickets[0].price : 0,
        tickets: event.tickets ? event.tickets.map(ticket => ({
          id: ticket._id,
          type: ticket.type,
          price: ticket.price,
          quantity: ticket.quantity
        })) : [],
        category: categoryDetails ? categoryDetails.name : event.category,
        organizer: event.organizer.organizationName,
        capacity: event.capacity,
        registered: event.registered,
        featured: event.featured,
        tags: event.tags
      };
    });

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



// STORIES FUNCTIONALITY

// Get stories for discover page
const getDiscoverStories = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const stories = await Story.find({ 
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('eventId', 'title image venue date')
    .populate('organizerId', 'organizationName logo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    // Transform stories to match frontend format
    const transformedStories = stories.map(story => ({
      id: story._id.toString(),
      username: story.organizerId?.organizationName || 'Event Organizer',
      avatar: story.organizerId?.logo || '/default-avatar.png',
      timeAgo: getTimeAgo(story.createdAt),
      viewed: false, // This would be tracked per user in a real implementation
      slides: story.slides.map(slide => ({
        type: slide.type,
        media: slide.media,
        duration: slide.duration || 5000,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        cta: slide.cta,
        link: slide.link
      }))
    }));

    res.status(200).json({
      success: true,
      data: transformedStories
    });
  } catch (error) {
    console.error("❌ getDiscoverStories error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get stories for organizer
const getOrganizerStories = async (req, res) => {
  try {
    // Get organizer from authenticated user
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    const stories = await Story.find({ organizerId: organizer._id })
      .populate('eventId', 'title image date')
      .populate('organizerId', 'organizationName logo')
      .sort({ createdAt: -1 });

    const transformedStories = stories.map(story => ({
      id: story._id.toString(),
      eventId: {
        id: story.eventId?._id.toString(),
        title: story.eventId?.title
      },
      organizerId: {
        id: story.organizerId?._id.toString(),
        organizationName: story.organizerId?.organizationName,
        logo: story.organizerId?.logo
      },
      slides: story.slides.map(slide => ({
        type: slide.type,
        media: slide.media,
        duration: slide.duration,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        cta: slide.cta,
        link: slide.link
      })),
      isActive: story.isActive,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      views: story.views || 0
    }));

    res.status(200).json({
      success: true,
      data: transformedStories
    });
  } catch (error) {
    console.error("❌ getOrganizerStories error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create a new story
const createStory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get organizer from authenticated user
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    const { eventId, slides, duration = 5000 } = req.body;

    // Verify event belongs to organizer
    const event = await Event.findOne({ 
      _id: eventId, 
      organizer: organizer._id 
    });
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or access denied' 
      });
    }

    // Validate slides
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one slide is required'
      });
    }

    for (const slide of slides) {
      if (!slide.media || !slide.title) {
        return res.status(400).json({
          success: false,
          message: 'Each slide must have media and title'
        });
      }
    }

    const story = new Story({
      eventId,
      organizerId: organizer._id,
      slides: slides.map(slide => ({
        ...slide,
        duration: slide.duration || duration
      })),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.save();
    
    // Populate for response
    await story.populate('eventId', 'title');
    await story.populate('organizerId', 'organizationName logo');

    const transformedStory = {
      id: story._id.toString(),
      eventId: {
        id: story.eventId?._id.toString(),
        title: story.eventId?.title
      },
      organizerId: {
        id: story.organizerId?._id.toString(),
        organizationName: story.organizerId?.organizationName,
        logo: story.organizerId?.logo
      },
      slides: story.slides,
      isActive: story.isActive,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: transformedStory
    });
  } catch (error) {
    console.error("❌ createStory error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update a story
const updateStory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get organizer from authenticated user
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    const story = await Story.findOne({ 
      _id: req.params.id, 
      organizerId: organizer._id 
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or access denied'
      });
    }

    const { slides, duration } = req.body;

    // Update slides if provided
    if (slides && Array.isArray(slides)) {
      for (const slide of slides) {
        if (!slide.media || !slide.title) {
          return res.status(400).json({
            success: false,
            message: 'Each slide must have media and title'
          });
        }
      }
      story.slides = slides.map(slide => ({
        ...slide,
        duration: slide.duration || duration || 5000
      }));
    }

    // Reset expiration when updating
    story.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    story.updatedAt = new Date();

    await story.save();

    await story.populate('eventId', 'title');
    await story.populate('organizerId', 'organizationName logo');

    const transformedStory = {
      id: story._id.toString(),
      eventId: {
        id: story.eventId?._id.toString(),
        title: story.eventId?.title
      },
      organizerId: {
        id: story.organizerId?._id.toString(),
        organizationName: story.organizerId?.organizationName,
        logo: story.organizerId?.logo
      },
      slides: story.slides,
      isActive: story.isActive,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Story updated successfully',
      data: transformedStory
    });
  } catch (error) {
    console.error("❌ updateStory error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    // Get organizer from authenticated user
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    const story = await Story.findOne({ 
      _id: req.params.id, 
      organizerId: organizer._id 
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or access denied'
      });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error("❌ deleteStory error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get stories for a specific event
const getEventStories = async (req, res) => {
  try {
    const stories = await Story.find({ 
      eventId: req.params.eventId,
      isActive: true 
    })
    .populate('eventId', 'title image date')
    .populate('organizerId', 'organizationName logo')
    .sort({ createdAt: -1 });

    const transformedStories = stories.map(story => ({
      id: story._id.toString(),
      username: story.organizerId?.organizationName || 'Event Organizer',
      avatar: story.organizerId?.logo || '/default-avatar.png',
      timeAgo: getTimeAgo(story.createdAt),
      slides: story.slides.map(slide => ({
        type: slide.type,
        media: slide.media,
        duration: slide.duration || 5000,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        cta: slide.cta,
        link: slide.link
      }))
    }));

    res.status(200).json({
      success: true,
      data: transformedStories
    });
  } catch (error) {
    console.error("❌ getEventStories error:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
};
module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
  registerForEvent,
  // Story functions
  getDiscoverStories,
  getOrganizerStories,
  createStory,
  updateStory,
  deleteStory,
  getEventStories
};