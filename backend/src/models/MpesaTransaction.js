const mongoose = require('mongoose');

const mpesaTransactionSchema = new mongoose.Schema({
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // M-Pesa fields
  checkoutRequestID: {
    type: String,
    required: true,
    unique: true
  },
  merchantRequestID: {
    type: String,
    required: true
  },
  mpesaReceiptNumber: {
    type: String,
    sparse: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  // Status
  resultCode: {
    type: Number
  },
  resultDesc: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Timestamps
  transactionDate: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
mpesaTransactionSchema.index({ checkoutRequestID: 1 });
mpesaTransactionSchema.index({ orderId: 1 });
mpesaTransactionSchema.index({ status: 1 });
mpesaTransactionSchema.index({ createdAt: 1 });

// Virtual for formatted date
mpesaTransactionSchema.virtual('formattedDate').get(function() {
  if (!this.transactionDate) return null;
  
  const year = this.transactionDate.substring(0, 4);
  const month = this.transactionDate.substring(4, 6);
  const day = this.transactionDate.substring(6, 8);
  const hour = this.transactionDate.substring(8, 10);
  const minute = this.transactionDate.substring(10, 12);
  const second = this.transactionDate.substring(12, 14);
  
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
});

const MpesaTransaction = mongoose.model('MpesaTransaction', mpesaTransactionSchema);

module.exports = MpesaTransaction;