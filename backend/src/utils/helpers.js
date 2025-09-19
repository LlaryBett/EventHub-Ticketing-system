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
  const emailContent = `
    <h2>Thank you for your order!</h2>
    <p>Your order #${order.orderNumber} has been confirmed.</p>
    <p>You have ${issuedTickets.length} ticket(s):</p>
    <ul>
      ${issuedTickets
        .map(
          (ticket) => `
        <li>
          <strong>${ticket.eventId?.title || ''}</strong> - ${
            ticket.ticketType || ''
          }<br>
          Ticket Code: ${ticket.ticketCode}<br>
          <img src="${ticket.qrCode}" alt="QR Code" width="100">
        </li>`
        )
        .join('')}
    </ul>
    ${
      order.isGuestOrder
        ? `
    <p>You checked out as a guest. <a href="${
      process.env.FRONTEND_URL
    }/claim-account?email=${order.customerEmail}">Claim your account</a> to access your tickets anytime.</p>
    `
        : ''
    }
  `;

  await sendEmail({
    to: order.customerEmail,
    subject: 'Your Tickets Are Ready!',
    html: emailContent,
  });
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
