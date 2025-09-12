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

// Process checkout (works for both M-Pesa & others)
export const processCheckout = async (checkoutData) => {
  try {
    const response = await api.post('/checkout/process', checkoutData); // single route for all payments
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Check M-Pesa payment status
export const checkMpesaPaymentStatus = async (transactionId) => {
  try {
    const response = await api.get(`/checkout/mpesa/status/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Initiate M-Pesa STK Push
export const initiateMpesaSTKPush = async (paymentData) => {
  try {
    const response = await api.post('/checkout/mpesa/stk-push', paymentData);
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

// Validate M-Pesa phone number
export const validateMpesaPhone = async (phoneNumber) => {
  try {
    const response = await api.post('/checkout/mpesa/validate-phone', { phoneNumber });
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

// Update checkout details
export const updateCheckoutDetails = async (checkoutData) => {
  try {
    const response = await api.put('/checkout/details', checkoutData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Remove discount code
export const removeDiscount = async () => {
  try {
    const response = await api.delete('/checkout/discount');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get available payment methods (now includes M-Pesa)
export const getPaymentMethods = async () => {
  try {
    const response = await api.get('/checkout/payment-methods');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get shipping options (if needed for physical tickets)
export const getShippingOptions = async (address) => {
  try {
    const response = await api.post('/checkout/shipping-options', address);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// M-Pesa callback verification (for webhook handling)
export const verifyMpesaCallback = async (callbackData) => {
  try {
    const response = await api.post('/checkout/mpesa/callback-verify', callbackData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get M-Pesa transaction details
export const getMpesaTransactionDetails = async (checkoutRequestId) => {
  try {
    const response = await api.get(`/checkout/mpesa/transaction/${checkoutRequestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel M-Pesa transaction (if supported)
export const cancelMpesaTransaction = async (transactionId) => {
  try {
    const response = await api.post('/checkout/mpesa/cancel', { transactionId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Helper function to format M-Pesa phone numbers
export const formatMpesaPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  }
  return cleaned;
};

// Helper function to validate M-Pesa phone numbers
export const isValidMpesaPhone = (phoneNumber) => {
  const formatted = formatMpesaPhoneNumber(phoneNumber);
  // M-Pesa phone numbers should be 12 digits starting with 254
  // and the next digit should be 1 or 7 (Safaricom networks)
  return /^254[17]\d{8}$/.test(formatted);
};