// C:\Users\Admin\E-Ticket Application\backend\src\controllers\userController.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
// In userController.js
const IssuedTicket = require('../models/IssuedTicket'); // make sure this path is correct
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Generate JWT Token (needed for updatePassword)
const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Send response with token (needed for updatePassword)
const sendTokenResponse = (user, statusCode, res, userType) => {
  const token = generateToken(user._id, userType);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: user,
    userType
  });
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    console.log("🔹 getMe called by user:", req.user.id);

    let userData = await User.findById(req.user.id);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log("✅ User fetched:", userData.email);

    const now = new Date();
    console.log("📌 Current time:", now);

    // --- Fetch user orders ---
    const userOrders = await Order.find({ userId: req.user.id })
      .populate("items.eventId");
    console.log("📦 Orders found:", userOrders.length);

    // --- Past Events ---
    const pastEventsCount = userOrders.filter(order =>
      order.items.some(item =>
        item.eventId?.date ? new Date(item.eventId.date) < now : false
      )
    ).length;
    console.log("🎟 Past events count:", pastEventsCount);

    // --- Upcoming Events ---
    const upcomingEventsCount = userOrders.filter(order =>
      order.items.some(item =>
        item.eventId?.date ? new Date(item.eventId.date) >= now : false
      )
    ).length;
    console.log("📅 Upcoming events count:", upcomingEventsCount);

    // --- Organizer-specific ---
    if (req.user.userType === "organizer") {
      console.log("👔 User is an organizer, fetching profile...");
      const organizerProfile = await Organizer.findOne({ userId: req.user.id });
      if (!organizerProfile) {
        console.log("⚠️ No organizer profile found for this user");
      } else {
        console.log("🧑‍💼 Organizer profile found:", organizerProfile._id);

        // Fetch events owned by this organizer
        const events = await Event.find({
          organizer: organizerProfile._id
        }).populate('tickets').sort({ createdAt: -1 });
        console.log("📊 Events found:", events.length);

        // Get all event IDs for ticket lookup
        const eventIds = events.map(e => e._id);

        // Fetch issued tickets for these events
        const tickets = await IssuedTicket.find({
          eventId: { $in: eventIds },
        }).sort({ createdAt: -1 });
        console.log("🎫 Tickets issued:", tickets.length);

        // --- Date ranges for growth calculation ---
        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(currentDate.getTime() - (60 * 24 * 60 * 60 * 1000));

        // --- Revenue Trend (Last 7 days) ---
        const revenueTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(currentDate.getTime() - (i * 24 * 60 * 60 * 1000));
          const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
          
          const dayTickets = tickets.filter(ticket => 
            new Date(ticket.createdAt) >= startOfDay && 
            new Date(ticket.createdAt) <= endOfDay
          );
          
          const dayRevenue = dayTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
          
          revenueTrend.push({
            date: startOfDay.toISOString().split('T')[0], // YYYY-MM-DD format
            revenue: dayRevenue,
            tickets: dayTickets.length
          });
        }

        // --- Event Performance ---
        const eventPerformance = events.map(event => {
          const eventTickets = tickets.filter(
            t => t.eventId.toString() === event._id.toString()
          );
          
          const revenue = eventTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
          const attendees = eventTickets.length;
          
          // Calculate capacity utilization
          const capacityUtilization = event.capacity > 0 
            ? Math.round((attendees / event.capacity) * 100) 
            : 0;

          // Get ticket type breakdown
          const ticketBreakdown = {};
          eventTickets.forEach(ticket => {
            ticketBreakdown[ticket.ticketType] = (ticketBreakdown[ticket.ticketType] || 0) + 1;
          });

          return {
            eventId: event._id,
            title: event.title,
            date: event.date,
            venue: event.venue,
            capacity: event.capacity,
            attendees,
            revenue,
            capacityUtilization,
            ticketBreakdown,
            isUpcoming: new Date(event.date) > now,
            createdAt: event.createdAt
          };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        // --- Recent Events (Last 5 events) ---
        const recentEvents = eventPerformance.slice(0, 5).map(event => ({
          eventId: event.eventId,
          title: event.title,
          date: event.date,
          venue: event.venue,
          attendees: event.attendees,
          revenue: event.revenue,
          capacityUtilization: event.capacityUtilization,
          isUpcoming: event.isUpcoming
        }));

        // --- Current period (last 30 days) ---
        const currentPeriodTickets = tickets.filter(ticket => 
          new Date(ticket.createdAt) >= thirtyDaysAgo && 
          new Date(ticket.createdAt) <= currentDate
        );

        // --- Previous period (31-60 days ago) ---
        const previousPeriodTickets = tickets.filter(ticket => 
          new Date(ticket.createdAt) >= sixtyDaysAgo && 
          new Date(ticket.createdAt) < thirtyDaysAgo
        );

        // --- Calculate current period metrics ---
        const currentRevenue = currentPeriodTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
        const currentAttendees = currentPeriodTickets.length;

        // --- Calculate previous period metrics ---
        const previousRevenue = previousPeriodTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
        const previousAttendees = previousPeriodTickets.length;

        // --- Calculate growth percentages ---
        const revenueGrowth = previousRevenue > 0 
          ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
          : currentRevenue > 0 ? 100 : 0;

        const attendeeGrowth = previousAttendees > 0 
          ? Math.round(((currentAttendees - previousAttendees) / previousAttendees) * 100)
          : currentAttendees > 0 ? 100 : 0;

        // --- Overall Analytics calculations ---
        let totalRevenue = 0;
        let totalAttendees = 0;
        let upcomingEvents = 0;

        for (const event of events) {
          // Count attendees for this event
          const eventTickets = tickets.filter(
            t => t.eventId.toString() === event._id.toString()
          );
          const registered = eventTickets.length;

          // Calculate revenue for this event
          const revenue = eventTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);

          console.log(
            `📍 Event: ${event.title} | Registered: ${registered} | Revenue: ${revenue}`
          );

          totalAttendees += registered;
          totalRevenue += revenue;

          // Count upcoming events
          if (new Date(event.date) > now) {
            upcomingEvents++;
          }
        }

        console.log("📊 Total Events:", events.length);
        console.log("💰 Total Revenue:", totalRevenue);
        console.log("👥 Total Attendees:", totalAttendees);
        console.log("📅 Upcoming Events:", upcomingEvents);
        console.log("📈 Revenue Growth:", revenueGrowth + "%");
        console.log("👥 Attendee Growth:", attendeeGrowth + "%");

        // Update organizer profile with current stats
        organizerProfile.totalEvents = events.length;
        organizerProfile.totalRevenue = totalRevenue;
        await organizerProfile.save();

        userData = userData.toObject();
        userData.organizerProfile = organizerProfile;
        userData.analytics = {
          totalEvents: events.length,
          totalRevenue,
          totalAttendees,
          upcomingEvents,
          revenueGrowth,
          attendeeGrowth,
          currentPeriodRevenue: currentRevenue,
          previousPeriodRevenue: previousRevenue,
          currentPeriodAttendees: currentAttendees,
          previousPeriodAttendees: previousAttendees,
          revenueTrend,
          eventPerformance,
          recentEvents
        };
      }
    } else {
      userData = userData.toObject();
    }

    // --- Add attendee overview stats ---
    userData.eventsAttended = pastEventsCount;
    userData.upcomingEvents = upcomingEventsCount;
    userData.joinedDate = userData.createdAt;

    console.log("✅ Final userData prepared:", userData);

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("❌ Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};




// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, user.userType);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update organizer profile
// @route   PUT /api/users/organizer/profile
// @access  Private (organizer only)
exports.updateOrganizerProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user is an organizer
    if (req.user.userType !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Organizer account required.'
      });
    }

    const {
      organizationName,
      businessType,
      businessAddress,
      city,
      state,
      zipCode,
      taxId,
      website
    } = req.body;

    const organizer = await Organizer.findOneAndUpdate(
      { userId: req.user.id },
      {
        organizationName,
        businessType,
        businessAddress,
        city,
        state,
        zipCode,
        taxId: taxId || null,
        website: website || null
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: organizer
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/delete
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is organizer, delete organizer profile first
    if (req.user.userType === 'organizer') {
      await Organizer.findOneAndDelete({ userId: req.user.id });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Your account has been successfully deleted'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get events for a user by ID
// @route   GET /api/v1/user/:id/events
// @access  Private




// 

exports.getUserEvents = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log('➡️ Incoming userId param:', userId);

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('⚠️ Invalid userId:', userId);
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    console.log('✅ Valid MongoDB ObjectId string');

    // Authorization
    console.log('🔑 Logged-in user ID:', req.user.id, 'Type:', req.user.userType);
    if (req.user.id !== userId && req.user.userType !== 'admin') {
      console.warn('❌ Not authorized');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    console.log('✅ User authorized');

    // Fetch all issued tickets for this user
    const tickets = await IssuedTicket.find({ userId })
      .populate('eventId', 'title venue date time image') // populate event details
      .lean();

    console.log('📌 Issued tickets found:', tickets.length);

    // Extract unique event IDs
    const eventIds = [...new Set(tickets.map(t => t.eventId?._id).filter(Boolean))];

    // Fetch events the user is attending
    const events = await Event.find({ _id: { $in: eventIds } }).lean();

    console.log('✅ Events fetched. Count:', events.length);
    if (events.length > 0) console.log('📌 Sample event:', events[0]);

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('🔥 Get user events error caught:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};






// @desc    Get order history for a user
// @route   GET /api/users/:id/orders
// @access  Private (user can only see their own orders)
exports.getUserOrderHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Ensure only the logged-in user or admin can view this
    if (req.user.id.toString() !== userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order history'
      });
    }

    // Fetch orders and populate related events
    const orders = await Order.find({ userId })
      .populate({
        path: 'items.eventId',
        select: 'title date time venue image' // only return useful fields
      })
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get user order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all issued tickets for a user
// @route   GET /api/users/:id/tickets
// @access  Private (user can only see their own tickets)
exports.getUserTickets = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (req.user.id.toString() !== userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tickets'
      });
    }

    // Fetch issued tickets directly
    const issuedTickets = await IssuedTicket.find({ userId })
      .populate('eventId', 'title venue date time image')
      .lean();

    console.log('🔹 Issued tickets fetched:', issuedTickets); // <---- LOG HERE

    res.status(200).json({
      success: true,
      count: issuedTickets.length,
      data: issuedTickets
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// organizer


// @desc    Get all attendees for organizer's events
// @route   GET /api/organizers/attendees
// @access  Private (organizer only)
exports.getOrganizerAttendees = async (req, res, next) => {
  try {
    // Get organizer profile
    const organizerProfile = await Organizer.findOne({ userId: req.user.id });
    
    if (!organizerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Get all events by this organizer
    const events = await Event.find({ organizer: organizerProfile._id })
      .select('_id title date venue image');

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        summary: {
          totalAttendees: 0,
          totalEvents: 0,
          upcomingEvents: 0,
          totalRevenue: 0
        }
      });
    }

    const eventIds = events.map(e => e._id);

    // Get all issued tickets for these events
    const issuedTickets = await IssuedTicket.find({ 
      eventId: { $in: eventIds } 
    })
    .populate('eventId', 'title venue date time image')
    .populate('userId', 'name email phone')
    .lean();

    // Group attendees by event
    const attendeesByEvent = {};
    let totalRevenue = 0;
    const now = new Date();
    let upcomingEvents = 0;

    events.forEach(event => {
      attendeesByEvent[event._id] = {
        eventInfo: {
          id: event._id,
          title: event.title,
          date: event.date,
          venue: event.venue,
          image: event.image,
          isUpcoming: new Date(event.date) > now
        },
        attendees: [],
        ticketsSold: 0,
        revenue: 0
      };

      if (new Date(event.date) > now) {
        upcomingEvents++;
      }
    });

    // Process issued tickets
    issuedTickets.forEach(ticket => {
      const eventId = ticket.eventId._id;
      
      if (attendeesByEvent[eventId]) {
        attendeesByEvent[eventId].attendees.push({
          ticketId: ticket._id,
          ticketCode: ticket.ticketCode,
          ticketType: ticket.ticketType,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          price: ticket.price,
          isUsed: ticket.isUsed,
          usedAt: ticket.usedAt,
          purchaseDate: ticket.createdAt,
          user: ticket.userId ? {
            id: ticket.userId._id,
            name: ticket.userId.name,
            email: ticket.userId.email,
            phone: ticket.userId.phone
          } : null
        });

        attendeesByEvent[eventId].ticketsSold++;
        attendeesByEvent[eventId].revenue += ticket.price;
        totalRevenue += ticket.price;
      }
    });

    // Convert to array format
    const attendeesData = Object.values(attendeesByEvent);

    // Summary statistics
    const summary = {
      totalAttendees: issuedTickets.length,
      totalEvents: events.length,
      upcomingEvents: upcomingEvents,
      totalRevenue: totalRevenue,
      averageTicketPrice: issuedTickets.length > 0 ? totalRevenue / issuedTickets.length : 0
    };

    console.log('🎫 Organizer attendees data:', {
      organizerId: organizerProfile._id,
      eventsFound: events.length,
      ticketsFound: issuedTickets.length,
      totalRevenue
    });

    res.status(200).json({
      success: true,
      data: attendeesData,
      summary
    });

  } catch (error) {
    console.error('Get organizer attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get attendees for a specific event
// @route   GET /api/organizers/events/:eventId/attendees
// @access  Private (organizer only - must own the event)
exports.getEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Get organizer profile
    const organizerProfile = await Organizer.findOne({ userId: req.user.id });
    
    if (!organizerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Verify the event belongs to this organizer
    const event = await Event.findOne({ 
      _id: eventId, 
      organizer: organizerProfile._id 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to view its attendees'
      });
    }

    // Get issued tickets for this event
    const issuedTickets = await IssuedTicket.find({ eventId })
      .populate('userId', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // Format attendees data
    const attendees = issuedTickets.map(ticket => ({
      ticketId: ticket._id,
      ticketCode: ticket.ticketCode,
      ticketType: ticket.ticketType,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      price: ticket.price,
      isUsed: ticket.isUsed,
      usedAt: ticket.usedAt,
      purchaseDate: ticket.createdAt,
      qrCode: ticket.qrCode,
      user: ticket.userId ? {
        id: ticket.userId._id,
        name: ticket.userId.name,
        email: ticket.userId.email,
        phone: ticket.userId.phone,
        profileImage: ticket.userId.profileImage
      } : null
    }));

    // Calculate statistics
    const stats = {
      totalAttendees: attendees.length,
      checkedIn: attendees.filter(a => a.isUsed).length,
      notCheckedIn: attendees.filter(a => !a.isUsed).length,
      totalRevenue: attendees.reduce((sum, a) => sum + a.price, 0),
      ticketTypes: {}
    };

    // Group by ticket type
    attendees.forEach(attendee => {
      if (!stats.ticketTypes[attendee.ticketType]) {
        stats.ticketTypes[attendee.ticketType] = {
          count: 0,
          revenue: 0,
          checkedIn: 0
        };
      }
      stats.ticketTypes[attendee.ticketType].count++;
      stats.ticketTypes[attendee.ticketType].revenue += attendee.price;
      if (attendee.isUsed) {
        stats.ticketTypes[attendee.ticketType].checkedIn++;
      }
    });

    console.log('🎯 Event attendees data:', {
      eventId,
      eventTitle: event.title,
      totalAttendees: attendees.length,
      totalRevenue: stats.totalRevenue
    });

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          venue: event.venue,
          image: event.image
        },
        attendees,
        stats
      }
    });

  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Export attendees data
// @route   GET /api/organizers/events/:eventId/attendees/export
// @access  Private (organizer only)
exports.exportEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { format = 'csv' } = req.query;

    // Get organizer profile
    const organizerProfile = await Organizer.findOne({ userId: req.user.id });
    
    if (!organizerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Verify the event belongs to this organizer
    const event = await Event.findOne({ 
      _id: eventId, 
      organizer: organizerProfile._id 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to export its attendees'
      });
    }

    // Get issued tickets for this event
    const issuedTickets = await IssuedTicket.find({ eventId })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      const csvHeaders = [
        'Ticket Code',
        'Attendee Name', 
        'Attendee Email',
        'Ticket Type',
        'Price',
        'Purchase Date',
        'Check-in Status',
        'Check-in Time',
        'User Name',
        'User Email',
        'User Phone'
      ];

      const csvData = issuedTickets.map(ticket => [
        ticket.ticketCode,
        ticket.attendeeName,
        ticket.attendeeEmail,
        ticket.ticketType,
        ticket.price,
        new Date(ticket.createdAt).toISOString(),
        ticket.isUsed ? 'Checked In' : 'Not Checked In',
        ticket.usedAt ? new Date(ticket.usedAt).toISOString() : '',
        ticket.userId?.name || '',
        ticket.userId?.email || '',
        ticket.userId?.phone || ''
      ]);

      // Simple CSV generation
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title}-attendees.csv"`);
      
      return res.send(csvContent);
    }

    // Default JSON response if format not supported
    res.status(400).json({
      success: false,
      message: 'Unsupported export format. Use ?format=csv'
    });

  } catch (error) {
    console.error('Export attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Check in an attendee
// @route   POST /api/organizers/tickets/:ticketId/checkin
// @access  Private (organizer only)
exports.checkInAttendee = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Get organizer profile
    const organizerProfile = await Organizer.findOne({ userId: req.user.id });
    
    if (!organizerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Get the ticket and verify it belongs to organizer's event
    const ticket = await IssuedTicket.findById(ticketId)
      .populate('eventId', 'title organizer');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify the event belongs to this organizer
    if (ticket.eventId.organizer.toString() !== organizerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in this ticket'
      });
    }

    // Check if already checked in
    if (ticket.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already checked in',
        data: {
          checkedInAt: ticket.usedAt
        }
      });
    }

    // Check in the ticket
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    await ticket.save();

    console.log('✅ Ticket checked in:', {
      ticketCode: ticket.ticketCode,
      attendeeName: ticket.attendeeName,
      eventTitle: ticket.eventId.title
    });

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: {
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        checkedInAt: ticket.usedAt
      }
    });

  } catch (error) {
    console.error('Check in attendee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};