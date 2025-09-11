const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { optionalAuth, guestCheckout } = require('../middleware/auth');
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

// Guest order endpoints - don't require authentication
router.post(
  '/guest-order',
  guestCheckout,
  validateCheckout('createGuestOrder'),
  checkoutController.createGuestOrder
);

router.get(
  '/guest-order/:orderId',
  guestCheckout,
  checkoutController.getGuestOrder
);

router.get(
  '/guest-orders',
  guestCheckout,
  checkoutController.getGuestOrdersByEmail
);

router.patch(
  '/guest-order/:orderId/convert',
  guestCheckout,
  checkoutController.convertGuestToUserOrder
);

router.post(
  '/send-claim-email',
  guestCheckout,
  checkoutController.sendClaimEmail
);

router.get(
  '/validate-claim-token',
  guestCheckout,
  checkoutController.validateClaimToken
);

router.post(
  '/claim-account',
  guestCheckout,
  checkoutController.claimAccount
);

// Apply discount doesn't require auth initially
router.post(
  '/apply-discount',
  discountLimiter,
  validateCheckout('applyDiscount'),
  checkoutController.applyDiscount
);

// Checkout validation doesn't require auth initially
router.post(
  '/validate',
  validateCheckout('validateCheckout'),
  async (req, res) => {
    res.json({
      success: true,
      message: 'Checkout data is valid',
      validated: true
    });
  }
);

// These endpoints require authentication
router.use(optionalAuth);

// GET /api/checkout/summary - Get checkout summary
router.get(
  '/summary',
  checkoutController.getCheckoutSummary
);

// POST /api/checkout/process - Process checkout
router.post(
  '/process',
  checkoutLimiter,
  validateCheckout('processCheckout'),
  checkoutController.processCheckout
);

module.exports = router;