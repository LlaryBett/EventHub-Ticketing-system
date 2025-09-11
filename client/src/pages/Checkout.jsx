import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { applyDiscount, processCheckout, createGuestOrder } from '../services/checkoutService';
import { formatPrice } from '../utils/formatDate';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user, login } = useAuth();
  const { showSuccess, showError } = useUI();
  
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [tempOrderId, setTempOrderId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Order info, 2: Payment, 3: Auth if needed
  
  const [orderInfo, setOrderInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: ''
  });

  const [mpesaInfo, setMpesaInfo] = useState({
    phone: orderInfo.phone || ''
  });

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setOrderInfo(prev => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || prev.firstName,
        lastName: user.name?.split(' ')[1] || prev.lastName,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setOrderInfo(prev => ({ ...prev, [field]: value }));
    if (field === 'phone') {
      setMpesaInfo(prev => ({ ...prev, phone: value }));
    }
  };

  const proceedToPayment = () => {
    // Validate required fields
    if (!orderInfo.firstName || !orderInfo.lastName || !orderInfo.email || !orderInfo.phone) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Check if email is already registered (in a real app, this would be an API call)
    setCurrentStep(2);
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
    const subtotal = getTotalPrice();
    const discountAmount = discount ? (subtotal * discount.percentage) / 100 : 0;
    const tax = (subtotal - discountAmount) * 0.08;
    const total = subtotal - discountAmount + tax;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const handleCheckoutAsGuest = async () => {
    try {
      const guestOrder = await createGuestOrder({
        customerEmail: orderInfo.email,
        customerName: `${orderInfo.firstName} ${orderInfo.lastName}`,
        items: cartItems
      });
      if (guestOrder.success === false && guestOrder.message) {
        showError(guestOrder.message);
        return;
      }
      setTempOrderId(guestOrder._id);
      setShowAuthPrompt(false);
      setCurrentStep(2);
      showSuccess(guestOrder.message || 'Continue with your purchase');
    } catch (error) {
      showError(error?.message || 'Failed to create guest order. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      showError('Your cart is empty');
      navigate('/events');
      return;
    }

    // If user is not authenticated and hasn't chosen guest checkout
    if (!user && !tempOrderId) {
      setShowAuthPrompt(true);
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotal();
      const checkoutData = {
        items: cartItems.map(item => ({
          eventId: item.id,
          quantity: item.quantity,
          price: item.price,
          title: item.title
        })),
        billingAddress: {
          firstName: orderInfo.firstName,
          lastName: orderInfo.lastName,
          email: orderInfo.email,
          phone: mpesaInfo.phone
        },
        paymentMethod: 'mpesa',
        paymentDetails: {
          phone: mpesaInfo.phone
        },
        discountCode: discount ? discount.code : undefined,
        totals
      };

      const order = await processCheckout(checkoutData);
      clearCart();
      showSuccess(order?.message || 'Order placed successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      showError(error?.message || error?.response?.data?.message || 'Failed to process payment. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Secure Checkout
          </h1>
          <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
            You're just one step away from securing your tickets. Complete your purchase with confidence.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="mt-2 text-sm font-medium">Order Details</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="mt-2 text-sm font-medium">Payment</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="mt-2 text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-8">
              {/* Order Information - Step 1 */}
              {currentStep === 1 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">First Name *</label>
                      <input
                        type="text"
                        value={orderInfo.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white/70"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Last Name *</label>
                      <input
                        type="text"
                        value={orderInfo.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white/70"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        value={orderInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white/70 disabled:bg-gray-100"
                        required
                        disabled={!!user}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                      <input
                        type="tel"
                        value={orderInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white/70"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={proceedToPayment}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Information - Step 2 */}
              {currentStep === 2 && (
                <>
                  {/* Authentication Prompt - Only shown if not logged in and not a guest */}
                  {showAuthPrompt && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Order</h2>
                        <p className="text-gray-600">Protect your purchase and access your tickets anytime</p>
                      </div>
                      
                      <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-700">
                          We'll use <strong>{orderInfo.email}</strong> for your order confirmation and ticket delivery.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Welcome Back</h3>
                            <p className="text-sm text-gray-600 mb-4">Already have an account?</p>
                            <Link to="/login" state={{ from: 'checkout', email: orderInfo.email }}>
                              <button className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors">
                                Sign In
                              </button>
                            </Link>
                          </div>
                        </div>
                        
                        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-6 text-center hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Register & Pay</h3>
                            <p className="text-sm text-gray-600 mb-4">Create your account for exclusive benefits</p>
                            <Link to="/register" state={{ from: 'checkout', email: orderInfo.email, firstName: orderInfo.firstName, lastName: orderInfo.lastName }}>
                              <button className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors">
                                Sign Up & Pay
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <button 
                          className="text-blue-600 hover:text-blue-800 font-medium underline"
                          onClick={handleCheckoutAsGuest}
                        >
                          Continue as guest without an account
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">M-Pesa Payment</h2>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-center mb-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" alt="M-Pesa" className="h-8 mr-3" />
                        <span className="font-semibold text-gray-900">Secure Mobile Payment</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Pay safely using M-Pesa. You'll receive a payment prompt on your mobile device to complete the transaction.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        value={mpesaInfo.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors bg-white/70"
                        placeholder="254712345678"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Enter your M-Pesa registered phone number to receive the payment prompt.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="xl:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center p-4 bg-gray-50/70 rounded-2xl">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover shadow-md"
                      />
                      <div className="flex-1 ml-4">
                        <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl">
                  <div className="flex space-x-3 mb-3">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors bg-white/80"
                    />
                    <button
                      type="button"
                      onClick={applyDiscountCode}
                      disabled={!discountCode.trim() || discount || applyingDiscount}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {applyingDiscount ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discount && (
                    <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-xl p-3">
                      <span className="text-sm font-medium text-green-700">
                        {discount.description}
                      </span>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-green-600 hover:text-green-800 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t-2 border-gray-200 pt-6 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount.percentage}%):</span>
                      <span className="font-medium">-{formatPrice(totals.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span className="font-medium">{formatPrice(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-gray-900 border-t-2 border-gray-300 pt-3">
                    <span>Total:</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(totals.total)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                {currentStep === 2 && (
                  <button
                    type="submit"
                    disabled={loading || (showAuthPrompt && !user && !tempOrderId)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                      </div>
                    ) : (
                      `Complete Purchase • ${formatPrice(totals.total)}`
                    )}
                  </button>
                )}

                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={proceedToPayment}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Continue to Payment
                  </button>
                )}

                {/* Security Notice */}
                <div className="mt-6 text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="font-semibold text-green-700">Secure Payment</span>
                  </div>
                  <p className="text-xs text-green-600">
                    Your payment information is protected with enterprise-grade encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full mx-4 text-center transform animate-pulse">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful! 🎉</h2>
              <p className="text-gray-600 mb-6 text-lg">Your tickets have been secured successfully.</p>
              {!user && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-blue-700 font-medium">
                    📧 Check your email to claim your account and access your tickets anytime!
                  </p>
                </div>
              )}
              <button 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => { setShowSuccessModal(false); navigate('/events'); }}
              >
                Continue to Events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;