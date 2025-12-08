const QRCode = require('qrcode'); // Install: npm install qrcode
const Ticket = require('../models/Ticket');
const IssuedTicket = require('../models/IssuedTicket');
const { sendEmail } = require('./emailService'); // Your email service

// Generate unique ticket code
const generateTicketCode = () => {
  return (
    'TKT-' +
    Date.now() +
    '-' +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
};

// Generate QR code as base64
const generateQRCode = async (ticketCode) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
      width: 200,
      margin: 2,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    // Fallback to text code if QR generation fails
    return `text:${ticketCode}`;
  }
};

// Validate ticket availability
const validateTicketAvailability = async (items) => {
  console.log("👉 Validating tickets for items:", items);

  for (const item of items) {
    console.log("🔍 Checking item:", item);

    if (!item.ticket) {
      console.error(`❌ Missing ticket for item: ${item.title || 'unknown'}`);
      throw new Error(`Missing ticket for item: ${item.title || 'unknown'}`);
    }

    const ticket = await Ticket.findById(item.ticket);
    console.log("📦 Fetched ticket:", ticket);

    if (!ticket) {
      console.error(`❌ Ticket not found for: ${item.title || 'unknown'}`);
      throw new Error(`Ticket not found: ${item.title || 'unknown'}`);
    }

    // Check ticket availability
    const canPurchase = ticket.available >= item.quantity;
    console.log(
      `🛒 Checking availability: need ${item.quantity}, available=${ticket.available}, canPurchase=${canPurchase}`
    );

    if (!canPurchase) {
      console.error(
        `❌ Not enough ${ticket.type} tickets available for ${item.title}`
      );
      throw new Error(
        `Not enough ${ticket.type} tickets available for ${item.title}`
      );
    }

    // Check min order
    if (ticket.minOrder && item.quantity < ticket.minOrder) {
      console.error(
        `❌ Minimum order for ${ticket.type} tickets is ${ticket.minOrder}`
      );
      throw new Error(
        `You must order at least ${ticket.minOrder} ${ticket.type} tickets for ${item.title}`
      );
    }

    // Check max order
    if (ticket.maxOrder && item.quantity > ticket.maxOrder) {
      console.error(
        `❌ Maximum order for ${ticket.type} tickets is ${ticket.maxOrder}`
      );
      throw new Error(
        `You cannot order more than ${ticket.maxOrder} ${ticket.type} tickets for ${item.title}`
      );
    }
  }

  console.log("✅ All tickets validated successfully");
};

// Helper function for login messages
function getLoginMessage(user, isApprovedOrganizer, canAccessOrganizerFeatures) {
  if (user.status === 'pending_verification') {
    if (user.userType === 'organizer') {
      return 'Login successful. Your account is pending verification. Organizer features will be available after admin approval.';
    }
    return 'Login successful. Your account is pending verification.';
  }
  
  if (user.userType === 'organizer' && !canAccessOrganizerFeatures) {
    return 'Login successful. Organizer features will be available after admin approval.';
  }
  
  return 'Login successful';
}


// Reserve tickets temporarily
const reserveTickets = async (items) => {
  for (const item of items) {
    const ticket = await Ticket.findById(item.ticket);
    if (ticket) {
      await ticket.reserveTickets(item.quantity);
    }
  }
};

// Confirm ticket purchase (permanent)
const confirmTicketPurchase = async (items) => {
  for (const item of items) {
    const ticket = await Ticket.findById(item.ticket);
    if (ticket) {
      await ticket.confirmPurchase(item.quantity);
    }
  }
};

// Release reserved tickets
const releaseReservedTickets = async (items) => {
  for (const item of items) {
    const ticket = await Ticket.findById(item.ticket);
    if (ticket) {
      await ticket.releaseTickets(item.quantity).catch(console.error);
    }
  }
};

// Create issued tickets with QR codes
const createIssuedTickets = async (order, user) => {
  const issuedTickets = [];

  for (const item of order.items) {
    console.log('Processing order item:', item); // ✅ log the frontend payload for this item
    console.log('Ticket id received from frontend:', item.ticket); // log the ticket id received
    const ticketDoc = await Ticket.findById(item.ticket);
    const eventDoc = await require('../models/Event').findById(item.eventId); // Fetch event
    console.log('Fetched ticket from DB:', ticketDoc); // ✅ log what the DB returned

    if (!ticketDoc) {
      console.warn(`Skipping item, ticket not found: ${item.ticket}`);
      continue;
    }

    for (let i = 0; i < item.quantity; i++) {
      const ticketCode = generateTicketCode();
      const qrCode = await generateQRCode(ticketCode);

      const issuedTicket = new IssuedTicket({
  ticketId: ticketDoc._id,
  orderId: order._id,
  userId: user ? user._id : null,
  eventId: item.eventId,
  eventTitle: eventDoc ? eventDoc.title : '',
  eventVenue: eventDoc ? eventDoc.venue : '', // ✅ include venue to satisfy schema
  ticketCode,
  qrCode,
  attendeeName: order.customerName,
  attendeeEmail: order.customerEmail,
  price: item.price,
  ticketType: ticketDoc.type,
});


      await issuedTicket.save();
      issuedTickets.push(issuedTicket);
      console.log('Issued ticket created:', issuedTicket._id); // ✅ log ticket creation
    }
  }

  console.log('All issued tickets constructed:', issuedTickets.length); // ✅ final count
  return issuedTickets;
};


// Send tickets email
const sendTicketsEmail = async (order, user, issuedTickets) => {
  // Debug logging at the start
  console.log('========== SEND TICKETS EMAIL DEBUG ==========');
  console.log('Order ID:', order._id);
  console.log('Order Number:', order.orderNumber);
  console.log('Customer Email:', order.customerEmail);
  console.log('User:', user ? `${user.data?.name} (${user.data?.email})` : 'No user');
  console.log('Total Tickets:', issuedTickets.length);
  console.log('Is Guest Order:', order.isGuestOrder);
  
  // Debug each ticket's QR code
  console.log('\n--- TICKET QR CODE ANALYSIS ---');
  issuedTickets.forEach((ticket, index) => {
    console.log(`\nTicket ${index + 1}:`);
    console.log('  Ticket Code:', ticket.ticketCode);
    console.log('  Event Title:', ticket.eventId?.title || 'N/A');
    console.log('  Has QR Code:', !!ticket.qrCode);
    console.log('  QR Code Type:', typeof ticket.qrCode);
    
    if (ticket.qrCode) {
      console.log('  QR Code Length:', ticket.qrCode.length);
      console.log('  First 100 chars:', ticket.qrCode.substring(0, 100));
      
      // Check QR code format
      if (ticket.qrCode.startsWith('data:image')) {
        console.log('  Format: Base64 Data URL');
        console.log('  Is Base64 valid:', ticket.qrCode.includes('base64,'));
        console.log('  Mime type:', ticket.qrCode.substring(5, ticket.qrCode.indexOf(';')));
      } else if (ticket.qrCode.startsWith('http')) {
        console.log('  Format: URL');
        console.log('  URL:', ticket.qrCode);
      } else if (ticket.qrCode.startsWith('<svg') || ticket.qrCode.includes('svg')) {
        console.log('  Format: SVG');
      } else {
        console.log('  Format: Unknown');
      }
    } else {
      console.log('  WARNING: QR code is null/undefined!');
    }
    
    // Check for any image-related properties
    const imageProps = Object.keys(ticket).filter(key => 
      key.toLowerCase().includes('qr') || 
      key.toLowerCase().includes('code') ||
      key.toLowerCase().includes('image')
    );
    if (imageProps.length > 1) {
      console.log('  Other image properties:', imageProps);
    }
  });
  
  // Check environment variables
  console.log('\n--- ENVIRONMENT CHECK ---');
  console.log('FRONTEND_URL exists:', !!process.env.FRONTEND_URL);
  if (process.env.FRONTEND_URL) {
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  }
  
  // Sample the email content for debugging
  console.log('\n--- EMAIL CONTENT PREVIEW ---');
  if (issuedTickets[0]?.qrCode) {
    const sampleQR = issuedTickets[0].qrCode;
    const qrPreview = sampleQR.startsWith('data:image') 
      ? 'Base64 data (truncated)...' 
      : sampleQR;
    console.log('Sample QR in HTML:', `<img src="${qrPreview.substring(0, 100)}...">`);
  }
  
  // Create a test ticket with a known image for debugging
  const testTicket = {
    ...issuedTickets[0],
    qrCode: 'https://via.placeholder.com/200x200/667eea/ffffff?text=TEST+QR'
  };
  
  console.log('\n--- TEST TICKET ---');
  console.log('Test QR URL:', testTicket.qrCode);
  
  // Simple, clean design that focuses on the tickets
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          padding: 30px 20px;
          text-align: center;
          background: #667eea;
          color: white;
        }
        .content {
          padding: 30px 20px;
        }
        .ticket {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          margin: 25px 0;
          padding: 20px;
          background: white;
        }
        .ticket-header {
          margin-bottom: 20px;
        }
        .ticket-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #111827;
        }
        .ticket-meta {
          color: #6b7280;
          font-size: 14px;
        }
        .ticket-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ticket-code {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 16px;
          text-align: center;
        }
        .qr-container {
          text-align: center;
          padding: 20px;
        }
        .qr-code {
          max-width: 200px;
          height: auto;
          margin: 0 auto;
          border: 1px solid #ddd; /* Add border to make visible even if image fails */
        }
        .btn {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        @media (min-width: 480px) {
          .ticket-body {
            flex-direction: row;
            align-items: center;
          }
          .ticket-code {
            flex: 1;
          }
          .qr-container {
            flex-shrink: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🎟 Your Tickets</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">
            Order #${order.orderNumber}
          </p>
        </div>
        
        <div class="content">
          <p>Hi ${user?.data?.name?.split(' ')[0] || 'there'},</p>
          <p>Your order has been confirmed! Here are your ${issuedTickets.length} ticket${issuedTickets.length > 1 ? 's' : ''}:</p>
          
          ${issuedTickets.map(ticket => `
            <div class="ticket">
              <div class="ticket-header">
                <h2 class="ticket-title">${ticket.eventId?.title || 'Event Ticket'}</h2>
                <div class="ticket-meta">
                  ${ticket.ticketType || 'General Admission'}
                  ${ticket.seatNumber ? ` • Seat ${ticket.seatNumber}` : ''}
                </div>
              </div>
              
              <div class="ticket-body">
                <div class="ticket-code">
                  <div style="font-size: 12px; margin-bottom: 4px; color: #6b7280;">TICKET CODE</div>
                  ${ticket.ticketCode}
                </div>
                
                <div class="qr-container">
                  <img 
                    src="${ticket.qrCode || 'https://via.placeholder.com/200x200/ff0000/ffffff?text=QR+NOT+FOUND'}" 
                    alt="QR Code for ${ticket.ticketCode}" 
                    class="qr-code"
                    style="border: ${!ticket.qrCode ? '2px solid #ff0000' : '1px solid #ddd'};"
                  >
                  <div style="font-size: 12px; margin-top: 8px; color: #6b7280;">
                    Scan at entry
                    ${!ticket.qrCode ? '<br><span style="color: #ff0000;">(QR code missing - using fallback)</span>' : ''}
                  </div>
                </div>
              </div>
              
              ${!ticket.qrCode ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-top: 16px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    ⚠️ <strong>Note:</strong> QR code could not be loaded. Please present your ticket code at entry: 
                    <strong>${ticket.ticketCode}</strong>
                  </p>
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || '#'}/orders/${order._id}" class="btn">
              View Order Details
            </a>
          </div>
          
          ${order.isGuestOrder ? `
            <div style="background: #f0f4ff; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #374151;">
                <strong>Guest Checkout:</strong> 
                <a href="${process.env.FRONTEND_URL || '#'}/claim-account?email=${order.customerEmail}" 
                   style="color: #667eea; font-weight: 600;">
                  Claim your account
                </a> to access tickets anytime.
              </p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p style="margin: 0; text-align: center;">
              Need help? <a href="mailto:support@eventhub.com" style="color: #667eea;">Contact Support</a>
            </p>
            <p style="margin: 10px 0 0; text-align: center; font-size: 12px; color: #9ca3af;">
              © ${new Date().getFullYear()} EventHub
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Debug the email content size
  console.log('\n--- EMAIL STATISTICS ---');
  console.log('Email content length:', emailContent.length, 'characters');
  console.log('Email HTML preview (first 500 chars):', emailContent.substring(0, 500));
  
  try {
    console.log('\n--- SENDING EMAIL ---');
    await sendEmail({
      to: order.customerEmail,
      subject: `Your Tickets for Order #${order.orderNumber}`,
      html: emailContent,
    });
    console.log('✅ Email sent successfully to:', order.customerEmail);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', error.message);
    throw error;
  }
  
  console.log('\n========== DEBUG COMPLETE ==========\n');
};

module.exports = {
  generateTicketCode,
  generateQRCode,
  validateTicketAvailability,
  reserveTickets,
  confirmTicketPurchase,
  releaseReservedTickets,
  createIssuedTickets,
  sendTicketsEmail,
};
