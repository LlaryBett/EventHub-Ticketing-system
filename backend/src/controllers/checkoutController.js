const mongoose = require('mongoose');
const Order = require('../models/Order');
const mpesaService = require('../utils/mpesaService');
const MpesaTransaction = require('../models/MpesaTransaction');
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
    
    const phoneNumber = paymentDetails?.phone;
    if (!phoneNumber) {
      throw new Error('Phone number is required for M-Pesa payment');
    }

    const stkResponse = await mpesaService.stkPush(
      phoneNumber,
      order.totalAmount,
      `ORDER${order.orderNumber}`,
      `Tickets Purchase`
    );

    console.log('✅ M-Pesa STK Push Response:', stkResponse);
    console.log('📍 Callback URL configured:', process.env.MPESA_CALLBACK_URL);

    if (stkResponse.ResponseCode === '0') {
      const mpesaTransaction = new MpesaTransaction({
        orderId: order._id,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        amount: order.totalAmount,
        phoneNumber: phoneNumber,
        status: 'pending'
      });

      await mpesaTransaction.save();

      return {
        success: true,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        message: 'Payment request sent to your phone. Please enter your M-Pesa PIN to complete payment.'
      };
    } else {
      throw new Error(stkResponse.ResponseDescription || 'Failed to initiate M-Pesa payment');
    }
  } catch (error) {
    console.error('M-Pesa payment processing error:', error);
    throw error;
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

  // Convert guest to user order
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

      await validateTicketAvailability(checkoutData.items);
      await reserveTickets(checkoutData.items);

      let order;

      try {
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
            totalAmount: checkoutData.totals.total,
            isGuestOrder: true,
            status: 'pending',
            paymentStatus: 'pending'
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
            totalAmount: checkoutData.totals.total,
            isGuestOrder: false,
            status: 'pending',
            paymentStatus: 'pending'
          });
        }

        await order.save();
        console.log('Order created:', order._id);

        let paymentResponse = null;
        
        if (checkoutData.paymentMethod === 'mpesa') {
          paymentResponse = await processMpesaPayment(order, req.body.paymentDetails);
          // For M-Pesa, payment is pending until callback is received
          res.status(201).json({
            success: true,
            message: paymentResponse.message,
            order: {
              id: order._id,
              orderNumber: order.orderNumber,
              checkoutRequestID: paymentResponse.checkoutRequestID,
              paymentMethod: 'mpesa',
              status: 'pending',  // Changed from 'pending_payment' to 'pending' to match callback
              totalAmount: order.totalAmount
            }
          });
        } else if (checkoutData.paymentMethod === 'card') {
          paymentResponse = await processCardPayment(order, req.body.paymentDetails);
          if (paymentResponse) {
            // Card payment successful - process immediately
            order.status = 'completed';
            order.paymentStatus = 'completed';
            order.paidAt = new Date();
            await order.save();

            await confirmTicketPurchase(order.items);
            // ...rest of completion logic...
            
            res.status(201).json({
              success: true,
              message: 'Payment successful and order completed!',
              order: { id: order._id, orderNumber: order.orderNumber }
            });
          } else {
            order.status = 'failed';
            order.paymentStatus = 'failed';
            await order.save();
            await releaseReservedTickets(order.items);
            
            res.status(400).json({
              success: false,
              message: 'Card payment failed. Please try again.'
            });
          }
        } else {
          res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: { id: order._id, orderNumber: order.orderNumber }
          });
        }

      } catch (error) {
        await releaseReservedTickets(checkoutData.items);
        throw error;
      }

    } catch (error) {
      console.error('Checkout error:', error);
      const statusCode = error.message.includes('available') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to process payment'
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
  },

  // Check M-Pesa payment status - UPDATED VERSION
  checkPaymentStatus: async (req, res) => {
    try {
      const { checkoutRequestID } = req.params;

      const transaction = await MpesaTransaction.findOne({ checkoutRequestID });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const order = await Order.findById(transaction.orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found for this transaction'
        });
      }

      // 🔄 If transaction is pending or processing, query M-Pesa directly for latest status
      if (transaction.status === 'pending' || transaction.status === 'processing') {
        console.log('⏳ Transaction status:', transaction.status, ', querying M-Pesa status...');
        try {
          const mpesaStatus = await mpesaService.checkTransactionStatus(checkoutRequestID);
          console.log('M-Pesa query response:', mpesaStatus);

          // Convert resultCode to string for consistent comparison
          const resultCodeStr = mpesaStatus.ResultCode?.toString();
          
          // Update transaction and order based on M-Pesa response
          if (resultCodeStr === '0') {
            console.log('✅ M-Pesa confirms payment successful');
            transaction.status = 'completed';
            transaction.resultCode = mpesaStatus.ResultCode;
            transaction.resultDesc = mpesaStatus.ResultDesc;
            await transaction.save();

            order.status = 'completed';
            order.paymentStatus = 'completed';
            order.paidAt = new Date();
            await order.save();

            // Confirm ticket purchase
            await confirmTicketPurchase(order.items);
          } 
          // Processing states
          else if (['4999', '500001', '500000', '2001'].includes(resultCodeStr)) {
            console.log('⏳ M-Pesa: Transaction still processing');
            transaction.status = 'processing';
            transaction.resultCode = mpesaStatus.ResultCode;
            transaction.resultDesc = mpesaStatus.ResultDesc;
            await transaction.save();

            order.paymentStatus = 'processing';
            await order.save();
          }
          // Cancelled
          else if (resultCodeStr === '1032' || resultCodeStr === '1') {
            console.log('⚠️ M-Pesa: Payment cancelled');
            transaction.status = 'cancelled';
            transaction.resultCode = mpesaStatus.ResultCode;
            transaction.resultDesc = 'User cancelled';
            await transaction.save();

            order.paymentStatus = 'cancelled';
            order.status = 'pending';
            await order.save();

            // Release reserved tickets
            await releaseReservedTickets(order.items);
          }
          // Insufficient funds
          else if (resultCodeStr === '2006') {
            console.log('❌ M-Pesa: Insufficient funds');
            transaction.status = 'failed';
            transaction.resultCode = mpesaStatus.ResultCode;
            transaction.resultDesc = mpesaStatus.ResultDesc || 'Insufficient funds';
            await transaction.save();

            order.paymentStatus = 'failed';
            order.status = 'pending';
            await order.save();

            // Release reserved tickets
            await releaseReservedTickets(order.items);
          }
          // Other failures
          else {
            console.log('❌ M-Pesa: Payment failed');
            transaction.status = 'failed';
            transaction.resultCode = mpesaStatus.ResultCode;
            transaction.resultDesc = mpesaStatus.ResultDesc || 'Payment failed';
            await transaction.save();

            order.paymentStatus = 'failed';
            order.status = 'pending';
            await order.save();

            // Release reserved tickets
            await releaseReservedTickets(order.items);
          }
        } catch (queryError) {
          console.error('Error querying M-Pesa status:', queryError.message);
          // Continue with transaction status from DB
        }
      }

      // Get updated order after potential changes
      const updatedOrder = await Order.findById(transaction.orderId);

      // Ensure statuses are synchronized
      if (transaction.status !== updatedOrder.paymentStatus) {
        console.log(`⚠️ Status mismatch detected: transaction=${transaction.status}, order=${updatedOrder.paymentStatus}`);
        
        // Sync order status with transaction status
        updatedOrder.paymentStatus = transaction.status;
        
        // Update order status based on payment status
        if (transaction.status === 'completed') {
          updatedOrder.status = 'completed';
        } else if (transaction.status === 'cancelled' || transaction.status === 'failed') {
          updatedOrder.status = 'pending';
        } else if (transaction.status === 'processing') {
          updatedOrder.status = 'pending';
        }
        
        await updatedOrder.save();
        console.log('✅ Statuses synchronized');
      }

      res.status(200).json({
        success: true,
        checkoutRequestID: checkoutRequestID,
        status: transaction.status,           // Transaction status
        paymentStatus: transaction.status,    // Now matches transaction status
        resultCode: transaction.resultCode,
        resultDesc: transaction.resultDesc,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
        amount: transaction.amount,
        order: {
          id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status
        }
      });
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  },
};

module.exports = checkoutController;