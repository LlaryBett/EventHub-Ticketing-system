const express = require('express');
const router = express.Router();
const mpesaCallbackController = require('../controllers/mpesaCallbackController');

// 🔍 Debug middleware - log all M-Pesa requests
router.use((req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log('📥 M-PESA INCOMING REQUEST');
  console.log('='.repeat(60));
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(60) + '\n');
  
  next();
});

// Middleware to log responses
const logResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log('\n' + '='.repeat(60));
    console.log('📤 M-PESA OUTGOING RESPONSE');
    console.log('='.repeat(60));
    console.log('Status:', res.statusCode);
    console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('='.repeat(60) + '\n');
    
    res.send = originalSend;
    return res.send(data);
  };
  next();
};

// Public endpoints - called by Safaricom M-Pesa
router.post('/callback/stk', logResponse, mpesaCallbackController.handleSTKCallback);
router.post('/callback/validation', logResponse, mpesaCallbackController.handleValidation);
router.post('/callback/confirmation', logResponse, mpesaCallbackController.handleConfirmation);

// Public query endpoints
router.get('/transaction/:checkoutRequestID', mpesaCallbackController.getTransactionStatus);
router.get('/query/:checkoutRequestID', mpesaCallbackController.queryTransaction);

module.exports = router;