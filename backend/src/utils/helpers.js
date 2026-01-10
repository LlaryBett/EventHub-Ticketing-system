const QRCode = require('qrcode'); // Install: npm install qrcode
const Ticket = require('../models/Ticket');
const IssuedTicket = require('../models/IssuedTicket');
const { sendEmail } = require('./emailService'); // Your email service
const fs = require('fs');
const path = require('path');

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


// Helper function to get logo as base64 or URL
const getLogoForEmail = () => {
  // Use LOGO_URL from .env (Cloudinary or any CDN)
  if (process.env.LOGO_URL) {
    console.log(`✅ Logo loaded from .env: ${process.env.LOGO_URL}`);
    return process.env.LOGO_URL;
  }
  
  console.warn('⚠️ LOGO_URL not found in .env file. Email will display without logo.');
  return null;
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
  
  const logoUrl = getLogoForEmail();
  
  // Simple, clean design that focuses on the tickets
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-container {
      max-width: 640px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: left;
      color: white;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" opacity="0.1"><path fill="white" d="M0,0L48,8C96,16,192,32,288,42.7C384,53,480,59,576,58.7C672,59,768,53,864,48C960,43,1056,37,1152,42.7C1248,48,1344,64,1392,74.7L1440,85L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path></svg>');
      background-size: cover;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
      flex: 1;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      position: relative;
      z-index: 1;
    }
    
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .order-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      margin-bottom: 30px;
    }
    
    .greeting h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #111827;
    }
    
    .greeting p {
      color: #6b7280;
      font-size: 16px;
    }
    
    .ticket-container {
      margin: 40px 0;
    }
    
    .ticket-count {
      font-size: 16px;
      color: #667eea;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ticket-count::before {
      content: '🎟️';
      font-size: 18px;
    }
    
    .ticket {
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
    }
    
    .ticket:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
      border-color: #d1d5db;
    }
    
    .ticket-header {
      margin-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;
    }
    
    .ticket-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ticket-title::before {
      content: '📍';
      font-size: 16px;
    }
    
    .ticket-meta {
      color: #6b7280;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .ticket-type {
      background: #e0e7ff;
      color: #4f46e5;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .ticket-body {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    @media (min-width: 480px) {
      .ticket-body {
        flex-direction: row;
        align-items: center;
      }
    }
    
    .ticket-code-section {
      flex: 1;
    }
    
    .code-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .ticket-code {
      background: #f8fafc;
      border: 2px dashed #d1d5db;
      padding: 16px;
      border-radius: 12px;
      font-family: 'SF Mono', 'Menlo', monospace;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      text-align: center;
      letter-spacing: 1px;
    }
    
    .qr-section {
      text-align: center;
      flex-shrink: 0;
    }
    
    .qr-container {
      background: white;
      border-radius: 12px;
      padding: 16px;
      display: inline-block;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .qr-code {
      width: 160px;
      height: 160px;
      border-radius: 8px;
    }
    
    .qr-label {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 8px;
      font-weight: 500;
    }
    
    .qr-warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      font-size: 14px;
      color: #92400e;
    }
    
    .qr-warning strong {
      display: block;
      margin-bottom: 4px;
    }
    
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 32px 0;
    }
    
    @media (min-width: 480px) {
      .action-buttons {
        flex-direction: row;
        justify-content: center;
      }
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
      gap: 8px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;
    }
    
    .btn-secondary:hover {
      background: #e5e7eb;
    }
    
    .btn-icon {
      font-size: 18px;
    }
    
    .guest-notice {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .guest-notice h3 {
      color: #0369a1;
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .guest-notice h3::before {
      content: '✨';
    }
    
    .guest-notice p {
      color: #0c4a6e;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .guest-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0284c7;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    .guest-btn:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    
    .instructions {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 40px 0;
    }
    
    .instructions h3 {
      color: #111827;
      font-size: 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .instructions h3::before {
      content: '📋';
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .step:last-child {
      margin-bottom: 0;
    }
    
    .step-number {
      background: #667eea;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .step-content h4 {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .step-content p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .footer {
      border-top: 1px solid #e5e7eb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    
    .footer-links {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .footer-link:hover {
      color: #5a67d8;
      text-decoration: underline;
    }
    
    .copyright {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : '<div class="logo">🎟️</div>'}
      <div class="header-content">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your Tickets Are Ready!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">
          Order confirmation
        </p>
        <div class="order-badge">Order #${order.orderNumber}</div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <h1>Hi ${user?.data?.name?.split(' ')[0] || 'there'}!</h1>
        <p>Your order has been confirmed successfully. We've prepared ${issuedTickets.length} ticket${issuedTickets.length > 1 ? 's' : ''} for you.</p>
      </div>
      
      <!-- Ticket Counter -->
      <div class="ticket-count">
        ${issuedTickets.length} Ticket${issuedTickets.length > 1 ? 's' : ''} • Ready to use
      </div>
      
      <!-- Tickets List -->
      ${issuedTickets.map((ticket, index) => `
        <div class="ticket">
          <div class="ticket-header">
            <h2 class="ticket-title">${ticket.eventId?.title || 'Event Ticket'}</h2>
            <div class="ticket-meta">
              <span class="ticket-type">${ticket.ticketType || 'General Admission'}</span>
              ${ticket.seatNumber ? `<span>Seat: ${ticket.seatNumber}</span>` : ''}
            </div>
          </div>
          
          <div class="ticket-body">
            <div class="ticket-code-section">
              <div class="code-label">TICKET CODE</div>
              <div class="ticket-code">${ticket.ticketCode}</div>
            </div>
            
            <div class="qr-section">
              <div class="qr-container">
                <img 
                  src="${ticket.qrCode || 'https://via.placeholder.com/200x200/667eea/ffffff?text=QR+CODE'}" 
                  alt="QR Code for ${ticket.ticketCode}" 
                  class="qr-code"
                />
              </div>
              <div class="qr-label">Scan at entry</div>
              
              ${!ticket.qrCode ? `
                <div class="qr-warning">
                  <strong>⚠️ Note</strong>
                  <span>QR code not available. Present your ticket code at entry.</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <a href="${process.env.FRONTEND_URL || '#'}/orders/${order._id}" class="btn btn-primary">
          <span class="btn-icon">📱</span>
          View in Mobile Wallet
        </a>
        <a href="${process.env.FRONTEND_URL || '#'}/orders/${order._id}" class="btn btn-secondary">
          <span class="btn-icon">📄</span>
          View Order Details
        </a>
      </div>
      
      <!-- Guest Notice -->
      ${order.isGuestOrder ? `
        <div class="guest-notice">
          <h3>Unlock More Benefits!</h3>
          <p>Claim your account to save tickets, get faster checkout, and access order history.</p>
          <a href="${process.env.FRONTEND_URL || '#'}/claim-account?email=${order.customerEmail}" class="guest-btn">
            <span>🎁</span>
            Claim Your Account
          </a>
        </div>
      ` : ''}
      
      <!-- Instructions -->
      <div class="instructions">
        <h3>How to Use Your Tickets</h3>
        
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Save Your Tickets</h4>
            <p>Add tickets to your mobile wallet or take a screenshot for offline access.</p>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Arrive Early</h4>
            <p>Arrive 30 minutes before the event starts for smooth entry.</p>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Present QR Code</h4>
            <p>Show the QR code at the entrance for scanning. Keep your ticket code as backup.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="${process.env.FRONTEND_URL || '#'}/help" class="footer-link">Help Center</a>
        <a href="${process.env.FRONTEND_URL || '#'}/contact" class="footer-link">Contact Support</a>
        <a href="${process.env.FRONTEND_URL || '#'}/events" class="footer-link">Browse Events</a>
      </div>
      <p>If you have any questions, our support team is here to help.</p>
      <p class="copyright">
        © ${new Date().getFullYear()} EventHub. All rights reserved.<br>
        This email was sent to ${order.customerEmail}
      </p>
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
  getLogoForEmail,
};
