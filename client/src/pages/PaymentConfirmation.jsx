// PaymentConfirmation.js - Two-column layout with modal
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import { formatPrice } from '../utils/formatDate';
import { getOrderById } from '../services/checkoutService';

// Modal Component
const AccountSuggestionModal = ({ isOpen, onClose, orderData, onCreateAccount, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {orderData?.hasAccount ? 'Welcome Back!' : 'Create Your Account'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {orderData?.hasAccount 
              ? "Log in to access your tickets and manage future bookings easily."
              : "Save your details for faster checkout and manage all your tickets in one place!"
            }
          </p>

          {/* Benefits list */}
          <div className="text-left bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">Account Benefits:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Manage all your tickets
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Faster checkout next time
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Order history & receipts
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Early access to events
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {orderData?.hasAccount ? (
              <Button
                onClick={onLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Log In to My Account
              </Button>
            ) : (
              <Button
                onClick={onCreateAccount}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Account (Takes 30 seconds)
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose} className="text-gray-600">
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your tickets are already secured and emailed to you.
          </p>
        </div>
      </div>
    </div>
  );
};

const PaymentConfirmation = () => {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showError } = useUI();

  // Get orderId from params or location state
  const orderId = paramOrderId || location.state?.orderId;
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await getOrderById(orderId);
      
      if (response.success) {
        setOrderData(response.order);
        setError(null);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load order details';
      setError(errorMessage);
      console.error('Order fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Show error notification only once when error state changes
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Countdown and modal trigger logic - only for guest orders without existing accounts
  useEffect(() => {
    if (orderData?.isGuestOrder && !user && !orderData?.hasAccount && !localStorage.getItem('hideAccountSuggestion')) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowAccountModal(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderData, user]);

  const handleCreateAccount = () => {
    setShowAccountModal(false);
    navigate('/register', {
      state: {
        prefill: {
          name: orderData.customerName || '',
          email: orderData.customerEmail || '',
          phone: orderData.billingAddress?.phone || '',
          password: '',
          confirmPassword: ''
        },
        message: "Create an account to manage your tickets and get updates about future events."
      }
    });
  };

  const handleLogin = () => {
    setShowAccountModal(false);
    navigate('/login', {
      state: {
        prefill: {
          email: orderData.customerEmail || ''
        },
        message: "Looks like you already have an account! Log in to access your tickets."
      }
    });
  };

  const handleCloseModal = () => {
    setShowAccountModal(false);
    localStorage.setItem('hideAccountSuggestion', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
    <p className="text-gray-600 mb-6">
      {error || 'Please check your email for order confirmation.'}
    </p>
    <Button
      onClick={() => navigate('/events')}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
    >
      Browse More Events
    </Button>
  </div>
</div>

    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto container-padding">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Success Confirmation */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Your order <span className="font-semibold text-blue-600">#{orderData.orderNumber}</span> has been confirmed.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(orderData.totals?.total)}
                    </span>
                  </div>
                  
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {orderData.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals Breakdown */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">
                        {formatPrice(orderData.totals?.subtotal)}
                      </span>
                    </div>
                    {orderData.totals?.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-900">{formatPrice(orderData.totals.tax)}</span>
                      </div>
                    )}
                    {orderData.totals?.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">
                          -{formatPrice(orderData.totals.discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600 mb-2">
                      Paid via{" "}
                      <span className="font-medium capitalize">
                        {orderData.paymentMethod || "M-Pesa"}
                      </span>
                      {orderData.billingAddress?.phone && (
                        <span> • {orderData.billingAddress.phone}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Tickets sent to:</h4>
                  <p className="text-gray-700">
                    <span className="font-medium">{orderData.customerName}</span>
                    <br />
                    <span className="text-blue-600">{orderData.customerEmail}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button
    variant="outline"
    onClick={() => navigate('/events')}
    className="flex-1 sm:flex-none border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors"
  >
    Browse More Events
  </Button>

  <Button
    onClick={() => navigate(`/orders/${orderId}`)}
    className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
  >
    View My Tickets
  </Button>
</div>


                {/* Countdown - only show for guest orders without existing accounts */}
                {orderData.isGuestOrder && !user && !orderData?.hasAccount && !showAccountModal && countdown > 0 && (
                  <div className="text-center mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Create an account in <span className="font-bold">{countdown}</span> seconds to unlock exclusive benefits!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Additional Info (1/3 width) */}
            <div className="space-y-6">
              {/* What's Next */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  What happens next?
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                      <span className="w-5 h-5 text-xs font-bold text-blue-600 flex items-center justify-center">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Check your email</p>
                      <p className="text-sm text-gray-600">Ticket confirmation has been sent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                      <span className="w-5 h-5 text-xs font-bold text-blue-600 flex items-center justify-center">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Save your tickets</p>
                      <p className="text-sm text-gray-600">Download or add to your mobile wallet</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                      <span className="w-5 h-5 text-xs font-bold text-blue-600 flex items-center justify-center">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Event day</p>
                      <p className="text-sm text-gray-600">Present QR code at entrance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Need Help?
                </h3>
                
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    If you have any questions about your order or tickets, we're here to help!
                  </p>
                  
                  <div className="space-y-2">
                    <p className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      support@events.com
                    </p>
                    
                    <p className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      +254 700 000 000
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Account CTA - Only show for guest orders without existing accounts */}
              {orderData.isGuestOrder && !user && !orderData?.hasAccount && (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Unlock More Benefits!</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Create an account to manage tickets, get faster checkout, and exclusive early access.
                  </p>
                  <Button 
                    onClick={() => setShowAccountModal(true)}
                    variant="outline"
                    className="w-full !bg-white !text-blue-600 hover:!bg-gray-100 !border-white font-semibold shadow"
                  >
                    Create Account Now
                  </Button>
                </div>
              )}

              {/* Login CTA - Show for guest orders with existing accounts */}
              {orderData.isGuestOrder && !user && orderData?.hasAccount && (
                <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Welcome Back!</h3>
                  <p className="text-green-100 text-sm mb-4">
                    You already have an account with us. Log in to access your tickets and order history.
                  </p>
                  <Button 
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full !bg-white !text-green-600 hover:!bg-gray-100 !border-white font-semibold shadow"
                  >
                    Log In to My Account
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Suggestion Modal */}
      <AccountSuggestionModal
        isOpen={showAccountModal}
        onClose={handleCloseModal}
        orderData={orderData}
        onCreateAccount={handleCreateAccount}
        onLogin={handleLogin}
      />
    </>
  );
};

export default PaymentConfirmation;