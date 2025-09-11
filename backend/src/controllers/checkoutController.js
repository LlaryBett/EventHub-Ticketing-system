const Order = require('../models/Order');
const GuestOrder = require('../models/GuestOrder');
const Event = require('../models/Event');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');

const checkoutController = {
  // Create guest order
  createGuestOrder: async (req, res) => {
    try {
      const { customerEmail, customerName, items } = req.body;

      // Check if email already has an account
      const existingUser = await User.findOne({ email: customerEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account already exists with this email. Please sign in.',
          hasAccount: true
        });
      }

      // Validate items
      for (const item of items) {
        const event = await Event.findById(item.eventId);
        if (!event) {
          return res.status(400).json({
            success: false,
            message: `Event not found: ${item.title}`
          });
        }
        
        if (event.availableTickets < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough tickets available for ${event.title}`
          });
        }
      }

      // Create temporary guest order
      const guestOrder = new GuestOrder({
        customerEmail: customerEmail.toLowerCase(),
        customerName,
        items,
        status: 'pending'
      });

      await guestOrder.save();

      res.status(201).json({
        success: true,
        order: guestOrder,
        message: 'Guest order created successfully'
      });

    } catch (error) {
      console.error('Create guest order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create guest order'
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const checkoutData = req.body;
      const isGuest = req.isGuest;
      const user = req.user;

      // Validate items and ticket availability
      for (const item of checkoutData.items) {
        const event = await Event.findById(item.eventId);
        if (!event) {
          return res.status(400).json({
            success: false,
            message: `Event not found: ${item.title}`
          });
        }
        
        if (event.availableTickets < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough tickets available for ${event.title}`
          });
        }
      }

      let order;

      if (isGuest && checkoutData.guestOrderId) {
        // Process guest order
        const guestOrder = await GuestOrder.findById(checkoutData.guestOrderId);
        if (!guestOrder) {
          return res.status(404).json({
            success: false,
            message: 'Guest order not found'
          });
        }

        // Create final order from guest order
        order = new Order({
          customerEmail: guestOrder.customerEmail,
          customerName: guestOrder.customerName,
          items: guestOrder.items,
          billingAddress: checkoutData.billingAddress,
          paymentMethod: checkoutData.paymentMethod,
          paymentDetails: checkoutData.paymentDetails,
          discountCode: checkoutData.discountCode,
          totals: checkoutData.totals,
          isGuestOrder: true,
          status: 'completed'
        });

        // Update guest order status
        guestOrder.status = 'completed';
        await guestOrder.save();

      } else if (user) {
        // Process authenticated user order
        order = new Order({
          userId: user._id,
          customerEmail: user.email,
          customerName: user.name,
          items: checkoutData.items,
          billingAddress: checkoutData.billingAddress,
          paymentMethod: checkoutData.paymentMethod,
          paymentDetails: checkoutData.paymentDetails,
          discountCode: checkoutData.discountCode,
          totals: checkoutData.totals,
          isGuestOrder: false,
          status: 'completed'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid checkout request'
        });
      }

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
      }

      // Save order
      await order.save();

      // Send confirmation email
      await sendEmail({
        to: order.customerEmail,
        subject: 'Order Confirmation',
        html: `
          <h2>Thank you for your order!</h2>
          <p>Your order #${order.orderNumber} has been confirmed.</p>
          ${order.isGuestOrder ? `
          <p>You checked out as a guest. <a href="${process.env.FRONTEND_URL}/claim-account?email=${order.customerEmail}">Claim your account</a> to access your tickets anytime.</p>
          ` : ''}
        `
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          isGuestOrder: order.isGuestOrder
        }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment. Please try again.'
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