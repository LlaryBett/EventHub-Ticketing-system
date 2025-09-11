import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatDate';
import Button from '../common/Button';

const CartSidebar = () => {
  const { 
    cartItems, 
    isOpen, 
    setIsOpen, 
    removeFromCart, 
    updateQuantity, 
    getTotalPrice 
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Enhanced Backdrop with Gradient */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar with Enhanced Styling */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-white to-gray-50/80 shadow-2xl z-50 transform transition-all duration-300 ease-out border-l border-gray-100">
        <div className="flex flex-col h-full backdrop-blur-sm">
          {/* Enhanced Header */}
          <div className="relative bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center justify-between p-6">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">EventHub</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  My Tickets
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="group p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                style={{ width: cartItems.length > 0 ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          {/* Cart Items with Enhanced Styling */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No tickets yet</h3>
                <p className="text-gray-500 mb-6">Add some amazing events to get started!</p>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Book Events
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(cartItems) && cartItems.map((item, index) => (
                  <div 
                    key={item._id || item.id} 
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
                    style={{ 
                      animation: `slideInUp 0.3s ease-out ${index * 0.1}s both` 
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Enhanced Image */}
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={item.event?.image}
                          alt={item.event?.title}
                          className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Enhanced Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {item.event?.title}
                        </h3>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {item.event?.date}
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.event?.time}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-gray-50 rounded-full px-1">
                            <button
                              onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-sm font-semibold w-10 text-center text-gray-700">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatPrice(item.price)} each
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item._id || item.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-all duration-200 hover:scale-110"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          {cartItems.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 p-6 space-y-4">
              {/* Total Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(getTotalPrice())}
                      </span>
                      <div className="flex items-center text-xs text-green-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Tax included
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{cartItems.length} tickets</p>
                    <p className="text-sm font-medium text-gray-700">
                      Avg. {formatPrice(getTotalPrice() / cartItems.reduce((sum, ticket) => sum + ticket.quantity, 0))}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Link to="/checkout" onClick={() => setIsOpen(false)}>
                  <Button 
                    fullWidth 
                    size="large"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Proceed to Checkout</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsOpen(false)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Continue Browsing Events
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center space-x-4 pt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure checkout
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free cancellation
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3B82F6, #8B5CF6);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563EB, #7C3AED);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default CartSidebar;