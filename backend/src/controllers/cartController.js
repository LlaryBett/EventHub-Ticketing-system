const Cart = require('../models/Cart');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

// Get user's cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.event', 'title image dates venue');
    
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], total: 0 }
      });
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { eventId, ticketType, quantity } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find the ticket in Ticket collection
    const ticket = await Ticket.findOne({ event: eventId, type: ticketType });
    if (!ticket) {
      return res.status(400).json({ success: false, message: 'Invalid ticket type' });
    }

    // Check availability
    if (!ticket.canPurchase(quantity)) {
      return res.status(400).json({ success: false, message: 'Not enough tickets available or quantity not allowed' });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.event.toString() === eventId && item.ticketType === ticketType
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (!ticket.canPurchase(newQuantity)) {
        return res.status(400).json({ success: false, message: 'Not enough tickets available' });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        event: eventId,
        ticketType,
        quantity,
        price: ticket.price
      });
    }

    await cart.save();
    await cart.populate('items.event', 'title image date venue');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    // Check if event and ticket still available
    const event = await Event.findById(item.event);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const ticket = event.tickets.find(t => t.type === item.ticketType);
    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type no longer available'
      });
    }
    
    // Check if requested quantity is available
    if (ticket.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough tickets available'
      });
    }
    
    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.event', 'title image dates venue');
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    item.deleteOne();
    await cart.save();
    await cart.populate('items.event', 'title image dates venue');
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};