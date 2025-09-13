// PaymentConfirmation.js - Updated to fetch from backend
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import { formatPrice } from '../utils/formatDate';
import { getOrderById } from '../services/checkoutService';

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
  const [showAccountSuggestion, setShowAccountSuggestion] = useState(false);
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

  useEffect(() => {
    if (orderData?.isGuestOrder && !user) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowAccountSuggestion(true);
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
    navigate('/login', {
      state: {
        prefill: {
          email: orderData.customerEmail || ''
        },
        message: "Looks like you already have an account! Log in to access your tickets."
      }
    });
  };

  const handleContinueAsGuest = () => {
    setShowAccountSuggestion(false);
    localStorage.setItem('hideAccountSuggestion', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading confirmation...</p>
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
          <Button onClick={() => navigate('/events')}>
            Browse More Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto container-padding">
        {/* Success Confirmation */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">Your order #{orderData.orderNumber} has been confirmed.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-semibold text-lg text-primary-600">
              {formatPrice(orderData.totals?.total)}
            </p>
            <p className="text-sm text-gray-500">
              Paid via {orderData.paymentMethod || 'M-Pesa'} • {orderData.paymentPhone}
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Your tickets have been sent to{' '}
            <strong>{orderData.guestInfo?.email || orderData.user?.email}</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/events')}>
              Browse More Events
            </Button>
            <Button onClick={() => navigate(`/orders/${orderId}`)}>
              View My Tickets
            </Button>
          </div>
        </div>

        {/* Account Suggestion */}
        {showAccountSuggestion && orderData.isGuestOrder && !user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 animate-fade-in">
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Create an Account</h3>
                <p className="text-sm text-blue-700">
                  Save your details for faster checkout and manage all your tickets in one place!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {orderData.hasAccount ? (
                <Button
                  size="small"
                  onClick={handleLogin}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Log In to Existing Account
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={handleCreateAccount}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Account (30 seconds)
                </Button>
              )}
              <Button variant="outline" size="small" onClick={handleContinueAsGuest}>
                Continue as Guest
              </Button>
            </div>
          </div>
        )}

        {/* Countdown */}
        {orderData.isGuestOrder && !user && !showAccountSuggestion && countdown > 0 && (
          <div className="text-center text-sm text-gray-500">
            <p>Account suggestion in {countdown} seconds...</p>
          </div>
        )}

        {/* Next Steps Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-full p-1 mr-3 flex-shrink-0">
                <span className="w-5 h-5 text-xs font-bold text-gray-600 flex items-center justify-center">
                  1
                </span>
              </div>
              <p>Check your email for ticket confirmation</p>
            </div>
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-full p-1 mr-3 flex-shrink-0">
                <span className="w-5 h-5 text-xs font-bold text-gray-600 flex items-center justify-center">
                  2
                </span>
              </div>
              <p>Present your ticket QR code at the event entrance</p>
            </div>
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-full p-1 mr-3 flex-shrink-0">
                <span className="w-5 h-5 text-xs font-bold text-gray-600 flex items-center justify-center">
                  3
                </span>
              </div>
              <p>You'll receive event reminders before the show</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;