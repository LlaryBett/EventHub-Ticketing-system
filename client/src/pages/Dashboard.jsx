import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { getUserProfile, getUserEvents, getOrderHistory, getUserTickets } from '../services/userService';
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAllNotifications 
} from '../services/notificationService';
import { formatPrice, formatDate } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { 
  Calendar,
  MapPin,
  Download,
  Share2,
  Bell,
  CreditCard,
  Star,
  QrCode,
  Clock,
  Users,
  MessageCircle,
  Settings,
  Heart,
  Filter,
  Search,
  Smartphone,
  Wallet,
  BarChart3,  // For overview/dashboard
  Ticket, 
  X,    // For tickets
  FileText,   // For orders/history
  User, 
  Trash2     // For delete notification
} from 'lucide-react';

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);

  console.log('Dashboard user data:', user);

  useEffect(() => {
    if (location.state?.orderConfirmation) {
      showSuccess('Your order has been confirmed! Check your email for tickets.');
    }
  }, [location.state, showSuccess]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profile, events, orders, ticketsResponse, notificationsData] = await Promise.all([
          getUserProfile(user.data.id),
          getUserEvents(user.data.id),
          getOrderHistory(user.data.id),
          getUserTickets(user.data.id),
          getUserNotifications(user.data.id)
        ]);

        setUserProfile(profile);
        setUserEvents(events.data || []);
        setOrderHistory(Array.isArray(orders) ? orders : (orders?.data || []));
        setUserTickets(ticketsResponse.data || []);
        setNotifications(notificationsData.data || []);
        
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

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllAsRead(user.data.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      showError('Failed to mark notifications as read');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotifications(user.data.id);
      setNotifications([]);
      showSuccess('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      showError('Failed to clear notifications');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      showSuccess('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      // Log the notification ID to debug
      console.log('Deleting notification with ID:', notificationId);
      
      if (!notificationId) {
        showError('Invalid notification ID');
        return;
      }

      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      showSuccess('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showError('Failed to delete notification');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={20} /> },
    { id: 'tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
    { id: 'events', label: 'My Events', icon: <Calendar size={20} /> },
    { id: 'orders', label: 'Order History', icon: <FileText size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ];


 

  const userData = user?.data || {};

  // Stats for overview
  const totalEvents = userProfile?.analytics?.organizerStats?.totalEvents ?? userEvents.length;
  const upcomingEvents = userProfile?.analytics?.upcomingEvents ?? userEvents.filter(e => new Date(e.date) > new Date()).length;
  const eventsAttended = userProfile?.analytics?.eventsAttended ?? userProfile?.eventsAttended ?? 0;
  const totalSpent = userProfile?.analytics?.totalSpent ?? 0;

  const handleAddToCalendar = (event) => {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || event.venue)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleDownloadTicket = (event) => {
    // Mock download functionality
    const ticketData = `
      Event: ${event.title}
      Date: ${formatDate(event.date)}
      Time: ${event.time}
      Location: ${event.location || event.venue}
      Ticket Type: ${event.ticketType}
      QR Code: ${event.qrCode}
    `;
    
    const blob = new Blob([ticketData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareEvent = (event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`Check out this event: ${event.title} - ${window.location.href}`);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {userProfile?.name || userData.name}! ✨
          </h1>
          <p className="text-slate-600 mt-3 text-lg">Manage your events, view your tickets, and update your profile.</p>
        </div>

        {/* Order Confirmation */}
        {location.state?.orderConfirmation && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Order Confirmed!</h3>
                <p className="text-green-700 mt-1">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {userData.name?.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className="font-bold text-slate-900">{userData.name}</h2>
                  <p className="text-sm text-slate-500">{userData.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="mr-3 text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
    <div className="flex items-center">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Calendar className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-slate-500 font-medium">Total Events</p>
        <p className="text-3xl font-bold text-slate-900">{totalEvents}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
    <div className="flex items-center">
      <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Clock className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-slate-500 font-medium">Upcoming</p>
        <p className="text-3xl font-bold text-slate-900">{upcomingEvents}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
    <div className="flex items-center">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
        <QrCode className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-slate-500 font-medium">Events Attended</p>
        <p className="text-3xl font-bold text-slate-900">{eventsAttended}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
    <div className="flex items-center">
      <div className="ml-4">
        <p className="text-sm text-slate-500 font-medium">Total Spent</p>
        <p className="text-3xl font-bold text-slate-900">{formatPrice(totalSpent)}</p>
      </div>
    </div>
  </div>
</div>

                {/* Quick Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button fullWidth className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Events
                    </Button>
                    <Button variant="outline" fullWidth className="flex items-center justify-center border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200">
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan Ticket
                    </Button>
                    <Button variant="outline" fullWidth className="flex items-center justify-center border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <QrCode className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Checked in to Tech event</p>
                        <p className="text-xs text-slate-500">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Registered for Startup Pitch Competition</p>
                        <p className="text-xs text-slate-500">1 week ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">My Tickets 🎫</h2>
                  <p className="text-slate-600 mt-2">Access your digital tickets and QR codes</p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {userTickets.map((ticket) => (
                      <div key={ticket._id} className="border-2 border-slate-100 rounded-2xl p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900">{ticket.eventTitle}</h3>
                            <div className="flex items-center text-slate-600 mt-3 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span className="text-sm">{formatDate(ticket.eventId?.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="text-sm">{ticket.eventId?.time}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">{ticket.eventVenue}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 shadow-lg">
                              {ticket.qrCode ? (
                                <img src={ticket.qrCode} alt="QR Code" className="w-24 h-24 object-contain" />
                              ) : (
                                <QrCode className="w-14 h-14 text-slate-400" />
                              )}
                            </div>
                            <p className="text-xs text-center mt-2 text-slate-500 font-medium">QR Code</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-full font-semibold">
                              {ticket.ticketType}
                            </span>
                            <span className={`px-4 py-2 text-sm rounded-full font-semibold ${
                              ticket.isUsed 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                                : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                            }`}>
                              {ticket.isUsed ? 'Checked In' : 'Pending Check-in'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownloadTicket(ticket)}
                              className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Download Ticket"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAddToCalendar(ticket)}
                              className="p-3 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Add to Calendar"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareEvent(ticket)}
                              className="p-3 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Share Event"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Add to Wallet"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">My Events 📅</h2>
                      <p className="text-slate-600 mt-2">Events you're attending or have attended</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                        <Filter className="w-5 h-5" />
                      </button>
                      <button className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {userEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                      <p className="text-slate-500 mb-6 text-lg">You haven't registered for any events yet.</p>
                      <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">Browse Events</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userEvents.map((event) => (
                        <div key={event._id} className="border-2 border-slate-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-white to-slate-50">
                          <div className="flex items-start justify-between">
                            <div className="flex">
                              <img 
                                src={event.image} 
                                alt={event.title}
                                className="w-20 h-20 rounded-2xl object-cover mr-6 shadow-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                                  <button
                                    onClick={() => toggleFavorite(event._id)}
                                    className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                      favoriteEvents.includes(event._id)
                                        ? 'text-red-500 hover:text-red-600'
                                        : 'text-gray-400 hover:text-red-500'
                                    }`}
                                  >
                                    <Heart className={`w-5 h-5 ${favoriteEvents.includes(event._id) ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <p className="text-sm text-slate-600 mt-2">{event.description?.substring(0, 100)}...</p>
                                <div className="flex items-center text-sm text-slate-500 mt-3 space-x-4">
                                  <span>{formatDate(event.date)}</span>
                                  <span>{event.time}</span>
                                  <span>{event.location || event.venue}</span>
                                </div>
                                <div className="flex items-center mt-3 space-x-3">
                                  <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                                    new Date(event.date) > new Date() 
                                      ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                                      : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                                  }`}>
                                    {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                                  </span>
                                  <span className="px-3 py-1 text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full font-semibold">
                                    {event.ticketType}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button size="small" variant="outline" className="border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50">View Details</Button>
                              <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Notifications 🔔</h2>
                    <div className="flex space-x-3">
                      <Button 
                        size="small" 
                        variant="outline" 
                        className="border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                        onClick={handleMarkAllNotificationsRead}
                      >
                        Mark All Read
                      </Button>
                      <Button 
                        size="small" 
                        variant="outline" 
                        className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        onClick={handleClearAllNotifications}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div 
                      key={notification._id} 
                      className={`p-6 transition-all duration-200 hover:bg-slate-50 ${
                        !notification.read ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <button 
                            className={`w-3 h-3 rounded-full mt-2 mr-4 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-500 animate-pulse hover:bg-blue-600' : 'bg-slate-300'
                            }`}
                            onClick={() => !notification.read && handleMarkNotificationRead(notification._id)}
                            disabled={notification.read}
                            title={notification.read ? "Already read" : "Mark as read"}
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Bell className="w-4 h-4 text-slate-500 mr-2" />
                              <span className={`text-sm font-semibold ${
                                notification.type === 'reminder' ? 'text-orange-600' : 'text-blue-600'
                              }`}>
                                {notification.type === 'reminder' ? 'Reminder' : 'Update'}
                              </span>
                            </div>
                            <p className="text-slate-900 mt-2 font-medium">{notification.message}</p>
                            <p className="text-sm text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group flex items-center gap-2"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Payment Methods */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">Payment Methods 💳</h2>
                      <Button size="small" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">Add New Card</Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {savedPaymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-6 border-2 border-slate-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-slate-50">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mr-4">
                              <CreditCard className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">**** **** **** {method.last4}</p>
                              <p className="text-sm text-slate-500">Expires {method.expiry}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="small" variant="outline" className="border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50">Edit</Button>
                            <Button size="small" variant="outline" className="border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600">Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spending Summary */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-slate-900">Spending Summary 📊</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900">$272</p>
                        <p className="text-sm text-slate-500 font-medium">This Month</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900">$1,248</p>
                        <p className="text-sm text-slate-500 font-medium">This Year</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900">3</p>
                        <p className="text-sm text-slate-500 font-medium">Events Attended</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">Favorite Events ❤️</h2>
                  <p className="text-slate-600 mt-2">Events and organizers you've marked as favorites</p>
                </div>
                <div className="p-6">
                  {favoriteEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                      <p className="text-slate-500 mb-4 text-lg">No favorite events yet.</p>
                      <p className="text-sm text-slate-400">Click the heart icon on events to add them to your favorites.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userEvents
                        .filter(event => favoriteEvents.includes(event._id))
                        .map((event) => (
                          <div key={event._id} className="border-2 border-slate-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-white to-slate-50">
                            <img 
                              src={event.image} 
                              alt={event.title}
                              className="w-full h-40 object-cover rounded-2xl mb-4 shadow-lg"
                            />
                            <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                            <p className="text-sm text-slate-600 mt-2">{formatDate(event.date)}</p>
                            <div className="flex justify-between items-center mt-3">
                              <Button size="small" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">View Event</Button>
                              <button
                                onClick={() => toggleFavorite(event._id)}
                                className="p-2 text-red-500 hover:text-red-600 transition-all duration-200 transform hover:scale-110"
                              >
                                <Heart className="w-5 h-5 fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">Order History 📝</h2>
                  <p className="text-slate-600 mt-2">View and download your order receipts</p>
                </div>
                <div className="p-6">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                      <p className="text-slate-500 text-lg">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="border-2 border-slate-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-slate-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900 text-lg">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full mt-3 font-semibold ${
                                order.status === 'confirmed' 
                                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                  : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-900">{formatPrice(order.totals?.total)}</p>
                              <div className="flex space-x-2 mt-2">
                                <Button size="small" variant="outline" className="border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50">
                                  <Download className="w-4 h-4 mr-1" />
                                  Receipt
                                </Button>
                                <Button size="small" variant="outline" className="border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50">View Details</Button>
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

            {activeTab === 'profile' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">Profile Settings 👤</h2>
                  <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
                </div>
                <div className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                        <input
                          type="text"
                          defaultValue={userData.name}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={userData.email}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                        <input
                          type="text"
                          placeholder="City, State"
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
                      <textarea
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      ></textarea>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-slate-700 font-medium">Email notifications for new events</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-slate-700 font-medium">Event reminders</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-slate-700 font-medium">Newsletter subscription</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                          <span className="text-slate-700 font-medium">SMS notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                          <span className="text-slate-700 font-medium">Push notifications</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Privacy Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-slate-700 font-medium">Show my attendance to other users</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                          <span className="text-slate-700 font-medium">Allow event organizers to contact me</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                          <span className="text-slate-700 font-medium">Include me in event networking features</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t-2 border-slate-100">
                      <Button variant="outline" className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50">Cancel</Button>
                      <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">Save Changes</Button>
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