import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import EventCard from '../components/events/EventCard';
import EventFilter from '../components/events/EventFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Events = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    priceRange: null,
    dateRange: null
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await eventService.getAllEvents(filters);
        setEvents(Array.isArray(fetchedEvents) ? fetchedEvents : fetchedEvents?.data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find and book tickets to the best events happening near you. From conferences to concerts, we've got you covered.
          </p>
        </div>

        {/* Filters */}
        <EventFilter 
          onFilterChange={handleFilterChange} 
          currentFilters={filters}
        />

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="large" />
            <p className="text-gray-500 mt-4">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search terms to find more events.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Found {events.length} event{events.length !== 1 ? 's' : ''}
              </p>
              
              {/* Sort Options */}
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>Sort by Date</option>
                <option>Sort by Price (Low to High)</option>
                <option>Sort by Price (High to Low)</option>
                <option>Sort by Popularity</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={{
                  ...event,
                  price: event.price ?? (Array.isArray(event.tickets) ? event.tickets[0]?.price : undefined)
                }} />
              ))}
            </div>

            {/* Load More Button */}
            {events.length >= 9 && (
              <div className="text-center mt-12">
                <button className="btn-secondary">
                  Load More Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;