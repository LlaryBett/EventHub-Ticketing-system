import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { formatDate, formatPrice } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(true);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    upcomingEvents: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        // Mock organizer events - in real app, filter by organizer
        const allEvents = await eventService.getAllEvents();
        const userEvents = allEvents.filter(event => event.organizer === user.name);
        setOrganizerEvents(userEvents);

        // Calculate analytics
        const totalRevenue = userEvents.reduce((sum, event) => sum + (event.price * event.registered), 0);
        const totalAttendees = userEvents.reduce((sum, event) => sum + event.registered, 0);
        const upcomingEvents = userEvents.filter(event => new Date(event.date) > new Date()).length;

        setAnalytics({
          totalEvents: userEvents.length,
          totalRevenue,
          totalAttendees,
          upcomingEvents
        });
      } catch (error) {
        console.error('Failed to fetch organizer data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrganizerData();
    }
  }, [user, showError]);

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
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'events', label: 'My Events', icon: '🎫' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
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
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your events and track your success</p>
        </div>

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
                  <p className="text-sm text-gray-500">Event Organizer</p>
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

              <div className="mt-6 pt-6 border-t">
                <Link to="/organizer">
                  <Button fullWidth variant="primary">
                    Create New Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Events</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{formatPrice(analytics.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Attendees</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalAttendees}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Upcoming Events</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.upcomingEvents}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
                  </div>
                  <div className="p-6">
                    {organizerEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                        <div className="flex items-center">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{event.registered} registered</p>
                          <p className="text-sm text-gray-500">{formatPrice(event.price * event.registered)} revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">My Events</h2>
                  <Link to="/organizer">
                    <Button>Create New Event</Button>
                  </Link>
                </div>
                <div className="p-6">
                  {organizerEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
                      <Link to="/organizer">
                        <Button>Create Your First Event</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {organizerEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-20 h-20 rounded-lg object-cover mr-4"
                              />
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                                <div className="space-y-1 text-sm text-gray-500">
                                  <p>📅 {formatDate(event.date)} at {event.time}</p>
                                  <p>📍 {event.location}</p>
                                  <p>👥 {event.registered}/{event.capacity} registered</p>
                                  <p>💰 {formatPrice(event.price)} per ticket</p>
                                </div>
                                <div className="mt-2">
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    new Date(event.date) > new Date()
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link to={`/events/${event.id}`}>
                                <Button size="small" variant="outline">View</Button>
                              </Link>
                              <Button 
                                size="small" 
                                variant="secondary"
                                onClick={() => {/* Edit functionality */}}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="small" 
                                variant="danger"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowDeleteModal(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{event.registered}</p>
                                <p className="text-sm text-gray-500">Attendees</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">{formatPrice(event.price * event.registered)}</p>
                                <p className="text-sm text-gray-500">Revenue</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-blue-600">{Math.round((event.registered / event.capacity) * 100)}%</p>
                                <p className="text-sm text-gray-500">Capacity</p>
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

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Performance</h2>
                  <div className="space-y-6">
                    {organizerEvents.map((event) => (
                      <div key={event.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatPrice(event.price * event.registered)}</p>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                          <span>{event.registered} registered</span>
                          <span>{event.capacity} capacity</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Organizer Settings</h2>
                </div>
                <div className="p-6">
                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Organization Description</label>
                      <textarea
                        rows={4}
                        placeholder="Tell people about your organization..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      ></textarea>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-gray-700">Email notifications for new registrations</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-gray-700">Weekly analytics reports</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" />
                          <span className="text-gray-700">SMS notifications for urgent updates</span>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
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
    </div>
  );
};

export default OrganizerDashboard;