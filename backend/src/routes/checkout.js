const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateCheckout } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for checkout endpoints
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 checkout attempts per windowMs
  message: {
    success: false,
    message: 'Too many checkout attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const discountLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 discount attempts per windowMs
  message: {
    success: false,
    message: 'Too many discount code attempts, please try again later'
  }
});

// ---------------------- ROUTES ---------------------- //

// ✅ Authenticated users only
router.get(
  '/summary',
  protect, // still require login here
  checkoutController.getCheckoutSummary
);

// ✅ Guests OR authenticated can checkout
router.post(
  '/process',
  optionalAuth, // 👈 allows both guest + logged in
  checkoutLimiter,
  validateCheckout('processCheckout'),
  checkoutController.processCheckout
);

// ✅ Guests OR authenticated can apply discount
router.post(
  '/apply-discount',
  optionalAuth, // 👈 either guest or logged in
  discountLimiter,
  validateCheckout('applyDiscount'),
  checkoutController.applyDiscount
);

// ✅ Guests OR authenticated can pre-validate
router.post(
  '/validate',
  optionalAuth, // 👈 optional auth
  validateCheckout('validateCheckout'),
  async (req, res) => {
    res.json({
      success: true,
      message: 'Checkout data is valid',
      validated: true
    });
  }
);

module.exports = router;
