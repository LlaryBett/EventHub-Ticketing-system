const Cart = require('../models/Cart');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

// Get user's cart
// Get user's cart (works for both authenticated and guest users)
exports.getCart = async (req, res, next) => {
  try {
    // For guest users, return session cart
    if (!req.user) {
      const guestCart = req.session.guestCart || { items: [], total: 0 };
      
      // Calculate total for guest cart
      guestCart.total = guestCart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      return res.status(200).json({
        success: true,
        data: guestCart,
        isGuest: true
      });
    }
    
    // For authenticated users, return database cart
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.event', 'title image dates venue')
      .populate('items.ticket', 'type price');
    
    if (!cart) {
      cart = { items: [], total: 0 };
    } else {
      // Calculate total for database cart
      cart.total = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
    
    res.status(200).json({
      success: true,
      data: cart,
      isGuest: false
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

    // For guest users, use session-based cart
    if (!req.user) {
      // Initialize guest cart in session if it doesn't exist
      if (!req.session.guestCart) {
        req.session.guestCart = { items: [] };
      }

      // Check if item already exists in guest cart
      const existingItemIndex = req.session.guestCart.items.findIndex(
        item => item.event.toString() === eventId && item.ticketType === ticketType
      );

      if (existingItemIndex > -1) {
        const newQuantity = req.session.guestCart.items[existingItemIndex].quantity + quantity;
        if (!ticket.canPurchase(newQuantity)) {
          return res.status(400).json({ success: false, message: 'Not enough tickets available' });
        }
        req.session.guestCart.items[existingItemIndex].quantity = newQuantity;
      } else {
        req.session.guestCart.items.push({
          event: eventId,
          ticket: ticket._id,
          ticketType,
          quantity,
          price: ticket.price,
          eventTitle: event.title,
          eventImage: event.image
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item added to guest cart successfully',
        data: req.session.guestCart,
        isGuest: true
      });
    }

    // For authenticated users, use database cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.event.toString() === eventId && item.ticket.toString() === ticket._id.toString()
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
        ticket: ticket._id,
        ticketType,
        quantity,
        price: ticket.price
      });
    }

    await cart.save();
    await cart.populate('items.event', 'title image date venue');
    await cart.populate('items.ticket', 'type price');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
      isGuest: false
    });

  } catch (error) {
    next(error);
  }
};
 

// Transfer guest cart to user account after login/registration
exports.transferGuestCart = async (req, res, next) => {
  try {
    // Check if there's a guest cart in session
    if (!req.session.guestCart || !req.session.guestCart.items || req.session.guestCart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No guest cart items to transfer',
        data: null
      });
    }

    let userCart = await Cart.findOne({ user: req.user.id });
    
    // If user doesn't have a cart, create one
    if (!userCart) {
      userCart = new Cart({ user: req.user.id, items: [] });
    }

    // Transfer each item from guest cart to user cart
    for (const guestItem of req.session.guestCart.items) {
      // Check if the item already exists in user's cart
      const existingItemIndex = userCart.items.findIndex(
        item => item.event.toString() === guestItem.event.toString() && 
               item.ticketType === guestItem.ticketType
      );

      if (existingItemIndex > -1) {
        // Update quantity if item already exists
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item to cart
        userCart.items.push({
          event: guestItem.event,
          ticket: guestItem.ticket,
          ticketType: guestItem.ticketType,
          quantity: guestItem.quantity,
          price: guestItem.price
        });
      }
    }

    await userCart.save();
    
    // Clear the guest cart from session
    req.session.guestCart = { items: [] };

    await userCart.populate('items.event', 'title image dates venue');
    await userCart.populate('items.ticket', 'type price');

    res.status(200).json({
      success: true,
      message: 'Guest cart transferred successfully',
      data: userCart
    });

  } catch (error) {
    console.error('Transfer guest cart error:', error);
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
// Remove item from cart (works for both authenticated and guest users)
exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    
    // For guest users
    if (!req.user) {
      if (!req.session.guestCart || !req.session.guestCart.items) {
        return res.status(404).json({
          success: false,
          message: 'Guest cart not found'
        });
      }
      
      const itemIndex = req.session.guestCart.items.findIndex(
        item => item._id?.toString() === itemId || 
               (item.event?.toString() === itemId && item.ticketType === req.query.ticketType)
      );
      
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      req.session.guestCart.items.splice(itemIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Item removed from guest cart successfully',
        data: req.session.guestCart,
        isGuest: true
      });
    }
    
    // For authenticated users
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
    await cart.populate('items.event', 'title image date venue');
    await cart.populate('items.ticket', 'type price');
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart,
      isGuest: false
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
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