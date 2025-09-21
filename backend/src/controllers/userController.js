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
const emailService = require('../utils/emailService'); // <-- Add this import

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
          previousPeriodAttendees: previousPeriodAttendees,
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






// ADMIN 

// @desc    Get all users (admin only)
// @route   GET /api/users/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages,
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'organizerProfile',
        select: 'organizationName businessType verificationStatus'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional user data if needed
    const orders = await Order.countDocuments({ userId: user._id });
    const tickets = await IssuedTicket.countDocuments({ userId: user._id });

    const userData = user.toObject();
    userData.ordersCount = orders;
    userData.ticketsCount = tickets;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, status } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Deactivate/activate user (admin only)
// @route   PATCH /api/users/admin/users/:id/status
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'suspended', 'deactivated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active, suspended, or deactivated'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is organizer, delete organizer profile first
    if (user.role === 'organizer') {
      await Organizer.findOneAndDelete({ userId: user._id });
    }

    // Delete user's orders and tickets
    await Order.deleteMany({ userId: user._id });
    await IssuedTicket.deleteMany({ userId: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'User account and all associated data have been deleted'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user statistics (admin only)
// @route   GET /api/users/admin/statistics/users
// @access  Private/Admin
exports.getUserStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    
    // Get user growth in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get user registration by month for chart
    const monthlyRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOrganizers,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        newUsersLast30Days: newUsers,
        monthlyRegistrations
      }
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Search users (admin only)
// @route   GET /api/users/admin/users/search/:query
// @access  Private/Admin
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all organizers (admin only)
// @route   GET /api/users/admin/organizers
// @access  Private/Admin
exports.getOrganizers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const organizers = await Organizer.find()
      .populate('userId', 'name email phone status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Organizer.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: organizers.length,
      total,
      totalPages,
      currentPage: page,
      data: organizers
    });
  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get organizer by ID (admin only)
// @route   GET /api/users/admin/organizers/:id
// @access  Private/Admin
exports.getOrganizerById = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .populate('userId', 'name email phone status createdAt')
      .populate({
        path: 'events',
        select: 'title date venue capacity',
        options: { sort: { date: -1 } }
      });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Get organizer statistics
    const eventsCount = await Event.countDocuments({ organizer: organizer._id });
    const totalRevenue = await IssuedTicket.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $match: {
          'event.organizer': organizer._id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);

    const organizerData = organizer.toObject();
    organizerData.eventsCount = eventsCount;
    organizerData.totalRevenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.status(200).json({
      success: true,
      data: organizerData
    });
  } catch (error) {
    console.error('Get organizer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Verify organizer (admin only)
// @route   PATCH /api/users/admin/organizers/:id/verification
// @access  Private/Admin
exports.verifyOrganizer = async (req, res, next) => {
  try {
    const { verificationStatus, verificationNotes } = req.body;

    // Allowed verification statuses
    const allowedStatuses = ['pending', 'verified', 'rejected', 'suspended'];

    if (!allowedStatuses.includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Verification status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    // Safety check for ID
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Organizer ID is required in the URL'
      });
    }

    // Update the organizer
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        verificationNotes: verificationNotes || '',
        verifiedAt: verificationStatus === 'verified' ? new Date() : null
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // --- Notify organizer by email if status changed ---
    if (
      ['verified', 'rejected', 'suspended'].includes(verificationStatus) &&
      organizer.userId &&
      organizer.userId.email
    ) {
      emailService.sendOrganizerVerificationEmail({
        to: organizer.userId.email,
        name: organizer.userId.name,
        organizationName: organizer.organizationName,
        status: verificationStatus,
        notes: verificationNotes
      }).catch(err => {
        console.error('Failed to send organizer verification email:', err);
      });
    }
    // --- End email notification ---

    console.log("Updated organizer:", organizer);

    res.status(200).json({
      success: true,
      message: `Organizer ${verificationStatus} successfully`,
      data: organizer
    });
  } catch (error) {
    console.error('Verify organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};





// @desc    Get comprehensive dashboard stats (admin only)
// @route   GET /api/users/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboardStats = async (req, res, next) => {
  try {
    // Get current date for filtering
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // 1. User Statistics
    const totalUsers = await User.countDocuments();
    const totalOrganizers = await User.countDocuments({ userType: 'organizer' });
    const totalAttendees = await User.countDocuments({ userType: 'user' });
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // 2. Event Statistics
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({
      date: { $gte: now },
      status: 'approved'
    });
    const upcomingEvents = await Event.countDocuments({
      date: { $gte: now },
      status: 'approved'
    });
    const pastEvents = await Event.countDocuments({
      date: { $lt: now }
    });

    // 3. Ticket and Revenue Statistics
    const totalTicketsSold = await IssuedTicket.countDocuments();
    const totalRevenueResult = await IssuedTicket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // 4. Pending Approvals
    const pendingOrganizerVerification = await Organizer.countDocuments({
      verificationStatus: 'pending'
    });
    const pendingEventApprovals = await Event.countDocuments({
      status: 'pending'
    });
    const pendingApprovals = pendingOrganizerVerification + pendingEventApprovals;

    // 5. Recent Events (last 10)
    const recentEvents = await Event.find()
      .populate('organizer', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title date venue image status')
      .lean();

    // 6. Recent Purchases (last 10)
    const recentPurchases = await IssuedTicket.find()
      .populate('eventId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('ticketCode attendeeName price createdAt eventId userId')
      .lean();

    // 7. Top Events by Revenue
    const topEvents = await IssuedTicket.aggregate([
      {
        $group: {
          _id: '$eventId',
          ticketsSold: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Populate event details for top events
    const topEventsWithDetails = await Promise.all(
      topEvents.map(async (event) => {
        const eventDetails = await Event.findById(event._id)
          .select('title image date venue')
          .lean();
        return {
          ...event,
          ...eventDetails
        };
      })
    );

    // 8. Top Organizers by Revenue
    const topOrganizers = await Event.aggregate([
      {
        $lookup: {
          from: 'issuedtickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
      },
      {
        $unwind: '$tickets'
      },
      {
        $group: {
          _id: '$organizer',
          eventsCount: { $sum: 1 },
          totalRevenue: { $sum: '$tickets.price' },
          ticketsSold: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Populate organizer details
    const topOrganizersWithDetails = await Promise.all(
      topOrganizers.map(async (org) => {
        const organizer = await Organizer.findById(org._id)
          .populate('userId', 'name email')
          .select('organizationName userId')
          .lean();
        return {
          ...org,
          name: organizer.userId.name,
          organizationName: organizer.organizationName
        };
      })
    );

    // 9. Ticket Sales Trend (last 7 days)
    const ticketTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const dayTickets = await IssuedTicket.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const dayRevenue = await IssuedTicket.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$price' }
          }
        }
      ]);

      ticketTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        tickets: dayTickets,
        revenue: dayRevenue.length > 0 ? dayRevenue[0].total : 0
      });
    }

    // 10. Events by Category (populate category name)
    const eventsByCategoryAgg = await Event.aggregate([
      {
        
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Populate category names
    let eventsByCategory = [];
    if (eventsByCategoryAgg.length > 0) {
      // If you have a Category model, use it to get names
      const Category = require('../models/Category');
      const categoryIds = eventsByCategoryAgg.map(c => c._id).filter(Boolean);
      const categories = await Category.find({ _id: { $in: categoryIds } }).select('name').lean();
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat._id.toString()] = cat.name;
      });
      eventsByCategory = eventsByCategoryAgg.map(c => ({
        _id: c._id,
        name: categoryMap[c._id?.toString()] || 'Unknown',
        count: c.count
      }));
    }

    // 11. User Growth (last 6 months)
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // 12. Low Stock and Sold Out Events
    const lowStockEvents = await Event.find({
      $expr: { $lt: ['$ticketsSold', { $multiply: ['$capacity', 0.2] }] }, // Less than 20% capacity
      date: { $gte: now },
      status: 'approved'
    }).select('title capacity ticketsSold').limit(5).lean();

    const soldOutEvents = await Event.find({
      $expr: { $gte: ['$ticketsSold', '$capacity'] },
      date: { $gte: now },
      status: 'approved'
    }).select('title capacity ticketsSold').limit(5).lean();

    // 13. New Signups (last 7 days)
    const newSignups = await User.find({
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .select('name email createdAt userType')
    .limit(10)
    .lean();

    // 14. Reported Items (placeholder - you'll need to implement reporting system)
    const reportedItems = 0; // This would come from your reporting system

    // Compile all data
    const dashboardData = {
      // KPI Stats
      totalUsers,
      totalOrganizers,
      totalAttendees,
      totalEvents,
      activeEvents,
      upcomingEvents,
      pastEvents,
      totalTicketsSold,
      totalRevenue,
      pendingApprovals,
      
      // Charts data
      ticketTrend,
      revenueTrend: ticketTrend, // Same as ticket trend but with revenue
      eventsByCategory,
      userGrowth,
      
      // Activity feeds
      recentEvents,
      recentPurchases: recentPurchases.map(purchase => ({
        id: purchase._id,
        eventTitle: purchase.eventId?.title || 'Unknown Event',
        buyerName: purchase.attendeeName || purchase.userId?.name || 'Unknown Buyer',
        quantity: 1, // Each issued ticket represents one purchase
        amount: purchase.price,
        date: purchase.createdAt
      })),
      newSignups,
      supportTickets: [], // Placeholder - implement support ticket system
      
      // Top performers
      topEvents: topEventsWithDetails,
      topOrganizers: topOrganizersWithDetails,
      
      // Alerts
      pendingOrganizerVerification,
      reportedItems,
      lowStockEvents,
      soldOutEvents
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};