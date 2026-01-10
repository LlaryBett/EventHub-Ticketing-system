import { api } from './api';

// Process checkout (backend handles all payment processing)
export const processCheckout = async (checkoutData) => {
  try {
    const response = await api.post('/checkout/process', checkoutData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * ✅ CHECK M-PESA PAYMENT STATUS
 * Backend normalizes M-Pesa response to: 
 * - status 'completed': ResultCode 0 with receipt number
 * - status 'cancelled': ResultCode 1032 or 1 (user cancelled)
 * - status 'failed': ResultCode 2006 (insufficient funds) or other errors
 * - status 'processing': ResultCode 4999, 500001, 500000, 2001 (still processing)
 * - status 'pending': Initial state, no callback received yet
 */
export const checkPaymentStatus = async (checkoutRequestID) => {
  try {
    const response = await api.get(`/checkout/payment-status/${checkoutRequestID}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Poll payment status until completion, failure, or cancellation
 * @param {string} checkoutRequestID - The checkout request ID from processCheckout response
 * @param {number} intervalMs - Polling interval in milliseconds (default: 2000ms)
 * @param {number} maxAttempts - Maximum polling attempts (default: 60 = 2 minutes)
 * @returns {Promise<object>} Final payment status with normalized fields
 */
export const pollPaymentStatus = async (
  checkoutRequestID,
  intervalMs = 2000,
  maxAttempts = 60
) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await checkPaymentStatus(checkoutRequestID);
        
        console.log('Payment polling response:', {
          attempt: attempts,
          status: response.status,
          paymentStatus: response.paymentStatus,
          resultCode: response.resultCode,
          resultDesc: response.resultDesc
        });
        
        // ✅ Payment completed successfully
        if (response.status === 'completed') {
          clearInterval(interval);
          resolve({
            ...response,
            isSuccess: true,
            message: 'Payment completed successfully!'
          });
          return;
        }
        
        // ❌ Payment failed
        if (response.status === 'failed') {
          clearInterval(interval);
          resolve({
            ...response,
            isSuccess: false,
            message: response.resultDesc || 'Payment failed'
          });
          return;
        }
        
        // ⚠️ Payment cancelled by user
        if (response.status === 'cancelled') {
          clearInterval(interval);
          resolve({
            ...response,
            isSuccess: false,
            message: response.resultDesc || 'Payment cancelled by user'
          });
          return;
        }
        
        // ⏳ Payment still processing (continue polling)
        if (response.status === 'processing' || response.status === 'pending') {
          console.log(`Payment still ${response.status}... attempt ${attempts}/${maxAttempts}`);
          
          // Check for timeout
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject({
              message: 'Payment polling timeout',
              isTimeout: true,
              lastStatus: response.status,
              resultDesc: response.resultDesc
            });
          }
          return;
        }
        
        // Unknown status - treat as still processing
        console.log(`Unknown status: ${response.status}, continuing polling...`);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject({
            message: 'Payment polling timeout - unknown status',
            isTimeout: true,
            lastStatus: response.status
          });
        }
        
      } catch (error) {
        clearInterval(interval);
        reject({
          message: error.message || 'Error checking payment status',
          error: error,
          isError: true
        });
      }
    }, intervalMs);
  });
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

// Get checkout summary
export const getCheckoutSummary = async () => {
  try {
    const response = await api.get('/checkout/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get order details by ID
 * Use checkPaymentStatus() for payment verification
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/checkout/order/${orderId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw { 
        message: 'Order not found', 
        code: 'ORDER_NOT_FOUND',
        status: 404
      };
    } else if (error.response?.status === 401) {
      throw { 
        message: 'Authentication required', 
        code: 'UNAUTHORIZED',
        status: 401
      };
    } else {
      throw { 
        message: error.response?.data?.message || 'Failed to fetch order details', 
        code: 'FETCH_ERROR',
        status: error.response?.status || 500
      };
    }
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

// Optional: Helper function to extract order ID from URL or location state
export const getOrderIdFromLocation = (location, params) => {
  return params.orderId || location.state?.orderId;
};

// Optional: Validation function for order IDs
export const isValidOrderId = (orderId) => {
  return orderId && typeof orderId === 'string' && orderId.trim().length > 0;
};

/**
 * Check if a checkout request ID is valid for polling
 */
export const isValidCheckoutRequestID = (checkoutRequestID) => {
  return checkoutRequestID && 
         typeof checkoutRequestID === 'string' && 
         checkoutRequestID.startsWith('ws_CO_') &&
         checkoutRequestID.length > 10;
};

/**
 * Helper to determine user-friendly message from payment status
 */
export const getPaymentStatusMessage = (paymentResponse) => {
  if (!paymentResponse) return 'Checking payment status...';
  
  switch (paymentResponse.status) {
    case 'completed':
      return 'Payment successful! Your tickets have been issued.';
    
    case 'cancelled':
      return paymentResponse.resultDesc || 'Payment was cancelled. You can try again.';
    
    case 'failed':
      if (paymentResponse.resultCode === '2006') {
        return 'Payment failed: Insufficient funds. Please ensure you have enough balance and try again.';
      }
      return paymentResponse.resultDesc || 'Payment failed. Please try again.';
    
    case 'processing':
      return 'Payment is being processed. Please wait...';
    
    case 'pending':
      return 'Waiting for payment confirmation. Please check your phone and enter your M-Pesa PIN.';
    
    default:
      return 'Processing payment...';
  }
};

/**
 * Helper to determine if payment can be retried based on status
 */
export const canRetryPayment = (paymentResponse) => {
  if (!paymentResponse) return false;
  
  return ['cancelled', 'failed'].includes(paymentResponse.status);
};

/**
 * Simpler version of pollPaymentStatus that returns on first non-pending status
 * Useful for components that don't need continuous polling
 */
export const waitForPaymentCompletion = async (checkoutRequestID) => {
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await checkPaymentStatus(checkoutRequestID);
        
        // Return if status is not pending/processing
        if (!['pending', 'processing'].includes(status.status)) {
          resolve(status);
          return;
        }
        
        // Continue checking after delay
        setTimeout(checkStatus, 2000);
      } catch (error) {
        reject(error);
      }
    };
    
    checkStatus();
  });
};