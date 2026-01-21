import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { applyDiscount, processCheckout } from '../services/checkoutService';
import { formatPrice } from '../utils/formatDate';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  console.log('Checkout user data:', user);

  // Grab ticket from navigation state instead of cart
  const ticketItem = location.state?.item;

  const userData = user?.data || {};

  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Updated form with full name field
  const [paymentInfo, setPaymentInfo] = useState({
    fullName: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || '',
    phoneNumber: userData.phone || '',
    email: userData.email || ''
  });

  const handleInputChange = (field, value) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  // Format phone number for M-Pesa (254XXXXXXXXX format)
  const formatMpesaPhone = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
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

  const validateMpesaPhone = (phone) => {
    const formatted = formatMpesaPhone(phone);
    // M-Pesa phone numbers should be 12 digits starting with 254
    return /^254[17]\d{8}$/.test(formatted);
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;

    setApplyingDiscount(true);
    try {
      const discountData = await applyDiscount(discountCode);
      setDiscount({
        code: discountData.code || discountCode,
        percentage: discountData.discountPercentage || discountData.percentage || 0,
        description: discountData.description || `Discount applied: ${discountData.code}`
      });
      showSuccess(`Discount applied: ${discountData.description}`);
    } catch (error) {
      if (error.isAuthError) {
        showError('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      showError(error.message || 'Failed to apply discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode('');
  };

  const calculateTotal = () => {
    if (!ticketItem) {
      return {
        subtotal: 0,
        discountAmount: 0,
        tax: 0,
        total: 0
      };
    }
    
    const subtotal = ticketItem.price * ticketItem.quantity;
    const discountAmount = discount ? (subtotal * discount.percentage) / 100 : 0;
    const tax = (subtotal - discountAmount) * 0.16; // Kenya VAT is 16%
    const total = subtotal - discountAmount + tax;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ticketItem) {
      showError('No ticket selected for purchase');
      navigate('/events');
      return;
    }

    // Validate full name
    if (!paymentInfo.fullName.trim()) {
      showError('Please enter your full name');
      return;
    }

    // Validate M-Pesa phone number
    if (!validateMpesaPhone(paymentInfo.phoneNumber)) {
      showError('Please enter a valid M-Pesa phone number (e.g., 0712345678)');
      return;
    }

    // Validate email
    if (!paymentInfo.email.trim()) {
      showError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotal();
      const formattedPhone = formatMpesaPhone(paymentInfo.phoneNumber);
      
      const checkoutData = {
        items: [{
          eventId: ticketItem.eventId,
          ticket: ticketItem._id || ticketItem.id,
          quantity: ticketItem.quantity,
          price: ticketItem.price,
          title: ticketItem.title
        }],
        customerInfo: {
          fullName: paymentInfo.fullName,
          email: paymentInfo.email,
          phone: formattedPhone,
          userId: user?.id || null,
          name: paymentInfo.fullName
        },
        paymentMethod: 'mpesa',
        mpesaPhone: formattedPhone,
        discountCode: discount ? discount.code : undefined,
        totals
      };
      
      console.log('Ticket ID being passed to backend:', checkoutData.items[0].ticket);

      const order = await processCheckout(checkoutData);
      
      // Show success message with M-Pesa prompt info
      showSuccess('M-Pesa payment request sent! Please check your phone and enter your PIN to complete the payment.');
      
      console.log('Navigating to /payment-confirmation with orderId:', order.order.id);
      console.log('CheckoutRequestID:', order.order.checkoutRequestID);
      
      // Store payment payload for retry functionality
      const paymentPayload = {
        orderId: order.order.id,
        items: checkoutData.items,
        customerInfo: checkoutData.customerInfo,
        paymentMethod: 'mpesa',
        mpesaPhone: formattedPhone,
        discountCode: checkoutData.discountCode,
        totals: totals,
        amount: totals.total
      };

      // Navigate to payment confirmation with all necessary data including retry payload
      navigate('/payment-confirmation', { 
        state: { 
          orderId: order.order.id,
          checkoutRequestID: order.order.checkoutRequestID,
          paymentPayload: paymentPayload
        } 
      });
    } catch (error) {
      if (error.isAuthError) {
        showError('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      showError(error.message || 'Failed to initiate M-Pesa payment. Please try again.');
      console.error('M-Pesa checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!ticketItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No ticket selected</h2>
          <p className="text-gray-600 mb-6">Please select a ticket to proceed with checkout.</p>
          <Button onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  // Show M-Pesa section only if all required fields are filled
  const showMpesaSection = paymentInfo.fullName.trim() && paymentInfo.email.trim() && paymentInfo.phoneNumber.trim();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto container-padding">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Pay securely with M-Pesa to secure your event tickets</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <img 
                      src="https://www.kachwanya.com/wp-content/uploads/2020/12/1UCUl2bSj2RCyq6H.jpg" 
                      alt="M-Pesa" 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">M-Pesa Payment</h2>
                    <p className="text-base text-gray-600">Safe, secure, and instant</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={paymentInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    help="Enter your full name as it appears on your ID"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="your@email.com"
                    value={paymentInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    help="Receipt will be sent to this email"
                  />

                  <Input
                    label="M-Pesa Phone Number"
                    type="tel"
                    placeholder="0712345678"
                    value={paymentInfo.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    required
                    help="Enter your M-Pesa registered phone number"
                  />
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">How M-Pesa payment works:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Click "Pay with M-Pesa" below</li>
                        <li>You'll receive an M-Pesa prompt on your phone</li>
                        <li>Enter your M-Pesa PIN to complete payment</li>
                        <li>Your tickets will be confirmed instantly</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                {/* Ticket Item */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <img
                      src={ticketItem.image}
                      alt={ticketItem.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">
                        {ticketItem.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {ticketItem.quantity} × {formatPrice(ticketItem.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyDiscountCode}
                      disabled={!discountCode.trim() || discount || applyingDiscount}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      {applyingDiscount ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discount && (
                    <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                      <span className="text-sm text-green-600">
                        {discount.description}
                      </span>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t pt-6">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount.percentage}%):</span>
                      <span>-{formatPrice(totals.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>VAT (16%):</span>
                    <span>{formatPrice(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary-600">{formatPrice(totals.total)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    loading={loading}
                    disabled={loading || !showMpesaSection || !paymentInfo.phoneNumber.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending M-Pesa Request...' : 
                     !showMpesaSection ? 'Complete personal information first' :
                     !paymentInfo.phoneNumber.trim() ? 'Enter M-Pesa phone number' :
                     `Pay with M-Pesa • ${formatPrice(totals.total)}`}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-500 font-medium">
                      Powered by Safaricom M-Pesa - Safe & Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;