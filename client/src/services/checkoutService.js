import { api } from './api';

// Get checkout summary
export const getCheckoutSummary = async () => {
  try {
    const response = await api.get('/checkout/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process checkout (for both authenticated and guest users)
export const processCheckout = async (checkoutData) => {
  try {
    const response = await api.post('/checkout/process', checkoutData);
    return response.data;
  } catch (error) {
    // Add isAuthError flag for auth-related errors
    if (error.response?.data?.isAuthError) {
      error.isAuthError = true;
    }
    throw error.response?.data || error.message;
  }
};

// Create guest order (temporary order before payment)
export const createGuestOrder = async (orderData) => {
  try {
    const response = await api.post('/checkout/guest-order', orderData);
    return response.data;
  } catch (error) {
    // Check if email already has account
    if (error.response?.data?.hasAccount) {
      error.hasAccount = true;
    }
    throw error.response?.data || error.message;
  }
};

// Get guest order by ID
export const getGuestOrder = async (orderId) => {
  try {
    const response = await api.get(`/checkout/guest-order/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get guest orders by email
export const getGuestOrdersByEmail = async (email) => {
  try {
    const response = await api.get(`/checkout/guest-orders?email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Send account claim email
export const sendClaimEmail = async (email, orderId) => {
  try {
    const response = await api.post('/checkout/send-claim-email', { email, orderId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Validate claim token
export const validateClaimToken = async (token, email) => {
  try {
    const response = await api.get(`/checkout/validate-claim-token?token=${token}&email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Claim account from guest order
export const claimAccount = async (claimData) => {
  try {
    const response = await api.post('/checkout/claim-account', claimData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Apply discount code
export const applyDiscount = async (discountCode) => {
  try {
    const response = await api.post('/checkout/apply-discount', { discountCode });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Validate checkout data
export const validateCheckout = async (checkoutData) => {
  try {
    const response = await api.post('/checkout/validate', checkoutData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Convert guest order to registered user order (after account creation)
export const convertGuestOrderToUser = async (orderId, userId) => {
  try {
    const response = await api.patch(`/checkout/guest-order/${orderId}/convert`, { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user orders (for authenticated users)
export const getUserOrders = async (limit = 10, skip = 0) => {
  try {
    const response = await api.get(`/orders?limit=${limit}&skip=${skip}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get order by order number
export const getOrderByNumber = async (orderNumber) => {
  try {
    const response = await api.get(`/orders/number/${orderNumber}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel order
export const cancelOrder = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Request refund
export const requestRefund = async (orderId, reason) => {
  try {
    const response = await api.post(`/orders/${orderId}/refund`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Send order confirmation email
export const sendOrderConfirmation = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/send-confirmation`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Check ticket availability
export const checkTicketAvailability = async (eventId, ticketType, quantity) => {
  try {
    const response = await api.post('/checkout/check-availability', {
      eventId,
      ticketType,
      quantity
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get event ticket info
export const getEventTicketInfo = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/ticket-info`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify payment status
export const verifyPaymentStatus = async (orderId) => {
  try {
    const response = await api.get(`/checkout/${orderId}/payment-status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Resend payment confirmation
export const resendPaymentConfirmation = async (orderId) => {
  try {
    const response = await api.post(`/checkout/${orderId}/resend-confirmation`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get payment methods
export const getPaymentMethods = async () => {
  try {
    const response = await api.get('/checkout/payment-methods');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Save payment method
export const savePaymentMethod = async (paymentMethodData) => {
  try {
    const response = await api.post('/checkout/payment-methods', paymentMethodData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Remove payment method
export const removePaymentMethod = async (paymentMethodId) => {
  try {
    const response = await api.delete(`/checkout/payment-methods/${paymentMethodId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (paymentMethodId) => {
  try {
    const response = await api.patch(`/checkout/payment-methods/${paymentMethodId}/default`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process M-Pesa payment
export const processMpesaPayment = async (paymentData) => {
  try {
    const response = await api.post('/checkout/mpesa-payment', paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Check M-Pesa payment status
export const checkMpesaPaymentStatus = async (transactionId) => {
  try {
    const response = await api.get(`/checkout/mpesa-status/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process card payment
export const processCardPayment = async (paymentData) => {
  try {
    const response = await api.post('/checkout/card-payment', paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process PayPal payment
export const processPayPalPayment = async (paymentData) => {
  try {
    const response = await api.post('/checkout/paypal-payment', paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create payment intent
export const createPaymentIntent = async (amount, currency = 'USD') => {
  try {
    const response = await api.post('/checkout/create-payment-intent', {
      amount,
      currency
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Confirm payment intent
export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const response = await api.post('/checkout/confirm-payment-intent', {
      paymentIntentId,
      paymentMethodId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get checkout session
export const getCheckoutSession = async (sessionId) => {
  try {
    const response = await api.get(`/checkout/session/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create checkout session
export const createCheckoutSession = async (sessionData) => {
  try {
    const response = await api.post('/checkout/create-session', sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Expire checkout session
export const expireCheckoutSession = async (sessionId) => {
  try {
    const response = await api.post(`/checkout/session/${sessionId}/expire`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get abandoned carts
export const getAbandonedCarts = async (hours = 24) => {
  try {
    const response = await api.get(`/checkout/abandoned-carts?hours=${hours}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Recover abandoned cart
export const recoverAbandonedCart = async (cartId) => {
  try {
    const response = await api.post(`/checkout/recover-cart/${cartId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get checkout analytics
export const getCheckoutAnalytics = async (startDate, endDate) => {
  try {
    const response = await api.get(`/checkout/analytics?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get conversion rates
export const getConversionRates = async (period = '30d') => {
  try {
    const response = await api.get(`/checkout/conversion-rates?period=${period}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get average order value
export const getAverageOrderValue = async (period = '30d') => {
  try {
    const response = await api.get(`/checkout/average-order-value?period=${period}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get checkout performance metrics
export const getCheckoutPerformance = async () => {
  try {
    const response = await api.get('/checkout/performance');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default {
  getCheckoutSummary,
  processCheckout,
  createGuestOrder,
  getGuestOrder,
  getGuestOrdersByEmail,
  sendClaimEmail,
  validateClaimToken,
  claimAccount,
  applyDiscount,
  validateCheckout,
  convertGuestOrderToUser,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  requestRefund,
  sendOrderConfirmation,
  checkTicketAvailability,
  getEventTicketInfo,
  verifyPaymentStatus,
  resendPaymentConfirmation,
  getPaymentMethods,
  savePaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  processMpesaPayment,
  checkMpesaPaymentStatus,
  processCardPayment,
  processPayPalPayment,
  createPaymentIntent,
  confirmPaymentIntent,
  getCheckoutSession,
  createCheckoutSession,
  expireCheckoutSession,
  getAbandonedCarts,
  recoverAbandonedCart,
  getCheckoutAnalytics,
  getConversionRates,
  getAverageOrderValue,
  getCheckoutPerformance
};