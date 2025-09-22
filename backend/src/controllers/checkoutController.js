const mongoose = require('mongoose');
const Order = require('../models/Order');
const GuestOrder = require('../models/GuestOrder');
const IssuedTicket = require('../models/IssuedTicket'); // Adjust path to your model
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const {
  validateTicketAvailability,
  reserveTickets,
  confirmTicketPurchase,
  releaseReservedTickets,
  createIssuedTickets,
  sendTicketsEmail
} = require('../utils/helpers');

// Helper function to process M-Pesa payments
const processMpesaPayment = async (order, paymentDetails) => {
  try {
    console.log('Processing M-Pesa payment for order:', order._id);
    
    // Implement your M-Pesa integration here
    // This is a mock implementation - replace with actual M-Pesa API calls
    
    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.2; // 80% success rate for demo
    
    if (paymentSuccess) {
      console.log('M-Pesa payment successful for order:', order._id);
      return true;
    } else {
      console.log('M-Pesa payment failed for order:', order._id);
      return false;
    }
  } catch (error) {
    console.error('M-Pesa payment processing error:', error);
    return false;
  }
};

// Helper function to process card payments
const processCardPayment = async (order, paymentDetails) => {
  try {
    console.log('Processing card payment for order:', order._id);
    
    // Implement your card payment integration here
    // This is a mock implementation - replace with actual payment gateway API calls
    
    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (paymentSuccess) {
      console.log('Card payment successful for order:', order._id);
      return true;
    } else {
      console.log('Card payment failed for order:', order._id);
      return false;
    }
  } catch (error) {
    console.error('Card payment processing error:', error);
    return false;
  }
};

const checkoutController = {
  // Create guest order
  createGuestOrder: async (req, res) => {
    try {
      console.log('📥 Received guest order request body:', req.body);

      const { customerEmail, customerName, items } = req.body;

      console.log('➡️ Parsed data:', {
        customerEmail,
        customerName,
        itemsCount: items?.length || 0
      });

      // Check if email already has an account
      const existingUser = await User.findOne({ email: customerEmail.toLowerCase() });
      if (existingUser) {
        console.log(`⚠️ Account already exists for email: ${customerEmail}`);
        return res.status(400).json({
          success: false,
          message: 'An account already exists with this email. Please sign in.',
          hasAccount: true
        });
      }

      // Validate items
      for (const item of items) {
        console.log(`🔍 Validating item:`, item);

        // Validate event
        const event = await Event.findById(item.event);
        if (!event) {
          console.log(`❌ Event not found for ID: ${item.event}`);
          return res.status(400).json({
            success: false,
            message: `Event not found: ${item.eventTitle || 'Unknown'}`
          });
        }

        // Validate ticket (if provided)
        console.log('Ticket id for validation:', item.ticket); // Log the ticket id being used
        const ticket = await Ticket.findById(item.ticket);
        if (!ticket) {
          console.log(`❌ Ticket not found for ID: ${item.ticket}`);
          return res.status(400).json({
            success: false,
            message: `Ticket not found for event ${event.title}`
          });
        }

        // Check ticket belongs to this event
        if (ticket.event.toString() !== event._id.toString()) {
          console.log(`❌ Ticket ${ticket._id} does not belong to event ${event._id}`);
          return res.status(400).json({
            success: false,
            message: `Ticket does not belong to the selected event`
          });
        }

        // Check ticket availability
        if (ticket.quantity < item.quantity) {
          console.log(
            `❌ Not enough tickets of type "${ticket.type}". Requested: ${item.quantity}, Available: ${ticket.quantity}`
          );
          return res.status(400).json({
            success: false,
            message: `Not enough tickets available for type ${ticket.type}`
          });
        }

        console.log(`✅ Event & Ticket validated: ${event.title}, ${ticket.type}, Quantity OK`);
      }

      // Create temporary guest order
      const guestOrder = new GuestOrder({
        customerEmail: customerEmail.toLowerCase(),
        customerName,
        items,
        status: 'pending'
      });

      await guestOrder.save();
      console.log('📝 Guest order saved:', guestOrder._id);

      res.status(201).json({
        success: true,
        order: guestOrder,
        message: 'Guest order created successfully'
      });

    } catch (error) {
      console.error('💥 Create guest order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create guest order'
      });
    }
  },


  // In checkoutController.js

// Get order by ID
// Get order by ID
getOrderById: async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ✅ Check if this email is already linked to a registered user
    let hasAccount = false;
    let userId = null;

    if (order.customerEmail) {
      const existingUser = await User.findOne({ email: order.customerEmail });
      if (existingUser) {
        hasAccount = true;
        userId = existingUser._id;
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        hasAccount,
        userId
      }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
},


  // Get guest order
  getGuestOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const guestOrder = await GuestOrder.findById(orderId);

      if (!guestOrder) {
        return res.status(404).json({
          success: false,
          message: 'Guest order not found'
        });
      }

      if (guestOrder.isExpired()) {
        return res.status(400).json({
          success: false,
          message: 'Guest order has expired'
        });
      }

      res.json({
        success: true,
        order: guestOrder
      });

    } catch (error) {
      console.error('Get guest order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve guest order'
      });
    }
  },

  // Get guest orders by email
  getGuestOrdersByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const guestOrders = await GuestOrder.find({
        customerEmail: email.toLowerCase(),
        status: 'pending'
      });

      res.json({
        success: true,
        orders: guestOrders
      });

    } catch (error) {
      console.error('Get guest orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve guest orders'
      });
    }
  },

  // Convert guest order to user order
  convertGuestToUserOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { userId } = req.body;

      const guestOrder = await GuestOrder.findById(orderId);
      if (!guestOrder) {
        return res.status(404).json({
          success: false,
          message: 'Guest order not found'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update guest order status
      guestOrder.status = 'converted';
      await guestOrder.save();

      // Find and update any orders with this email to link to user
      await Order.updateMany(
        { 
          customerEmail: guestOrder.customerEmail,
          isGuestOrder: true,
          convertedToUser: false 
        },
        { 
          userId: user._id,
          convertedToUser: true,
          isGuestOrder: false 
        }
      );

      res.json({
        success: true,
        message: 'Guest orders converted to user account successfully'
      });

    } catch (error) {
      console.error('Convert guest order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert guest order'
      });
    }
  },

  // Send claim email
  sendClaimEmail: async (req, res) => {
    try {
      const { email, orderId } = req.body;
      
      // Generate claim token
      const claimToken = jwt.sign(
        { email, orderId, type: 'account_claim' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send email with claim link
      await sendEmail({
        to: email,
        subject: 'Claim Your Account & Access Your Tickets',
        html: `
          <h2>Welcome to Our Event Platform!</h2>
          <p>You recently made a purchase as a guest. To access your tickets and manage your orders, please claim your account:</p>
          <a href="${process.env.FRONTEND_URL}/claim-account?token=${claimToken}&email=${email}">
            Claim Your Account
          </a>
          <p>This link will expire in 7 days.</p>
        `
      });

      res.json({
        success: true,
        message: 'Claim email sent successfully'
      });

    } catch (error) {
      console.error('Send claim email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send claim email'
      });
    }
  },

  // Validate claim token
  validateClaimToken: async (req, res) => {
    try {
      const { token, email } = req.query;

      if (!token || !email) {
        return res.status(400).json({
          success: false,
          message: 'Token and email are required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.email !== email.toLowerCase() || decoded.type !== 'account_claim') {
        return res.status(400).json({
          success: false,
          message: 'Invalid claim token'
        });
      }

      res.json({
        success: true,
        valid: true,
        email: decoded.email,
        orderId: decoded.orderId
      });

    } catch (error) {
      console.error('Validate claim token error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired claim token'
      });
    }
  },

  // Claim account from guest order
  claimAccount: async (req, res) => {
    try {
      const { token, email, password, firstName, lastName } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.email !== email.toLowerCase() || decoded.type !== 'account_claim') {
        return res.status(400).json({
          success: false,
          message: 'Invalid claim token'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account already exists with this email'
        });
      }

      // Create user account
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        name: `${firstName} ${lastName}`,
        userType: 'customer'
      });

      // Convert guest orders to user orders
      await Order.updateMany(
        { 
          customerEmail: email.toLowerCase(), 
          isGuestOrder: true,
          convertedToUser: false 
        },
        { 
          userId: user._id,
          convertedToUser: true,
          isGuestOrder: false 
        }
      );

      // Generate auth token
      const authToken = user.getSignedJwtToken();

      res.json({
        success: true,
        token: authToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType
        },
        message: 'Account claimed successfully'
      });

    } catch (error) {
      console.error('Claim account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim account'
      });
    }
  },

  // Process checkout (updated for both authenticated and guest users)
processCheckout: async (req, res) => {
  try {
    console.log('Checkout payload received from frontend:', req.body);

    // 🔹 Transform frontend payload
    const checkoutData = req.body;
    
    if (checkoutData.customerInfo) {
      const [firstName, ...rest] = checkoutData.customerInfo.fullName.split(" ");
      req.body.billingAddress = {
        firstName: firstName || '',
        lastName: rest.join(" ") || '',
        email: checkoutData.customerInfo.email,
        phone: checkoutData.customerInfo.phone
      };
    }

    if (checkoutData.mpesaPhone) {
      req.body.paymentDetails = {
        phone: checkoutData.mpesaPhone
      };
    }

    // 🔹 Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = req.user || null;
    const isGuest = !user;

    // 🔹 VALIDATE TICKET AVAILABILITY
    await validateTicketAvailability(checkoutData.items);

    // 🔹 RESERVE TICKETS TEMPORARILY
    await reserveTickets(checkoutData.items);

    let order;

    try {
      // Create order (your existing code)
      if (isGuest) {
        order = new Order({
          customerEmail: checkoutData.customerInfo.email,
          customerName: checkoutData.customerInfo.fullName,
          items: checkoutData.items,
          billingAddress: req.body.billingAddress,
          paymentMethod: checkoutData.paymentMethod,
          paymentDetails: req.body.paymentDetails,
          discountCode: checkoutData.discountCode,
          totals: checkoutData.totals,
          isGuestOrder: true,
          status: 'pending'
        });
      } else {
        order = new Order({
          userId: user._id,
          customerEmail: user.email,
          customerName: user.name,
          items: checkoutData.items,
          billingAddress: req.body.billingAddress,
          paymentMethod: checkoutData.paymentMethod,
          paymentDetails: req.body.paymentDetails,
          discountCode: checkoutData.discountCode,
          totals: checkoutData.totals,
          isGuestOrder: false,
          status: 'pending'
        });
      }

      await order.save();
      console.log('Order payload being saved:', order);

      // Process payment
      let paymentSuccess = false;
      
      if (checkoutData.paymentMethod === 'mpesa') {
        paymentSuccess = await processMpesaPayment(order, req.body.paymentDetails);
      } else if (checkoutData.paymentMethod === 'card') {
        paymentSuccess = await processCardPayment(order, req.body.paymentDetails);
      } else {
        paymentSuccess = true;
      }
      
      if (paymentSuccess) {
        // 🔹 PAYMENT SUCCESSFUL
        order.status = 'completed';
        await order.save();

        // 🔹 CONFIRM TICKET PURCHASE
        await confirmTicketPurchase(order.items);

        const currentDate = new Date();
        let eventsAttendedIncrement = 0;
        let upcomingEventsIncrement = 0;

        // Update event ticket counts
        for (const item of order.items) {
          await Event.findByIdAndUpdate(
            item.eventId,
            { 
              $inc: { 
                availableTickets: -item.quantity,
                ticketsSold: item.quantity
              }
            }
          );

          // Calculate event stats for authenticated users
          if (user) {
            const event = await Event.findById(item.eventId);
            const eventDate = new Date(event.date);
            const isPastEvent = eventDate < currentDate;
            
            if (isPastEvent) {
              eventsAttendedIncrement += 1;
            } else {
              upcomingEventsIncrement += 1;
            }
          }
        }

        // Update user event counts if authenticated
        if (user && (eventsAttendedIncrement > 0 || upcomingEventsIncrement > 0)) {
          await User.findByIdAndUpdate(
            user._id,
            {
              $inc: {
                eventsAttended: eventsAttendedIncrement,
                upcomingEvents: upcomingEventsIncrement
              }
            }
          );
        }

        // 🔹 CREATE ISSUED TICKETS
        const issuedTickets = [];
        
        for (const item of order.items) {
          // Get event details
          const event = await Event.findById(item.eventId);
          if (!event) {
            throw new Error(`Event not found for ID: ${item.eventId}`);
          }

          // For each quantity in the item, create a separate ticket
          for (let i = 0; i < item.quantity; i++) {
            const ticketCode = 'TICKET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            // Generate a real QR code image (base64) from the ticketCode
            const qrCodeImage = await QRCode.toDataURL(ticketCode);

            const issuedTicketData = {
              ticketId: item.ticketId || new mongoose.Types.ObjectId(), // Use existing or create new
              orderId: order._id,
              userId: user ? user._id : null,
              eventId: event._id,
              eventTitle: event.title,
              eventVenue: event.venue,
              ticketCode: ticketCode,
              qrCode: qrCodeImage, // <-- store base64 image here
              attendeeName: order.customerName,
              attendeeEmail: order.customerEmail,
              price: item.price,
              ticketType: item.ticketType || item.name || 'General Admission',
              isUsed: false,
              usedAt: null,
              createdAt: new Date()
            };

            // Create and save the issued ticket
            const issuedTicket = new IssuedTicket(issuedTicketData);
            await issuedTicket.save();
            
            issuedTickets.push(issuedTicket);
          }
        }

        console.log('Constructed issuedTickets:', issuedTickets);

        // Check if account already exists for guest orders
        let existingUser = null;
        if (order.isGuestOrder) {
          existingUser = await User.findOne({ email: order.customerEmail.toLowerCase() });
        }

        // 🔹 SEND TICKETS EMAIL
        await sendTicketsEmail(order, user || existingUser, issuedTickets);

        // Get updated user data if authenticated
        let updatedUser = null;
        if (user) {
          updatedUser = await User.findById(user._id);
        }

        // Prepare response
        const responseData = {
          success: true,
          message: 'Order placed successfully!',
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            isGuestOrder: order.isGuestOrder,
            hasAccount: !!existingUser || !!user,
            ticketCount: issuedTickets.length,
            ...((existingUser || user) ? {
              user: {
                id: (user || existingUser)._id,
                name: (user || existingUser).name,
                email: (user || existingUser).email,
                phone: (user || existingUser).phone,
                eventsAttended: updatedUser?.eventsAttended || existingUser?.eventsAttended || 0,
                upcomingEvents: updatedUser?.upcomingEvents || existingUser?.upcomingEvents || 0
              }
            } : {
              guestInfo: {
                name: order.customerName,
                email: order.customerEmail,
                phone: order.billingAddress?.phone
              }
            })
          }
        };

        res.status(201).json(responseData);

      } else {
        // 🔹 PAYMENT FAILED - RELEASE RESERVED TICKETS
        order.status = 'failed';
        await order.save();
        await releaseReservedTickets(order.items);
        
        res.status(400).json({
          success: false,
          message: 'Payment processing failed. Please try again.'
        });
      }

    } catch (error) {
      // 🔹 RELEASE TICKETS ON ANY ERROR
      await releaseReservedTickets(checkoutData.items);
      throw error;
    }

  } catch (error) {
    console.error('Checkout error:', error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('available') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to process payment. Please try again.'
    });
  }
},

  // Apply discount code
  applyDiscount: async (req, res) => {
    try {
      const { discountCode } = req.body;

      if (!discountCode || !discountCode.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Discount code is required'
        });
      }

      // Validate discount code (replace with actual database lookup)
      const validDiscounts = {
        'WELCOME10': { 
          percentage: 10, 
          description: 'Welcome discount (10% off)',
          active: true
        },
        'SUMMER25': { 
          percentage: 25, 
          description: 'Summer special (25% off)',
          active: true
        }
      };

      const discount = validDiscounts[discountCode.toUpperCase()];
      
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Invalid discount code'
        });
      }

      if (!discount.active) {
        return res.status(400).json({
          success: false,
          message: 'This discount code is no longer active'
        });
      }

      res.status(200).json({
        success: true,
        message: `Discount applied: ${discount.description}`,
        discount: {
          code: discountCode.toUpperCase(),
          percentage: discount.percentage,
          description: discount.description
        }
      });

    } catch (error) {
      console.error('Apply discount error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply discount code'
      });
    }
  },

  // Get checkout summary
  getCheckoutSummary: async (req, res) => {
    try {
      // This would typically get cart items from session or database
      // For now, return empty summary as frontend handles its own cart
      res.status(200).json({
        success: true,
        summary: {
          itemCount: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
          items: []
        }
      });

    } catch (error) {
      console.error('Get checkout summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get checkout summary'
      });
    }
  }
};

module.exports = checkoutController;