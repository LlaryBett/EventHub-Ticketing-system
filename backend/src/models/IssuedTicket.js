const mongoose = require('mongoose');

const issuedTicketSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for guest orders
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  eventVenue: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  ticketCode: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true
  },
  attendeeName: {
    type: String,
    required: true
  },
  attendeeEmail: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  ticketType: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IssuedTicket', issuedTicketSchema);