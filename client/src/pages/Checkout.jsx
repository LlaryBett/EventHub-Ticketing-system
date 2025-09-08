import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { cartService } from '../services/cartService';
import { formatPrice } from '../utils/formatDate';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  
  const [billingInfo, setBillingInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const handleInputChange = (section, field, value) => {
    if (section === 'billing') {
      setBillingInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'payment') {
      setPaymentInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;

    setApplyingDiscount(true);
    try {
      const discountData = await cartService.applyDiscount(discountCode);
      setDiscount(discountData);
      showSuccess(`Discount applied: ${discountData.description}`);
    } catch (error) {
      showError(error.message);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode('');
  };

  const calculateTotal = () => {
    const subtotal = getTotalPrice();
    const discountAmount = discount ? (subtotal * discount.percentage) / 100 : 0;
    const tax = (subtotal - discountAmount) * 0.08; // 8% tax
    return {
      subtotal,
      discountAmount,
      tax,
      total: subtotal - discountAmount + tax
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showError('Please log in to complete your purchase');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      showError('Your cart is empty');
      navigate('/events');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems,
        billingInfo,
        paymentInfo,
        discount,
        total: calculateTotal().total
      };

      const order = await cartService.processCheckout(cartItems, paymentInfo, billingInfo);
      
      clearCart();
      showSuccess('Order placed successfully!');
      navigate('/dashboard', { 
        state: { 
          orderConfirmation: order 
        } 
      });
    } catch (error) {
      showError('Failed to process payment. Please try again.');
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5L5.5 20.5M7 13l-2-5m8 5a1 1 0 100 2 1 1 0 000-2zm-8 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some events to your cart to proceed with checkout.</p>
          <Button onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase to secure your event tickets</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={billingInfo.firstName}
                    onChange={(e) => handleInputChange('billing', 'firstName', e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={billingInfo.lastName}
                    onChange={(e) => handleInputChange('billing', 'lastName', e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => handleInputChange('billing', 'email', e.target.value)}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) => handleInputChange('billing', 'phone', e.target.value)}
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      value={billingInfo.address}
                      onChange={(e) => handleInputChange('billing', 'address', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    label="City"
                    value={billingInfo.city}
                    onChange={(e) => handleInputChange('billing', 'city', e.target.value)}
                    required
                  />
                  <Input
                    label="State"
                    value={billingInfo.state}
                    onChange={(e) => handleInputChange('billing', 'state', e.target.value)}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={billingInfo.zipCode}
                    onChange={(e) => handleInputChange('billing', 'zipCode', e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={billingInfo.country}
                      onChange={(e) => handleInputChange('billing', 'country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentInfo.method === 'card'}
                        onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Credit Card</div>
                        <div className="text-sm text-gray-500">Visa, Mastercard, Amex</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentInfo.method === 'paypal'}
                        onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-gray-500">Pay with PayPal</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="apple"
                        checked={paymentInfo.method === 'apple'}
                        onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Apple Pay</div>
                        <div className="text-sm text-gray-500">Touch ID or Face ID</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Credit Card Form */}
                {paymentInfo.method === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Name on Card"
                        value={paymentInfo.nameOnCard}
                        onChange={(e) => handleInputChange('payment', 'nameOnCard', e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)}
                        required
                      />
                    </div>
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={paymentInfo.expiryDate}
                      onChange={(e) => handleInputChange('payment', 'expiryDate', e.target.value)}
                      required
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="mb-6">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyDiscount}
                      loading={applyingDiscount}
                      disabled={!discountCode.trim() || discount}
                    >
                      Apply
                    </Button>
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
                    <span>Tax:</span>
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
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Complete Purchase • ${formatPrice(totals.total)}`}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    🔒 Your payment information is secure and encrypted
                  </p>
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