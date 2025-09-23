import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Calendar, Users, DollarSign, TrendingUp, Plus, Search, Filter, 
  Download, Edit, Copy, Trash2, Eye, Settings, Bell, Moon, Sun,
  MoreHorizontal, CheckCircle, Clock, AlertCircle, Mail, MessageSquare,
  QrCode, CreditCard, Upload, UserPlus, BarChart3, PieChart as PieChartIcon,
  MapPin, Tag, Ticket, RefreshCw, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { getMe } from '../services/userService';
import { getEventAttendees, exportEventAttendees, checkInAttendee } from '../services/userService';
import { formatDate, formatPrice } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import QRScanner from '../components/common/QRScanner'; // Add this import

const OrganizerDashboard = () => {
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    upcomingEvents: 0,
    revenueGrowth: 0,
    attendeeGrowth: 0
  });
  const [chartData, setChartData] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(5);
  
  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Settings State
  const [organizerSettings, setOrganizerSettings] = useState({
    name: '',
    email: '',
    description: '',
    logo: '',
    notifications: {
      newRegistrations: true,
      weeklyReports: true,
      smsUpdates: false
    },
    payoutDetails: {
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    }
  });

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Add some sample categories for demonstration
  const eventCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'arts', label: 'Arts' },
    { value: 'other', label: 'Other' }
  ];

  // Load initial data
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);

        // Set analytics from backend response
        const analyticsData = userData.data.analytics || {};
        setAnalytics({
          totalEvents: analyticsData.totalEvents || 0,
          totalRevenue: analyticsData.totalRevenue || 0,
          totalAttendees: analyticsData.totalAttendees || 0,
          upcomingEvents: analyticsData.upcomingEvents || 0,
          revenueGrowth: analyticsData.revenueGrowth || 0,
          attendeeGrowth: analyticsData.attendeeGrowth || 0,
          currentPeriodRevenue: analyticsData.currentPeriodRevenue || 0,
          previousPeriodRevenue: analyticsData.previousPeriodRevenue || 0,
          currentPeriodAttendees: analyticsData.currentPeriodAttendees || 0,
          previousPeriodAttendees: analyticsData.previousPeriodAttendees || 0
        });

        setChartData(
          (analyticsData.revenueTrend || []).map(item => ({
            month: new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
            revenue: item.revenue,
            attendees: item.tickets
          }))
        );

        setOrganizerEvents(analyticsData.eventPerformance || []);
        setFilteredEvents(analyticsData.eventPerformance || []);
        setRecentEvents(analyticsData.recentEvents || []);

        setOrganizerSettings({
          ...organizerSettings,
          name: userData.data.organizerProfile?.organizationName || userData.data.name,
          email: userData.data.email,
          description: userData.data.organizerProfile?.businessAddress || '',
          logo: userData.data.organizerProfile?.logo || ''
        });

      } catch (error) {
        console.error('Failed to fetch organizer data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, [showError]);

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = organizerEvents;
    
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        if (statusFilter === 'upcoming') return eventDate > now;
        if (statusFilter === 'past') return eventDate <= now;
        if (statusFilter === 'published') return event.status === 'published';
        if (statusFilter === 'draft') return event.status === 'draft';
        return true;
      });
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }
    
    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, organizerEvents]);

  // Event Actions
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      await eventService.deleteEvent(selectedEvent.id);
      setOrganizerEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
      showSuccess('Event deleted successfully');
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      showError('Failed to delete event');
      // Use error for logging
      console.error(error);
    }
  };

  const handleDuplicateEvent = async (eventData) => {
    try {
      // Call your backend API to duplicate event
      // const duplicatedEvent = await eventService.duplicateEvent(selectedEvent.id, eventData);
      showSuccess('Event duplicated successfully');
      setShowDuplicateModal(false);
      setSelectedEvent(null);
      // Use eventData for logging or debugging
      console.debug('Duplicated event with data:', eventData);
      // Refresh events list
    } catch (error) {
      showError('Failed to duplicate event');
      // Use error for logging
      console.error(error);
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      // Call your backend API to update event
      // await eventService.updateEvent(selectedEvent.id, eventData);
      showSuccess('Event updated successfully');
      setShowEditModal(false);
      setSelectedEvent(null);
      // Use eventData for logging or debugging
      console.debug('Updated event with data:', eventData);
      // Refresh events list
    } catch (error) {
      showError('Failed to update event');
      // Use error for logging
      console.error(error);
    }
  };

  const handleSendNotification = async (notificationData) => {
    try {
      // Call your backend API to send notifications
      // await eventService.sendNotificationToAttendees(selectedEvent.id, notificationData);
      showSuccess('Notification sent successfully');
      setShowNotificationModal(false);
      // Use notificationData for logging or debugging
      console.debug('Notification sent with data:', notificationData);
    } catch (error) {
      showError('Failed to send notification');
      // Use error for logging
      console.error(error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      // Call your backend API to update organizer settings
      // await organizerService.updateSettings(organizerSettings);
      showSuccess('Settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      showError('Failed to update settings');
      // Use error for logging
      console.error(error);
    }
  };

  const exportAttendees = async (eventId, format = 'csv') => {
    try {
      // Call your backend API to export attendees
      // const exportData = await eventService.exportAttendees(eventId, format);
      showSuccess(`Attendees exported as ${format.toUpperCase()}`);
    } catch (error) {
      showError('Failed to export attendees');
      // Use error for logging
      console.error(error);
    }
  };

  // QR Scanner Handlers
  const handleScanSuccess = async (decodedText, decodedResult) => {
    setScanResult(decodedText);
    try {
      // Extract ticket ID from QR code data
      let ticketId = decodedText;
      if (decodedText.startsWith('{')) {
        const qrData = JSON.parse(decodedText);
        ticketId = qrData.ticketId || qrData.id;
      }
      // Always call userService to verify ticket against backend
      const checkinResponse = await checkInAttendee(ticketId);

      // Display backend message if available, otherwise fallback
      if (checkinResponse && checkinResponse.message) {
        showSuccess(checkinResponse.message);
      } else if (checkinResponse && checkinResponse.error) {
        showError(checkinResponse.error);
      } else if (checkinResponse && checkinResponse.success) {
        showSuccess('Attendee checked in successfully!');
      } else {
        showSuccess('Check-in completed.');
      }

      // Use decodedResult for debugging
      if (decodedResult) {
        console.debug('Decoded QR result:', decodedResult);
      }
      // Refresh attendees list
      if (selectedEvent?.eventId) {
        const response = await getEventAttendees(selectedEvent.eventId);
        setAttendees(response?.data?.attendees || []);
        setAttendeeStats(response?.data?.stats || {});
      }
      setShowQRScanner(false);
    } catch (error) {
      // Display backend error message if available
      if (error?.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error?.message) {
        showError(error.message);
      } else {
        showError('Failed to check in attendee. Please try again.');
      }
      console.error('Check-in failed:', error);
    }
  };

  const handleScanError = (errorMessage) => {
    // Optional: Handle scan errors quietly or show subtle notification
    console.log('QR Scan Error:', errorMessage);
  };

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  // Use currentEvents for debugging or logging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('Current paginated events:', currentEvents);
  }
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'attendees', label: 'Attendees', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const [attendees, setAttendees] = useState([]);
  const [attendeeStats, setAttendeeStats] = useState({});
  const [modalEventInfo, setModalEventInfo] = useState(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false); // NEW

  // When opening the Attendees Modal, fetch attendees for the selected event
  useEffect(() => {
    const fetchAttendees = async () => {
      if (showAttendeesModal && selectedEvent?.eventId) {
        setAttendeesLoading(true); // NEW
        setAttendees([]); // Reset to avoid stale data
        setAttendeeStats({});
        setModalEventInfo(null);
        try {
          const response = await getEventAttendees(selectedEvent.eventId);
          setAttendees(response?.data?.attendees || []);
          setAttendeeStats(response?.data?.stats || {});
          setModalEventInfo(response?.data?.event || null);
        } catch (err) {
          showError('Failed to fetch attendees');
          setAttendees([]);
          setAttendeeStats({});
          setModalEventInfo(null);
          // Use err for logging
          console.error(err);
        } finally {
          setAttendeesLoading(false); // NEW
        }
      }
    };
    fetchAttendees();
  }, [showAttendeesModal, selectedEvent, showError]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Organizer Dashboard
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Manage your events and track your success
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <Link to="/organizer">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.data.name?.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.data.name}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Event Organizer
                  </p>
                  {user.data.organizerProfile?.verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-700'
                          : darkMode 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Events</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {analytics.totalEvents}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Revenue</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(analytics.totalRevenue)}
                        </p>
                        <p className="text-sm text-green-600">↑ {analytics.revenueGrowth}%</p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Attendees</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {analytics.totalAttendees}
                        </p>
                        <p className="text-sm text-green-600">↑ {analytics.attendeeGrowth}%</p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Upcoming Events</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {analytics.upcomingEvents}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Event Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendees" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Events */}
                <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Events
                    </h2>
                  </div>
                  <div className="p-6">
                    {recentEvents.slice(0, 3).map((event) => (
                      <div key={event.eventId} className={`flex items-center justify-between py-4 border-b last:border-b-0 ${darkMode ? 'border-gray-700' : ''}`}>
                        <div className="flex items-center">
                          {/* No image in backend, use placeholder */}
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {event.title}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {formatDate(event.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {event.attendees} registered
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatPrice(event.revenue)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      My Events
                    </h2>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`px-3 py-2 border rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="all">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>

                      {/* Category Filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={`px-3 py-2 border rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {eventCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      
                      <Link to="/organizer">
                        <Button className="flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Create Event</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray'}`}>
                        You haven't created any events yet.
                      </p>
                      <Link to="/organizer">
                        <Button>Create Your First Event</Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent).map((event) => (
                          <React.Fragment key={event.eventId}>
                            {/* Registered Attendees Count - visible and separated above the card */}
                            <div className={`mb-2 text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {event.title}
                              <span className="ml-2 text-primary-600">
                                {event.registered !== undefined ? event.registered : event.attendees || 0} registered attendees
                              </span>
                            </div>
                            <div className={`border rounded-lg p-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {event.title}
                                  </h3>
                                  <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                    <p>{formatDate(event.date)}</p>
                                    <p className="flex items-center">
                                      <Users className="w-4 h-4 mr-2" />
                                      {event.attendees}/{event.capacity} registered
                                    </p>
                                    <p className="flex items-center">
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      {formatPrice(event.revenue)} revenue
                                    </p>
                                  </div>
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                      event.isUpcoming
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {event.isUpcoming ? 'Upcoming' : 'Past'}
                                    </span>
                                  </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  <Button 
                                    size="small" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowAttendeesModal(true);
                                    }}
                                  >
                                    <Users className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowDuplicateModal(true);
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowNotificationModal(true);
                                    }}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="danger"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {/* Event Stats */}
                              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : ''}`}>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {event.attendees}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      Attendees
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-green-600">
                                      {formatPrice(event.revenue)}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      Revenue
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {event.capacityUtilization}%
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      Capacity
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-4 mt-6">
                          <Button
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                          >
                            Previous
                          </Button>
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attendees' && (
              <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Attendee Management
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {organizerEvents.map((event) => (
                      <div key={event.id} className={`border rounded-lg p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {/* Show event title and registered attendees count at the top of each attendee card */}
                        <div className="mb-2">
                          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</span>
                          <span className="ml-2 text-primary-600">
                            {event.registered !== undefined ? event.registered : event.attendees || 0} registered attendees
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {event.title}
                          </h3>
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowAttendeesModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <p>{formatDate(event.date)}</p>
                          <div className="flex space-x-2 mt-3">
                            <Button 
                              size="small" 
                              variant="outline"
                              onClick={() => exportAttendees(event.id, 'csv')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              CSV
                            </Button>
                            <Button 
                              size="small" 
                              variant="outline"
                              onClick={() => exportAttendees(event.id, 'excel')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Excel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Advanced Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Revenue vs Attendees
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="attendees" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Event Categories
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Technology', value: 40, color: '#3B82F6' },
                            { name: 'Business', value: 30, color: '#10B981' },
                            { name: 'Arts', value: 20, color: '#F59E0B' },
                            { name: 'Other', value: 10, color: '#EF4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[
                            { name: 'Technology', value: 40, color: '#3B82F6' },
                            { name: 'Business', value: 30, color: '#10B981' },
                            { name: 'Arts', value: 20, color: '#F59E0B' },
                            { name: 'Other', value: 10, color: '#EF4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Event Performance Table */}
                <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Event Performance Analysis
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Event
                            </th>
                            <th className={`text-left py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Registration Rate
                            </th>
                            <th className={`text-left py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Revenue
                            </th>
                            <th className={`text-left py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              ROI
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizerEvents.map((event) => {
                            const registrationRate = event.capacity ? (event.attendees / event.capacity) * 100 : 0;
                            const revenue = event.revenue;
                            return (
                              <tr key={event.eventId} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  <div>
                                    <div className="font-medium">{event.title}</div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                      {formatDate(event.date)}
                                    </div>
                                  </div>
                                </td>
                                <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                      <div 
                                        className="bg-primary-600 h-2 rounded-full" 
                                        style={{ width: `${registrationRate}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm">{registrationRate.toFixed(1)}%</span>
                                  </div>
                                </td>
                                <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {formatPrice(revenue)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-green-600 font-medium">
                                    +{((revenue / 1000) * 100).toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Profile Settings */}
                <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Organizer Profile
                    </h2>
                  </div>
                  <div className="p-6">
                    <form className="space-y-6">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img
                            src={organizerSettings.logo || '/api/placeholder/100/100'}
                            alt="Organization Logo"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                          <Button
                            size="small"
                            className="absolute -bottom-2 -right-2 rounded-full p-2"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        <div>
                          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Organization Logo
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Upload a logo for your organization
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={organizerSettings.name}
                            onChange={(e) => setOrganizerSettings({...organizerSettings, name: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={organizerSettings.email}
                            onChange={(e) => setOrganizerSettings({...organizerSettings, email: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Organization Description
                        </label>
                        <textarea
                          rows={4}
                          value={organizerSettings.description}
                          onChange={(e) => setOrganizerSettings({...organizerSettings, description: e.target.value})}
                          placeholder="Tell people about your organization..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </form>
                  </div>
                </div>

                {/* Payout Settings */}
                <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Payout Settings
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={organizerSettings.payoutDetails.bankName}
                          onChange={(e) => setOrganizerSettings({
                            ...organizerSettings,
                            payoutDetails: {...organizerSettings.payoutDetails, bankName: e.target.value}
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={organizerSettings.payoutDetails.accountNumber}
                          onChange={(e) => setOrganizerSettings({
                            ...organizerSettings,
                            payoutDetails: {...organizerSettings.payoutDetails, accountNumber: e.target.value}
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notification Preferences
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={organizerSettings.notifications.newRegistrations}
                          onChange={(e) => setOrganizerSettings({
                            ...organizerSettings,
                            notifications: {...organizerSettings.notifications, newRegistrations: e.target.checked}
                          })}
                          className="mr-3 w-4 h-4 text-primary-600" 
                        />
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Email notifications for new registrations
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={organizerSettings.notifications.weeklyReports}
                          onChange={(e) => setOrganizerSettings({
                            ...organizerSettings,
                            notifications: {...organizerSettings.notifications, weeklyReports: e.target.checked}
                          })}
                          className="mr-3 w-4 h-4 text-primary-600" 
                        />
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Weekly analytics reports
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={organizerSettings.notifications.smsUpdates}
                          onChange={(e) => setOrganizerSettings({
                            ...organizerSettings,
                            notifications: {...organizerSettings.notifications, smsUpdates: e.target.checked}
                          })}
                          className="mr-3 w-4 h-4 text-primary-600" 
                        />
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          SMS notifications for urgent updates
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleUpdateSettings}>Save Changes</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        
        {/* Delete Event Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Event"
        >
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteEvent}>
                Delete Event
              </Button>
            </div>
          </div>
        </Modal>

        {/* Duplicate Event Modal */}
        <Modal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          title="Duplicate Event"
        >
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Create a copy of "{selectedEvent?.title}"?
            </p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Event Title
                </label>
                <input
                  type="text"
                  defaultValue={selectedEvent ? `${selectedEvent.title} (Copy)` : ''}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Event Date
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleDuplicateEvent({})}>
                Duplicate Event
              </Button>
            </div>
          </div>
        </Modal>

        {/* Send Notification Modal */}
        <Modal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          title="Send Notification"
        >
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Send update to attendees of "{selectedEvent?.title}"
            </p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Event update subject..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Your message to attendees..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>SMS</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSendNotification({})}>
                Send Notification
              </Button>
            </div>
          </div>
        </Modal>

        {/* Attendees Modal */}
        <Modal
          isOpen={showAttendeesModal}
          onClose={() => {
            setShowAttendeesModal(false);
            setShowQRScanner(false); // Close scanner when modal closes
          }}
          title={`Attendees - ${modalEventInfo?.title || selectedEvent?.title}`}
          size="large"
        >
          <div className="space-y-4">
            {/* Event Info and Stats */}
            {modalEventInfo && (
              <div className="flex items-center space-x-4 mb-2">
                <img
                  src={modalEventInfo.image}
                  alt={modalEventInfo.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {modalEventInfo.title}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {formatDate(modalEventInfo.date)} &bull; {modalEventInfo.venue}
                  </p>
                </div>
              </div>
            )}
            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-2">
              <div>
                <span className="font-bold">{attendeeStats.totalAttendees || 0}</span>
                <span className="ml-1 text-sm">Total Attendees</span>
              </div>
              <div>
                <span className="font-bold text-green-600">{attendeeStats.checkedIn || 0}</span>
                <span className="ml-1 text-sm">Checked In</span>
              </div>
              <div>
                <span className="font-bold text-red-600">{attendeeStats.notCheckedIn || 0}</span>
                <span className="ml-1 text-sm">Not Checked In</span>
              </div>
              <div>
                <span className="font-bold">{formatPrice(attendeeStats.totalRevenue || 0)}</span>
                <span className="ml-1 text-sm">Revenue</span>
              </div>
            </div>
            {/* Ticket Type Breakdown */}
            {attendeeStats.ticketTypes && (
              <div className="mb-2">
                <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ticket Types</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(attendeeStats.ticketTypes).map(([type, info]) => (
                    <div key={type} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800">
                      <span className="font-bold">{type}</span>
                      <span className="ml-2 text-sm">Count: {info.count}</span>
                      <span className="ml-2 text-sm">Revenue: {formatPrice(info.revenue)}</span>
                      <span className="ml-2 text-sm text-green-600">Checked In: {info.checkedIn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Export and Scanner Buttons */}
            <div className="flex space-x-4 mb-2">
              <Button 
                size="small"
                onClick={() => exportEventAttendees(selectedEvent?.eventId, 'csv')}
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button 
                size="small"
                onClick={() => exportEventAttendees(selectedEvent?.eventId, 'excel')}
              >
                <Download className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
              {/* Add QR Scanner Button */}
              <Button 
                size="small"
                variant={showQRScanner ? "primary" : "outline"}
                onClick={() => setShowQRScanner(!showQRScanner)}
              >
                <QrCode className="w-4 h-4 mr-1" />
                {showQRScanner ? 'Hide Scanner' : 'Scan Ticket'}
              </Button>
            </div>
            {/* QR Scanner Section */}
            {showQRScanner && (
              <div className="mb-4 p-4 border rounded-lg">
                <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Scan Ticket QR Code
                </h4>
                <QRScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
                {scanResult && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Last scan: {scanResult.substring(0, 50)}...
                  </p>
                )}
              </div>
            )}
            {/* Attendee List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendeesLoading ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Loading attendees...
                </div>
              ) : attendees.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  No attendees found for this event.
                </div>
              ) : (
                attendees.map((attendee, i) => (
                  <div key={attendee.ticketId || i} className={`flex items-center justify-between p-3 border rounded ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <img
                        src={attendee.user?.profileImage || '/api/placeholder/40/40'}
                        alt={attendee.attendeeName}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {attendee.attendeeName || 'Unknown'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          {attendee.attendeeEmail || ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          Ticket: {attendee.ticketType} &bull; {formatPrice(attendee.price)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Purchased: {formatDate(attendee.purchaseDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img src={attendee.qrCode} alt="QR Code" className="w-8 h-8" />
                      <Button 
                        size="small" 
                        variant={attendee.isUsed ? "success" : "outline"} 
                        onClick={async () => {
                          try {
                            await checkInAttendee(attendee.ticketId);
                            showSuccess('Attendee checked in successfully!');
                            // Refresh the list
                            const response = await getEventAttendees(selectedEvent.eventId);
                            setAttendees(response?.data?.attendees || []);
                          } catch (error) {
                            showError('Failed to check in attendee');
                            // Use error for logging
                            console.error(error);
                          }
                        }}
                      >
                        <QrCode className="w-4 h-4" />
                        {attendee.isUsed ? "Checked In" : "Check In"}
                      </Button>
                      <Button size="small" variant="outline">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Event"
        >
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Edit details for "{selectedEvent?.title}"
            </p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Title
                </label>
                <input
                  type="text"
                  defaultValue={selectedEvent?.title}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Date
                </label>
                <input
                  type="date"
                  defaultValue={selectedEvent ? selectedEvent.date?.slice(0,10) : ''}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateEvent({})}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Advanced Settings"
        >
          <div className="space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Advanced organizer settings go here.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default OrganizerDashboard;