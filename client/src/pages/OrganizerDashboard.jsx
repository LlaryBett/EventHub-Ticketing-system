import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Calendar, Users, DollarSign, TrendingUp, Plus, Search, Filter, 
  Download, Edit, Copy, Trash2, Eye, Settings, Bell, Moon, Sun,
  MoreHorizontal, CheckCircle, Clock, AlertCircle, Mail, MessageSquare,
  QrCode, CreditCard, Upload, UserPlus, BarChart3, PieChart as PieChartIcon,
  MapPin, Tag, Ticket, RefreshCw, X, ChevronDown, ChevronRight, Sparkles,
  Image, Video, Play
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { getMe, getEventAttendees, exportEventAttendees, checkInAttendee, uploadOrganizerLogo } from '../services/userService';
import { formatDate, formatPrice } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import QRScanner from '../components/common/QRScanner';

const OrganizerDashboard = () => {
  const { showSuccess, showError } = useUI();
  const fileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
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
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Stories State
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [newStory, setNewStory] = useState({
    eventId: '',
    slides: [{ type: 'image', media: '', title: '', duration: 5000, subtitle: '', description: '', cta: '', link: '' }]
  });

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

  // Load stories when stories tab is active
  useEffect(() => {
    if (activeTab === 'stories') {
      fetchStories();
    }
  }, [activeTab]);

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

  // Stories Functions
  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      // Changed from getEventStories to getOrganizerStories
      const response = await eventService.getOrganizerStories();
      setStories(response.data || []);
    } catch (error) {
      showError(error.message || 'Failed to fetch stories');
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleCreateStory = async () => {
    try {
      // Validate required fields
      if (!newStory.eventId) {
        throw new Error('Please select an event');
      }
      if (!newStory.slides.length || !newStory.slides[0].media) {
        throw new Error('At least one slide with media is required');
      }

      // Log the payload before sending to backend
      console.log('Creating story payload:', newStory);

      // Call the correct service method
      const response = await eventService.createStory(newStory);
      
      showSuccess('Story created successfully!');
      setShowCreateStoryModal(false);
      setNewStory({
        eventId: '',
        slides: [{ type: 'image', media: '', title: '', duration: 5000, subtitle: '', description: '', cta: '', link: '' }]
      });
      fetchStories(); // Refresh stories list
    } catch (error) {
      showError(error.message || 'Failed to create story');
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await eventService.deleteStory(storyId);
      showSuccess('Story deleted successfully');
      fetchStories(); // Refresh stories list
    } catch (error) {
      showError(error.message || 'Failed to delete story');
    }
  };

  const addSlide = () => {
    setNewStory(prev => ({
      ...prev,
      slides: [...prev.slides, { type: 'image', media: '', title: '', duration: 5000, subtitle: '', description: '', cta: '', link: '' }]
    }));
  };

  const updateSlide = (index, field, value) => {
    setNewStory(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => 
        i === index ? { ...slide, [field]: value } : slide
      )
    }));
  };

  const removeSlide = (index) => {
    setNewStory(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
  };

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
      console.error(error);
    }
  };

  const handleDuplicateEvent = async (eventData) => {
    try {
      // Call your backend API to duplicate event
      showSuccess('Event duplicated successfully');
      setShowDuplicateModal(false);
      setSelectedEvent(null);
    } catch (error) {
      showError('Failed to duplicate event');
      console.error(error);
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      // Prefer provided eventData, otherwise use selectedEvent from state
      const payload = eventData && Object.keys(eventData).length ? eventData : selectedEvent;
      const eventId = payload?.id || payload?.eventId;
      if (!eventId) {
        throw new Error('No event id provided for update');
      }

      // Call backend to update event
      const res = await eventService.updateEvent(eventId, payload);

      // Use returned updated event if available, otherwise fallback to payload
      const updated = (res && (res.data || res.updatedEvent)) || payload;

      // Replace updated event in organizerEvents and filteredEvents
      setOrganizerEvents(prev => prev.map(ev => {
        const idKey = ev.id || ev.eventId;
        if (idKey === eventId) return { ...ev, ...updated };
        return ev;
      }));
      setFilteredEvents(prev => prev.map(ev => {
        const idKey = ev.id || ev.eventId;
        if (idKey === eventId) return { ...ev, ...updated };
        return ev;
      }));

      showSuccess('Event updated successfully');
      setShowEditModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Update event failed:', error);
      showError(error?.response?.data?.message || error?.message || 'Failed to update event');
    }
  };

  const handleSendNotification = async (notificationData) => {
    try {
      // Call your backend API to send notifications
      showSuccess('Notification sent successfully');
      setShowNotificationModal(false);
    } catch (error) {
      showError('Failed to send notification');
      console.error(error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      // Call your backend API to update organizer settings
      showSuccess('Settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      showError('Failed to update settings');
      console.error(error);
    }
  };

  const exportAttendees = async (eventId, format = 'csv') => {
    try {
      // Call your backend API to export attendees
      showSuccess(`Attendees exported as ${format.toUpperCase()}`);
    } catch (error) {
      showError('Failed to export attendees');
      console.error(error);
    }
  };

  // QR Scanner Handlers
  const handleScanSuccess = async (decodedText, decodedResult) => {
    setScanResult(decodedText);
    try {
      let ticketId = decodedText;
      if (decodedText.startsWith('{')) {
        const qrData = JSON.parse(decodedText);
        ticketId = qrData.ticketId || qrData.id;
      }
      const checkinResponse = await checkInAttendee(ticketId);

      if (checkinResponse && checkinResponse.message) {
        showSuccess(checkinResponse.message);
      } else if (checkinResponse && checkinResponse.error) {
        showError(checkinResponse.error);
      } else if (checkinResponse && checkinResponse.success) {
        showSuccess('Attendee checked in successfully!');
      } else {
        showSuccess('Check-in completed.');
      }

      if (selectedEvent?.eventId) {
        const response = await getEventAttendees(selectedEvent.eventId);
        setAttendees(response?.data?.attendees || []);
        setAttendeeStats(response?.data?.stats || {});
      }
      setShowQRScanner(false);
    } catch (error) {
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
    console.log('QR Scan Error:', errorMessage);
  };

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'stories', label: 'Stories', icon: Sparkles },
    { id: 'attendees', label: 'Attendees', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const [attendees, setAttendees] = useState([]);
  const [attendeeStats, setAttendeeStats] = useState({});
  const [modalEventInfo, setModalEventInfo] = useState(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // When opening the Attendees Modal, fetch attendees for the selected event
  useEffect(() => {
    const fetchAttendees = async () => {
      if (showAttendeesModal && selectedEvent?.eventId) {
        setAttendeesLoading(true);
        setAttendees([]);
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
          console.error(err);
        } finally {
          setAttendeesLoading(false);
        }
      }
    };
    fetchAttendees();
  }, [showAttendeesModal, selectedEvent, showError]);

  // Upload handlers for organization logo
  const handleLogoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // immediate preview
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    await uploadLogo(file);
    // revoke will be handled later if needed; keep simple
  };

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const response = await uploadOrganizerLogo(file);
      const logoUrl = response?.data?.logo || response?.logo;
      
      if (logoUrl) {
        setOrganizerSettings(prev => ({ ...prev, logo: logoUrl }));
        showSuccess('Organization logo updated successfully');
      } else {
        setOrganizerSettings(prev => ({ ...prev, logo: logoPreview || prev.logo }));
        showSuccess('Logo uploaded (preview shown)');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      showError(err?.message || 'Failed to upload logo');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

            {activeTab === 'stories' && (
              <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Event Stories
                      </h2>
                      <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create engaging stories to promote your events
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateStoryModal(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Story</span>
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {storiesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : stories.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-primary-600" />
                      </div>
                      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        No stories yet
                      </h3>
                      <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create your first story to engage with your audience
                      </p>
                      <Button onClick={() => setShowCreateStoryModal(true)}>
                        Create Your First Story
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stories.map((story) => (
                        <div
                          key={story.id}
                          className={`border rounded-lg overflow-hidden ${
                            darkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <div className="relative h-48 bg-gray-200">
                            {story.slides[0]?.type === 'image' ? (
                              <img
                                src={story.slides[0]?.media}
                                alt={story.slides[0]?.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={story.slides[0]?.media}
                                className="w-full h-full object-cover"
                                muted
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            
                            <div className="absolute top-3 right-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  story.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {story.isActive ? 'Active' : 'Expired'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {story.eventId?.title || 'Untitled Story'}
                            </h3>
                            
                            <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-2" />
                                Created: {new Date(story.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Play className="w-3 h-3 mr-2" />
                                {story.slides.length} slide{story.slides.length !== 1 ? 's' : ''}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-2" />
                                {story.views || 0} views
                              </div>
                            </div>

                            <div className="flex space-x-2 mt-4">
                              <Button
                                size="small"
                                variant="outline"
                                onClick={() => {
                                  // Preview story functionality
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="small"
                                variant="outline"
                                onClick={() => {
                                  // Edit story functionality
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="small"
                                variant="danger"
                                onClick={() => handleDeleteStory(story.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other tabs (attendees, analytics, settings) remain the same */}
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
                            src={logoPreview || organizerSettings.logo || '/api/placeholder/100/100'}
                            alt="Organization Logo"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                          {/* hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoSelect}
                            className="hidden"
                          />
                          <Button
                            size="small"
                            className="absolute -bottom-2 -right-2 rounded-full p-2 flex items-center justify-center"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          >
                            {uploadingLogo ? (
                              // simple spinner (tailwind classes used in project)
                              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
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

        {/* Create Story Modal */}
        <Modal
          isOpen={showCreateStoryModal}
          onClose={() => setShowCreateStoryModal(false)}
          title="Create Story"
          size="large"
        >
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Event
              </label>
              <select
                value={newStory.eventId}
                onChange={(e) => {
                  const selectedEventId = e.target.value;
                  // match either possible id field
                  const selectedEventData = organizerEvents.find(event => 
                    (event.id && event.id === selectedEventId) || 
                    (event.eventId && event.eventId === selectedEventId)
                  );
                  console.log('Available events keys:', organizerEvents.map(ev => ({ id: ev.id, eventId: ev.eventId, title: ev.title })));
                  console.log('Selected event ID:', selectedEventId);
                  console.log('Selected event data:', selectedEventData);
                  setNewStory({...newStory, eventId: selectedEventId});
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Choose an event</option>
                {organizerEvents.map(event => {
                  const val = event.id || event.eventId || '';
                  return <option key={val || event.title} value={val}>{event.title}</option>;
                })}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Story Slides
                </h3>
                <Button size="small" onClick={addSlide}>
                  <Plus className="w-4 h-4" />
                  Add Slide
                </Button>
              </div>

              <div className="space-y-4">
                {newStory.slides.map((slide, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Slide {index + 1}
                      </h4>
                      {newStory.slides.length > 1 && (
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => removeSlide(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Media Type
                        </label>
                        <select
                          value={slide.type}
                          onChange={(e) => updateSlide(index, 'type', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Media URL
                        </label>
                        <input
                          type="url"
                          value={slide.media}
                          onChange={(e) => updateSlide(index, 'media', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => updateSlide(index, 'title', e.target.value)}
                          placeholder="Slide title..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={slide.subtitle}
                          onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                          placeholder="Slide subtitle..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={slide.description}
                        onChange={(e) => updateSlide(index, 'description', e.target.value)}
                        placeholder="Slide description..."
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={slide.cta}
                          onChange={(e) => updateSlide(index, 'cta', e.target.value)}
                          placeholder="Get Tickets Now"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          CTA Link
                        </label>
                        <input
                          type="url"
                          value={slide.link}
                          onChange={(e) => updateSlide(index, 'link', e.target.value)}
                          placeholder="https://example.com/tickets"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowCreateStoryModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateStory} 
                disabled={!newStory.eventId || newStory.slides.some(slide => !slide.media || !slide.title)}
              >
                Create Story
              </Button>
            </div>
          </div>
        </Modal>

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
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray'}`}>
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