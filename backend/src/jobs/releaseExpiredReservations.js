const Order = require('../models/Order');
const { releaseReservedTickets } = require('../utils/helpers');
const { sendEmail } = require('../utils/emailService');

/**
 * Release expired ticket reservations
 * Runs every 5 minutes to check for orders that have:
 * - status: 'pending'
 * - paymentStatus: 'cancelled' or 'failed'
 * - createdAt older than 30 minutes
 */
const releaseExpiredReservations = async () => {
  try {
    console.log('🔄 Checking for expired reservations...');

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find expired orders
    const expiredOrders = await Order.find({
      status: 'pending',
      paymentStatus: { $in: ['cancelled', 'failed'] },
      createdAt: { $lt: thirtyMinutesAgo }
    });

    if (expiredOrders.length === 0) {
      console.log('✅ No expired reservations found');
      return;
    }

    console.log(`⏰ Found ${expiredOrders.length} expired reservations`);

    for (const order of expiredOrders) {
      try {
        console.log(`Releasing reservation for order ${order._id}`);

        // Release reserved tickets
        await releaseReservedTickets(order.items);

        // Update order status
        order.status = 'expired';
        order.paymentStatus = 'expired';
        await order.save();

        // Send expiration email
        await sendEmail({
          to: order.customerEmail,
          subject: '⏰ Your Reservation Has Expired',
          html: `
            <h2>Reservation Expired</h2>
            <p>Your 30-minute reservation for the following tickets has expired:</p>
            <ul>
              ${order.items.map(i => `<li>${i.quantity}x ${i.title}</li>`).join('')}
            </ul>
            <p>The tickets have been released and are available for other customers.</p>
            <p>Feel free to browse and book again:</p>
            <a href="${process.env.FRONTEND_URL}/events" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Browse Events
            </a>
          `
        });

        console.log(`✅ Released reservation for order ${order._id}`);
      } catch (error) {
        console.error(`❌ Error releasing reservation for order ${order._id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error in releaseExpiredReservations job:', error);
  }
};

module.exports = releaseExpiredReservations;
