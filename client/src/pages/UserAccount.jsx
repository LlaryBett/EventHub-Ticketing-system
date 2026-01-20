import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { getUserProfile, getOrderHistory, getUserTickets } from '../services/userService';
import { formatPrice, formatDate } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { 
  Calendar,
  MapPin,
  Download,
  Share2,
  CreditCard,
  QrCode,
  Clock,
  Heart,
  Ticket, 
  FileText,
  User, 
  Receipt,
  Search,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const UserAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess } = useUI();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    if (location.state?.orderConfirmation) {
      showSuccess('Your order has been confirmed! Check your email for tickets.');
    }
  }, [location.state, showSuccess]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profile, orders, ticketsResponse] = await Promise.all([
          getUserProfile(user.data.id),
          getOrderHistory(user.data.id),
          getUserTickets(user.data.id)
        ]);

        setUserProfile(profile);
        setOrderHistory(Array.isArray(orders) ? orders : (orders?.data || []));
        setUserTickets(ticketsResponse.data || []);
        
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
    { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} /> },
    { id: 'orders', label: 'Orders', icon: <FileText size={20} /> },
    { id: 'saved', label: 'Saved', icon: <Heart size={20} /> },
    { id: 'account', label: 'Account', icon: <User size={20} /> },
  ];

  const userData = user?.data || {};

  const handleAddToCalendar = (ticket) => {
    const startDate = new Date(ticket.eventId?.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ticket.eventTitle)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(ticket.eventTitle)}&location=${encodeURIComponent(ticket.eventVenue)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleDownloadTicket = (ticket) => {
    const ticketData = `
      Event: ${ticket.eventTitle}
      Date: ${formatDate(ticket.eventId?.date)}
      Time: ${ticket.eventId?.time}
      Location: ${ticket.eventVenue}
      Ticket Type: ${ticket.ticketType}
    `;
    
    const blob = new Blob([ticketData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.eventTitle.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareEvent = (ticket) => {
    if (navigator.share) {
      navigator.share({
        title: ticket.eventTitle,
        text: `Check out this event: ${ticket.eventTitle}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`Check out this event: ${ticket.eventTitle} - ${window.location.href}`);
      showSuccess('Event link copied to clipboard!');
    }
  };

  const toggleFavorite = (eventId) => {
    setFavoriteEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:py-8">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8 text-center lg:text-left">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-600">Active Account</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            My Account
          </h1>
          <p className="text-xl text-gray-600 mt-3 max-w-2xl">
            {userTickets.length > 0 
              ? `You have ${userTickets.length} upcoming event${userTickets.length > 1 ? 's' : ''} - get ready to experience something amazing!`
              : "Your next adventure awaits. Discover events that match your interests."
            }
          </p>
        </div>

        {/* Order Confirmation */}
        {location.state?.orderConfirmation && (
          <div className="bg-green-500 rounded-2xl p-4 lg:p-6 mb-6 lg:mb-8 shadow-xl border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-lg lg:text-xl font-bold text-white">Order Confirmed!</h3>
                <p className="text-green-100 mt-1 text-sm lg:text-lg">
                  Your order #{location.state.orderConfirmation.confirmationCode} has been processed successfully.
                  E-tickets have been sent to your email.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-4">
                  {userData.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-gray-900 text-lg">{userData.name}</h2>
                <p className="text-gray-500 text-sm">{userData.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Event Enthusiast
                </div>
              </div>

              <nav className="space-y-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-4 text-left rounded-xl border-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tab.icon}
                    </div>
                    <span className="font-semibold ml-3">{tab.label}</span>
                    {tab.id === 'tickets' && userTickets.length > 0 && (
                      <span className={`ml-auto px-2 py-1 text-xs rounded-full font-bold ${
                        activeTab === tab.id 
                          ? 'bg-white text-blue-600' 
                          : 'bg-blue-500 text-white'
                      }`}>
                        {userTickets.length}
                      </span>
                    )}
                    <ArrowRight className={`w-4 h-4 ml-2 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-400'
                    }`} />
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  fullWidth
                  className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg"
                  onClick={() => navigate('/events')}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Discover Events
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'tickets' && (
              <div className="bg-white rounded-2xl lg:rounded-2xl shadow-sm lg:shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">My Tickets</h2>
                      <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-lg">Your upcoming events and digital tickets</p>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200 self-start">
                      <span className="text-sm font-semibold text-gray-700">
                        {userTickets.length} Ticket{userTickets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-8">
                  {userTickets.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-inner">
                        <Ticket className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg lg:text-2xl font-bold text-gray-900 mb-3">No events yet</h3>
                      <p className="text-gray-600 text-sm lg:text-lg mb-6 lg:mb-8 max-w-md mx-auto">
                        Your adventure starts here. Discover amazing events and get your first ticket to see it in your collection.
                      </p>
                      <Button
  onClick={() => navigate('/events')}
  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 lg:px-8 rounded-xl font-semibold shadow-lg text-base lg:text-lg"
>
  <Search className="w-4 h-4 lg:w-5 lg:h-5" />
  <span>Explore Events</span>
</Button>

                    </div>
                  ) : (
                    <div className="grid gap-4 lg:gap-6">
                      {userTickets.map((ticket) => (
                        <div key={ticket._id} className="bg-white rounded-xl lg:rounded-2xl border-2 border-gray-100 p-4 lg:p-6 shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-3">
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900">{ticket.eventTitle}</h3>
                                <div className="flex flex-wrap gap-2">
                                  <span className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-semibold border border-blue-200">
                                    <Ticket className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                                    {ticket.ticketType}
                                  </span>
                                  <span className={`flex items-center px-3 py-1.5 text-sm rounded-lg font-semibold border ${
                                    ticket.isUsed 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {ticket.isUsed ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                                        Checked In
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                                        Upcoming
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3 mb-4 lg:mb-6">
                                <div className="flex items-center text-gray-700">
                                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mr-3" />
                                  <div>
                                    <div className="font-semibold text-sm lg:text-base">Date</div>
                                    <div className="text-xs lg:text-sm">{formatDate(ticket.eventId?.date)}</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mr-3" />
                                  <div>
                                    <div className="font-semibold text-sm lg:text-base">Time</div>
                                    <div className="text-xs lg:text-sm">{ticket.eventId?.time}</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mr-3" />
                                  <div>
                                    <div className="font-semibold text-sm lg:text-base">Venue</div>
                                    <div className="text-xs lg:text-sm">{ticket.eventVenue}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                                <button
                                  onClick={() => handleAddToCalendar(ticket)}
                                  className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium border border-gray-200 hover:border-blue-200 text-sm"
                                >
                                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                                  Calendar
                                </button>
                                <button
                                  onClick={() => handleDownloadTicket(ticket)}
                                  className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium border border-gray-200 hover:border-green-200 text-sm"
                                >
                                  <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                                  Download
                                </button>
                                <button
                                  onClick={() => handleShareEvent(ticket)}
                                  className="flex items-center px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium border border-gray-200 hover:border-purple-200 text-sm"
                                >
                                  <Share2 className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                                  Share
                                </button>
                              </div>
                            </div>

                            {/* QR Code */}
                            <div className="lg:ml-6 flex justify-center lg:block">
                              <div className="bg-white border-2 border-gray-200 rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm">
                                <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white border border-gray-300 rounded-lg lg:rounded-xl flex items-center justify-center p-2">
                                  {ticket.qrCode ? (
                                    <img src={ticket.qrCode} alt="QR Code" className="w-16 h-16 lg:w-24 lg:h-24 object-contain" />
                                  ) : (
                                    <QrCode className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
                                  )}
                                </div>
                                <p className="text-center text-xs font-semibold text-gray-600 mt-2">SCAN TO ENTER</p>
                              </div>
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
              <div className="bg-white rounded-2xl lg:rounded-2xl shadow-sm lg:shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Order History</h2>
                  <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-lg">Your past orders and receipts</p>
                </div>
                <div className="p-4 lg:p-8">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Receipt className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm lg:text-lg">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl lg:rounded-2xl border-2 border-gray-100 p-4 lg:p-6 shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-base lg:text-lg font-bold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-gray-500 mt-1 text-sm lg:text-base">{formatDate(order.createdAt)}</p>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs lg:text-sm font-semibold mt-2 ${
                                order.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg lg:text-2xl font-bold text-gray-900">{formatPrice(order.totals?.total)}</p>
                              <div className="flex space-x-2 mt-2">
                                <Button 
                                  size="small" 
                                  variant="outline"
                                  onClick={() => openOrderModal(order)}
                                  className="border-2 border-gray-300 hover:border-blue-500 text-xs lg:text-sm"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="bg-white rounded-2xl lg:rounded-2xl shadow-sm lg:shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Saved Events</h2>
                  <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-lg">Events you're interested in</p>
                </div>
                <div className="p-4 lg:p-8">
                  {favoriteEvents.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Heart className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm lg:text-lg mb-2">No saved events yet.</p>
                      <p className="text-gray-500 text-sm lg:text-base">Click the heart icon on events to save them.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm">Your saved events will appear here.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-white rounded-2xl lg:rounded-2xl shadow-sm lg:shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Account Settings</h2>
                  <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-lg">Manage your profile and preferences</p>
                </div>
                <div className="p-4 lg:p-8">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          defaultValue={userData.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={userData.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          placeholder="City, State"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Preferences</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-gray-700">Event reminders</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-gray-700">New events matching your interests</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-gray-700">Special offers and promotions</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Methods</h3>
                      <div className="space-y-3">
                        {savedPaymentMethods.length === 0 ? (
                          <p className="text-gray-500 text-sm">No saved payment methods.</p>
                        ) : (
                          savedPaymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center">
                                <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="font-medium text-gray-900">**** **** **** {method.last4}</p>
                                  <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                                </div>
                              </div>
                              <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                        <Button variant="outline" size="small">
                          Add Payment Method
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'tickets' && userTickets.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {userTickets.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showOrderModal}
        onClose={closeOrderModal}
        title={`Order ${selectedOrder?.orderNumber || ''}`}
        size="large"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedOrder?.customerName}</h3>
              <p className="text-sm text-slate-500">{selectedOrder?.customerEmail}</p>
              <p className="text-xs text-slate-400 mt-1">Placed: {formatDate(selectedOrder?.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Payment</p>
              <p className="font-medium">{selectedOrder?.paymentMethod}</p>
              <p className="text-xs text-slate-400">{selectedOrder?.paymentDetails?.phone || ''}</p>
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          <div>
            <h4 className="font-medium mb-2">Billing Address</h4>
            <div className="text-sm text-slate-700">
              <div>{selectedOrder?.billingAddress?.firstName} {selectedOrder?.billingAddress?.lastName}</div>
              <div>{selectedOrder?.billingAddress?.email}</div>
              <div>{selectedOrder?.billingAddress?.phone}</div>
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          <div>
            <h4 className="font-medium mb-3">Items</h4>
            <div className="space-y-3">
              {selectedOrder?.items?.map((it) => (
                <div key={it._id} className="flex items-center gap-4">
                  <img src={it.eventId?.image} alt={it.title} className="w-16 h-10 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-slate-500">{formatDate(it.eventId?.date)} • {it.eventId?.time} • {it.eventId?.venue}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{it.quantity} × {formatPrice(it.price)}</div>
                    <div className="font-medium">{formatPrice((it.quantity || 0) * (it.price || 0))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-slate-600">
                <div>Subtotal</div>
                <div>{formatPrice(selectedOrder?.totals?.subtotal || 0)}</div>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <div>Tax</div>
                <div>{formatPrice(selectedOrder?.totals?.tax || 0)}</div>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <div>Discount</div>
                <div>-{formatPrice(selectedOrder?.totals?.discountAmount || 0)}</div>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-slate-900">
                <div>Total</div>
                <div>{formatPrice(selectedOrder?.totals?.total || 0)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={closeOrderModal}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserAccount;