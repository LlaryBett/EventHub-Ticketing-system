import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import EventCard from '../components/events/EventCard';
import EventFilter from '../components/events/EventFilter';
import EventCardSkeleton from '../components/events/EventCardSkeleton';
import EventFilterSkeleton from '../components/events/EventFilterSkeleton';

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

  // helper: returns true if event date/time is in the future (upcoming)
  const isUpcoming = (event) => {
    if (!event?.date) return false;
    try {
      // base date from event.date
      const d = new Date(event.date);
      // if a time string exists (e.g. "13:04"), set hours/minutes
      if (event.time) {
        const [hours, minutes] = String(event.time).split(':').map(n => parseInt(n, 10));
        if (!isNaN(hours)) d.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
      }
      // compare with now
      return d.getTime() >= Date.now();
    } catch (err) {
      // fallback: treat as not upcoming on parse error
      return false;
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await eventService.getAllEvents(filters);
        const allEvents = Array.isArray(fetchedEvents) ? fetchedEvents : fetchedEvents?.data || [];
        const upcoming = allEvents.filter(isUpcoming);
        setEvents(upcoming);
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
     {/* Hero Section */}
<section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-16 overflow-hidden">
  {/* Background Image */}
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=600&fit=crop')",
    }}
  >
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/85 to-pink-900/90"></div>
  </div>

  {/* Content */}
  <div className="relative max-w-7xl mx-auto container-padding text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
      Discover Amazing Events
    </h1>
    <p className="text-xl text-blue-100 max-w-3xl mx-auto">
      Find and book tickets to the best events happening near you. From conferences to concerts, we've got you covered.
    </p>
  </div>

  {/* Decorative Elements */}
  <div className="absolute top-10 left-10 w-24 h-24 bg-blue-400/20 rounded-full blur-3xl"></div>
  <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-400/20 rounded-full blur-3xl"></div>
</section>

      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Compact Filters */}
        <div className="mb-6">
          {loading ? (
            <EventFilterSkeleton />
          ) : (
            <EventFilter 
              onFilterChanged={handleFilterChange} 
              currentFilters={filters}
            />
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13v4M14 15h-4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              There are currently no upcoming events that match your filters. Try clearing filters, changing the date range, or browse all events.
            </p>
            <div className="flex justify-center mt-4">
              <a href="/events" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Browse All Events
              </a>
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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