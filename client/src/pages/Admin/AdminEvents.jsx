import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit, Trash2, Eye, MoreHorizontal, ChevronDown, TrendingUp } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { formatDate, formatPrice } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useUI } from '../../context/UIContext';

const AdminEvents = () => {
  const { showSuccess, showError } = useUI();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all events
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents();
      if (response.success) {
        setEvents(response.data || []);
        setFilteredEvents(response.data || []);
      } else {
        showError('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  // Filter and sort events
  useEffect(() => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer?.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
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

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.registered || 0) - (a.registered || 0));
    } else if (sortBy === 'revenue') {
      const getRevenue = (event) => event.tickets?.reduce((sum, t) => sum + (t.price * (t.quantity - t.available)), 0) || 0;
      filtered.sort((a, b) => getRevenue(b) - getRevenue(a));
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, events]);

  // Delete event
  const handleDeleteEvent = async () => {
    try {
      await eventService.deleteEvent(selectedEvent.id);
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      showSuccess('Event deleted successfully');
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      showError('Failed to delete event');
      console.error(error);
    }
  };

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // Get event statistics
  const getEventStats = () => {
    return {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      draft: events.filter(e => e.status === 'draft').length,
      upcoming: events.filter(e => new Date(e.date) > new Date()).length,
      totalAttendees: events.reduce((sum, e) => sum + (e.registered || 0), 0),
      totalRevenue: events.reduce((sum, e) => sum + (e.tickets?.reduce((s, t) => s + (t.price * (t.quantity - t.available)), 0) || 0), 0)
    };
  };

  const stats = getEventStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">{stats.published} published, {stats.draft} draft</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Attendees</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalAttendees}</p>
          <p className="text-xs text-gray-500 mt-2">{stats.upcoming} upcoming events</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">From all events</p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
          <Button onClick={fetchAllEvents} variant="outline" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events or organizers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="revenue">Highest Revenue</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Organizer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Attendees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              ) : (
                currentEvents.map((event) => {
                  const revenue = event.tickets?.reduce((sum, t) => sum + (t.price * (t.quantity - t.available)), 0) || 0;
                  const isUpcoming = new Date(event.date) > new Date();
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.image || '/api/placeholder/50/50'}
                            alt={event.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.category?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{event.organizer?.organizationName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{event.organizer?.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">{formatDate(event.date)}</p>
                          <p className="text-sm text-gray-500">{event.time || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status || 'draft'}
                        </span>
                        {isUpcoming ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Upcoming
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Past
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{event.registered || 0}</p>
                          <p className="text-sm text-gray-500">of {event.capacity || 0}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-green-600">{formatPrice(revenue)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="small"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        title="Event Details"
        size="large"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{selectedEvent.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-gray-900 capitalize">{selectedEvent.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <p className="text-gray-900">{formatDate(selectedEvent.date)} at {selectedEvent.time}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <p className="text-gray-900">{selectedEvent.venue || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                <p className="text-gray-900">{selectedEvent.organizer?.organizationName || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">{selectedEvent.category?.name || 'Uncategorized'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{selectedEvent.description || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <p className="text-lg font-semibold text-gray-900">{selectedEvent.capacity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registered</label>
                <p className="text-lg font-semibold text-blue-600">{selectedEvent.registered || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Types</label>
                <p className="text-lg font-semibold text-gray-900">{selectedEvent.tickets?.length || 0}</p>
              </div>
            </div>

            {selectedEvent.tickets && selectedEvent.tickets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tickets</label>
                <div className="space-y-2">
                  {selectedEvent.tickets.map((ticket, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{ticket.type}</span>
                      <span className="text-sm text-gray-600">{ticket.available}/{ticket.quantity} available</span>
                      <span className="font-medium">{formatPrice(ticket.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Event Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEvent(null);
        }}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
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

export default AdminEvents;
