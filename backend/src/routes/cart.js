// src/routes/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { validateAddToCart, validateUpdateCartItem } = require('../middleware/validation');

// All cart routes are protected
router.use(protect);

// GET /api/cart - Get current user's cart
router.get('/', cartController.getCart);

// POST /api/cart - Add item to cart
router.post('/', validateAddToCart, cartController.addToCart);

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', validateUpdateCartItem, cartController.updateCartItem);

// DELETE /api/cart/:itemId - Remove single item from cart
router.delete('/:itemId', cartController.removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', cartController.clearCart);

module.exports = router;
