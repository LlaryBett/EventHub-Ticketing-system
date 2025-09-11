// src/routes/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth, guestCheckout, protect } = require('../middleware/auth');
const { validateAddToCart, validateUpdateCartItem } = require('../middleware/validation');

// Use optional auth for all cart routes - allows both authenticated and guest users
router.use(optionalAuth);
router.use(guestCheckout); // Ensure guest checkout/session flag

// GET /api/cart - Get current user's cart (works for both authenticated and guest users)
router.get('/', cartController.getCart);

// POST /api/cart - Add item to cart (works for both authenticated and guest users)
router.post('/', validateAddToCart, cartController.addToCart);

// PUT /api/cart/:itemId - Update cart item quantity (works for both authenticated and guest users)
router.put('/:itemId', validateUpdateCartItem, cartController.updateCartItem);

// DELETE /api/cart/:itemId - Remove single item from cart (works for both authenticated and guest users)
router.delete('/:itemId', cartController.removeFromCart);

// DELETE /api/cart - Clear entire cart (works for both authenticated and guest users)
router.delete('/', cartController.clearCart);

// POST /api/cart/transfer - Transfer guest cart to user account after login/registration
router.post('/transfer', protect, cartController.transferGuestCart);

module.exports = router;
