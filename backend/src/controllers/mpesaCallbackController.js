const Order = require('../models/Order');
const MpesaTransaction = require('../models/MpesaTransaction');
const IssuedTicket = require('../models/IssuedTicket');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const mpesaService = require('../utils/mpesaService');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const {
  confirmTicketPurchase,
  releaseReservedTickets,
  sendTicketsEmail  // ✅ ADD THIS IMPORT
} = require('../utils/helpers');

const mpesaCallbackController = {
  handleSTKCallback: async (req, res) => {
    try {
      console.log('\n🔔 CALLBACK HANDLER STARTED');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));

      const callbackData = mpesaService.validateCallback(req.body);
      console.log('✅ Callback validated:', {
        success: callbackData.success,
        resultCode: callbackData.resultCode,
        resultDesc: callbackData.resultDesc,
        checkoutRequestID: callbackData.checkoutRequestID
      });
      
      const transaction = await MpesaTransaction.findOne({
        checkoutRequestID: callbackData.checkoutRequestID
      });

      console.log('🔍 Transaction lookup:', transaction ? '✅ FOUND' : '❌ NOT FOUND');
      if (transaction) {
        console.log('Transaction details:', {
          _id: transaction._id,
          orderId: transaction.orderId,
          currentStatus: transaction.status
        });
      }

      if (!transaction) {
        console.error('❌ Transaction not found:', callbackData.checkoutRequestID);
        return res.status(200).json({
          ResultCode: 1,
          ResultDesc: 'Transaction not found'
        });
      }

      // ✅ Set transaction details (only set non-null values to preserve existing data)
      transaction.resultCode = callbackData.resultCode;
      transaction.resultDesc = callbackData.resultDesc;
      
      // For cancellations/failures, these may be null - only update if provided
      if (callbackData.mpesaReceiptNumber) transaction.mpesaReceiptNumber = callbackData.mpesaReceiptNumber;
      if (callbackData.amount) transaction.amount = callbackData.amount;
      if (callbackData.phoneNumber) transaction.phoneNumber = callbackData.phoneNumber;
      if (callbackData.transactionDate) transaction.transactionDate = callbackData.transactionDate;
      
      transaction.processedAt = new Date();

      const order = await Order.findById(transaction.orderId);
      console.log('🔍 Order lookup:', order ? '✅ FOUND' : '❌ NOT FOUND');
      if (order) {
        console.log('Order details:', {
          _id: order._id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          currentPaymentStatus: order.paymentStatus
        });
      }

      if (!order) {
        console.error('❌ Order not found:', transaction.orderId);
        return res.status(200).json({
          ResultCode: 1,
          ResultDesc: 'Order not found'
        });
      }

      // Handle paymentDetails Map properly
      const paymentDetails = order.paymentDetails instanceof Map ? 
        Object.fromEntries(order.paymentDetails) : (order.paymentDetails || {});
      
      // Store M-Pesa response details in paymentDetails
      paymentDetails.resultCode = callbackData.resultCode;
      paymentDetails.resultDesc = callbackData.resultDesc;
      if (callbackData.mpesaReceiptNumber) paymentDetails.mpesaReceiptNumber = callbackData.mpesaReceiptNumber;
      if (callbackData.phoneNumber) paymentDetails.phoneNumber = callbackData.phoneNumber;
      if (callbackData.transactionDate) paymentDetails.transactionDate = callbackData.transactionDate;
      
      order.paymentDetails = paymentDetails;

      // Convert resultCode to string for consistent comparison
      const resultCodeStr = callbackData.resultCode.toString();
      
      // ✅ PAYMENT SUCCESSFUL (ResultCode: 0)
      if (callbackData.success && resultCodeStr === '0') {
        console.log('💰 Processing SUCCESSFUL payment...');
        transaction.status = 'completed';
        await transaction.save();
        console.log('✅ Transaction saved as completed');

        order.status = 'completed';
        order.paymentStatus = 'completed';
        order.paidAt = new Date();
        
        await order.save();
        console.log('✅ Order saved as completed');

        // Confirm ticket purchase (deduct from available tickets)
        await confirmTicketPurchase(order.items);

        // Create issued tickets with QR codes
        const issuedTickets = [];
        for (const item of order.items) {
          const event = await Event.findById(item.eventId);
          if (!event) throw new Error(`Event not found for ID: ${item.eventId}`);

          for (let i = 0; i < item.quantity; i++) {
            const ticketCode = 'TICKET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const qrCodeImage = await QRCode.toDataURL(ticketCode);

            const issuedTicket = new IssuedTicket({
              ticketId: item.ticketId || new mongoose.Types.ObjectId(),
              orderId: order._id,
              userId: order.userId || null,
              eventId: event._id,
              eventTitle: event.title,
              eventVenue: event.venue,
              ticketCode: ticketCode,
              qrCode: qrCodeImage,
              attendeeName: order.customerName,
              attendeeEmail: order.customerEmail,
              price: item.price,
              ticketType: item.ticketType || item.name || 'General Admission',
              isUsed: false,
              createdAt: new Date()
            });

            await issuedTicket.save();
            issuedTickets.push(issuedTicket);
          }
        }

        // Update user stats if authenticated
        if (order.userId) {
          await User.findByIdAndUpdate(
            order.userId,
            { $inc: { upcomingEvents: order.items.length } }
          );
        }

        console.log(`✅ SUCCESSFUL payment processed. Created ${issuedTickets.length} ticket(s)`);

        // ✅ SEND TICKETS EMAIL
        try {
          console.log('📧 Attempting to send tickets email...');
          
          // Get user if authenticated
          const user = order.userId ? await User.findById(order.userId) : null;
          
          if (issuedTickets.length > 0) {
            // Get the full issued tickets with populated data if needed
            const fullIssuedTickets = await IssuedTicket.find({ 
              orderId: order._id 
            }).populate('eventId', 'title venue');
            
            // Send email with tickets
            await sendTicketsEmail(order, user, fullIssuedTickets);
            console.log('✅ Ticket email sent successfully to:', order.customerEmail);
          } else {
            console.warn('⚠️ No issued tickets to send email for');
          }
        } catch (emailError) {
          console.error('❌ Failed to send ticket email:', emailError);
          console.error('Email error details:', emailError.message);
          // Don't fail the whole payment process if email fails
          // Log it but continue
        }

      } 
      // ⏳ TRANSACTION PROCESSING (ResultCode: 4999, 500001, 500000, 2001)
      else if (['4999', '500001', '500000', '2001'].includes(resultCodeStr)) {
        console.log('⏳ Processing STILL PROCESSING (ResultCode: ' + resultCodeStr + ')...');
        transaction.status = 'processing';
        await transaction.save();
        console.log('✅ Transaction saved as processing');

        order.paymentStatus = 'processing';
        order.status = 'pending';
        
        paymentDetails.processingAt = new Date();
        order.paymentDetails = paymentDetails;
        
        await order.save();
        console.log('✅ Order saved as processing');
        console.log('✅ PROCESSING status saved - DO NOT release tickets yet');
      }
      // ❌ PAYMENT CANCELLED (ResultCode: 1032 or 1)
      else if (resultCodeStr === '1032' || resultCodeStr === '1') {
        console.log('⚠️ Processing CANCELLED payment (ResultCode: ' + resultCodeStr + ')...');
        transaction.status = 'cancelled';
        await transaction.save();
        console.log('✅ Transaction saved as cancelled');

        order.paymentStatus = 'cancelled';
        order.status = 'pending';
        
        paymentDetails.cancelledAt = new Date();
        order.paymentDetails = paymentDetails;
        
        await order.save();
        console.log('✅ Order saved as cancelled');
        
        // Release reserved tickets for cancelled payments
        await releaseReservedTickets(order.items);
        console.log('✅ CANCELLED payment processed completely - tickets released');
      }
      // ❌ INSUFFICIENT FUNDS (ResultCode: 2006)
      else if (resultCodeStr === '2006') {
        console.log('❌ Processing INSUFFICIENT FUNDS (ResultCode: ' + resultCodeStr + ')...');
        transaction.status = 'failed';
        await transaction.save();
        console.log('✅ Transaction saved as failed');

        order.paymentStatus = 'failed';
        order.status = 'pending';
        
        paymentDetails.failedAt = new Date();
        paymentDetails.failureReason = 'Insufficient funds';
        order.paymentDetails = paymentDetails;
        
        await order.save();
        console.log('✅ Order saved as failed');
        
        // Release reserved tickets for failed payments
        await releaseReservedTickets(order.items);
        console.log('✅ INSUFFICIENT FUNDS payment processed - tickets released');
      }
      // ❌ PAYMENT FAILED (Any other error code)
      else {
        console.log('❌ Processing FAILED payment (ResultCode: ' + resultCodeStr + ')...');
        transaction.status = 'failed';
        await transaction.save();
        console.log('✅ Transaction saved as failed');

        order.paymentStatus = 'failed';
        order.status = 'pending';
        
        paymentDetails.failedAt = new Date();
        paymentDetails.failureReason = callbackData.resultDesc || 'Payment failed';
        order.paymentDetails = paymentDetails;
        
        await order.save();
        console.log('✅ Order saved as failed');
        
        // Release reserved tickets for failed payments
        await releaseReservedTickets(order.items);
        console.log('✅ FAILED payment processed - tickets released');
      }

      console.log('✅ Callback processing complete\n');
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Callback processed successfully'
      });

    } catch (error) {
      console.error('❌ CALLBACK ERROR:', error);
      console.error('Error stack:', error.stack);
      res.status(200).json({
        ResultCode: 1,
        ResultDesc: error.message || 'Failed to process callback'
      });
    }
  },

  handleValidation: async (req, res) => {
    console.log('Validation request:', req.body);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  },

  handleConfirmation: async (req, res) => {
    try {
      console.log('Confirmation request:', req.body);
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Confirmation received'
      });
    } catch (error) {
      console.error('Confirmation error:', error);
      res.status(200).json({
        ResultCode: 1,
        ResultDesc: 'Failed to process confirmation'
      });
    }
  },

  queryTransaction: async (req, res) => {
    try {
      const { checkoutRequestID } = req.params;
      
      const result = await mpesaService.checkTransactionStatus(checkoutRequestID);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Query transaction error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getTransactionStatus: async (req, res) => {
    try {
      const { checkoutRequestID } = req.params;
      
      const transaction = await MpesaTransaction.findOne({ checkoutRequestID });
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Get associated order to ensure statuses are synchronized
      const order = await Order.findById(transaction.orderId);
      
      // If order exists and statuses don't match, sync them
      if (order && order.paymentStatus !== transaction.status) {
        console.log(`⚠️ Status mismatch detected: transaction=${transaction.status}, order=${order.paymentStatus}`);
        
        // Sync order status with transaction status
        order.paymentStatus = transaction.status;
        
        // Update order status based on payment status
        if (transaction.status === 'completed') {
          order.status = 'completed';
        } else if (transaction.status === 'cancelled' || transaction.status === 'failed') {
          order.status = 'pending';
        } else if (transaction.status === 'processing') {
          order.status = 'pending';
        }
        
        await order.save();
        console.log('✅ Statuses synchronized');
      }

      res.status(200).json({
        success: true,
        transaction: {
          status: transaction.status,
          resultCode: transaction.resultCode,
          resultDesc: transaction.resultDesc,
          mpesaReceiptNumber: transaction.mpesaReceiptNumber,
          amount: transaction.amount,
          phoneNumber: transaction.phoneNumber,
          transactionDate: transaction.transactionDate,
          formattedDate: transaction.formattedDate
        },
        // Also return order status for frontend reference
        orderStatus: order ? {
          paymentStatus: order.paymentStatus,
          status: order.status,
          orderNumber: order.orderNumber
        } : null
      });
    } catch (error) {
      console.error('Get transaction status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = mpesaCallbackController;