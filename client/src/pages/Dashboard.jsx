import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { getUserProfile, getUserEvents } from '../services/userService';
import cartService from '../services/cartService';
import { formatPrice, formatDate } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess } = useUI();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  console.log('Dashboard user data:', user);

  useEffect(() => {
    if (location.state?.orderConfirmation) {
      showSuccess('Your order has been confirmed! Check your email for tickets.');
    }
  }, [location.state, showSuccess]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profile, events, orders] = await Promise.all([
          getUserProfile(user.data.id),
          getUserEvents(user.data.id),
          cartService.getOrderHistory(user.data.id)
        ]);
        
        setUserProfile(profile);
        setUserEvents(events.data || []);
        setOrderHistory(orders);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'events', label: 'My Events', icon: '🎫' },
    { id: 'orders', label: 'Order History', icon: '📝' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your events, view your tickets, and update your profile.</p>
        </div>

        {/* Order Confirmation */}
        {location.state?.orderConfirmation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Order Confirmed!</h3>
                <p className="text-green-600 mt-1">
                  Your order #{location.state.orderConfirmation.confirmationCode} has been processed successfully.
                  E-tickets have been sent to your email.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.name?.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3 text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Events</p>
                        <p className="text-2xl font-bold text-gray-900">{userProfile?.eventsAttended || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Upcoming Events</p>
                        <p className="text-2xl font-bold text-gray-900">{userProfile?.upcomingEvents || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-lg font-bold text-gray-900">
                          {userProfile ? formatDate(userProfile.joinedDate) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button fullWidth>Browse Events</Button>
                    <Button variant="outline" fullWidth>Update Profile</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">My Events</h2>
                </div>
                <div className="p-6">
                  {userEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
                      <Button>Browse Events</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                event.status === 'upcoming' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{event.ticketType} Ticket</p>
                              <Button size="small" variant="outline">View Details</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                </div>
                <div className="p-6">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.confirmationCode}</h3>
                              <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                order.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">{formatPrice(order.total)}</p>
                              <Button size="small" variant="outline">View Details</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                </div>
                <div className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          defaultValue={user.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={user.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-gray-700">Email notifications for new events</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-gray-700">Newsletter subscription</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" />
                          <span className="text-gray-700">SMS notifications</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;