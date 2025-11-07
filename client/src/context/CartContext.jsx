import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/ticketService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from backend on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      // Set cartItems to the items array inside response.data
      setCartItems(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setError(error.message || 'Failed to load cart');
      // If it's an auth error, you might want to handle it differently
      if (error.isAuthError) {
        // Clear local cart since user is not authenticated
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);

      const itemData = {
        eventId: item.eventId,
        eventName: item.eventName,
        eventImage: item.eventImage,
        ticketId: item.ticketId,
        ticketType: item.ticketType,
        price: item.price,
        quantity
      };

      await cartService.addToCart(itemData);
      await fetchCart(); // Ensure cartItems is updated from backend
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setError(error.message || 'Failed to add item to cart');
      if (error.isAuthError) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.removeFromCart(itemId);
      setCartItems(response.data || response.items || []);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      setError(error.message || 'Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.updateCartItem(itemId, quantity);
      setCartItems(response.data || response.items || []);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setError(error.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      await cartService.clearCart();
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      setError(error.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    return Array.isArray(cartItems)
      ? cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      : 0;
  };

  const getTotalItems = () => {
    return Array.isArray(cartItems)
      ? cartItems.reduce((total, item) => total + item.quantity, 0)
      : 0;
  };

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isOpen,
    toggleCart,
    setIsOpen,
    loading,
    error,
    refetchCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };