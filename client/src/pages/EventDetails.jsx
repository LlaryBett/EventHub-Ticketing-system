import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { formatDate, formatPrice, getDaysUntilEvent } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const { addToCart } = useCart();
  const { showSuccess, showError } = useUI();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await eventService.getEventById(id);
        console.log('Payload received from getEventById:', eventData); // Log the payload
        // Support response shape: { success, data: [event] } or { data: event }
        const eventObj = eventData?.data;
        setEvent(eventObj);
      } catch (error) {
        console.error('Failed to fetch event:', error);
        showError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, showError]);

  const handleAddToCart = () => {
    console.log('Event object in handleAddToCart:', event); // Log the event object
    if (event && spotsLeft >= selectedQuantity) {
      addToCart({ ...event, price: ticketPrice }, selectedQuantity);
      showSuccess(`${selectedQuantity} ticket(s) for ${event.title} added to cart!`);
    } else {
      showError('Not enough spots available');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <Link to="/events" className="btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntilEvent(event.date);
  const isUpcoming = daysUntil >= 0;
  const spotsLeft = event.capacity - event.registered;
  const tickets = Array.isArray(event.tickets) ? event.tickets : [];
  const selectedTicket = tickets[selectedTicketIndex] || {};
  const ticketPrice = selectedTicket.price || 0;
  const minOrder = selectedTicket.minOrder || 1;
  const maxOrder = Math.min(selectedTicket.maxOrder || 10, selectedTicket.available || 10);
  const available = selectedTicket.available || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto mt-8 rounded-3xl shadow-2xl overflow-hidden bg-white/80 relative">
        <div className="relative h-96">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-7xl mx-auto container-padding">
              <div className="flex items-center mb-4">
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium capitalize mr-4">
                  {event.category?.name}
                </span>
                {event.featured && (
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                    Featured Event
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-lg drop-shadow">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event.date)} at {event.time}
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto container-padding py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-600 text-lg leading-relaxed">{event.description}</p>
            </section>

            {/* Event Details */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
                    <p className="text-gray-600">{event.organizer?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Capacity</h3>
                    <p className="text-gray-600">{event.capacity} attendees</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Registered</h3>
                    <p className="text-gray-600">{event.registered} people</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Available Spots</h3>
                    <p className={`font-medium ${spotsLeft <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {spotsLeft} spots left
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Share */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Share This Event</h2>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Share on Facebook
                </button>
                <button className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-200">
                  Share on Twitter
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                  Copy Link
                </button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {formatPrice(ticketPrice)}
                </div>
                <p className="text-gray-500">per ticket</p>
              </div>

              {/* Ticket Type Selection */}
              {tickets.length > 1 && (
                <div className="mb-4">
                  <label htmlFor="ticketType" className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Type
                  </label>
                  <select
                    id="ticketType"
                    value={selectedTicketIndex}
                    onChange={e => {
                      const newIndex = Number(e.target.value);
                      setSelectedTicketIndex(newIndex);
                      setSelectedQuantity(tickets[newIndex]?.minOrder || 1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {tickets.map((ticket, idx) => (
                      <option key={ticket.id || ticket._id} value={idx}>
                        {ticket.type} • {formatPrice(ticket.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ticket Benefits */}
              {selectedTicket.benefits && selectedTicket.benefits.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                  <ul className="list-disc pl-5 text-gray-700 text-sm">
                    {selectedTicket.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isUpcoming && available > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of tickets
                    </label>
                    <select
                      id="quantity"
                      value={selectedQuantity}
                      onChange={e => setSelectedQuantity(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {[...Array(Math.min(maxOrder, available)).keys()].map(i => (
                        <option key={i + minOrder} value={i + minOrder}>
                          {i + minOrder}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(ticketPrice * selectedQuantity)}
                      </span>
                    </div>
                  </div>

                  <Button fullWidth size="large" onClick={() => {
                    const ticket = tickets[selectedTicketIndex] || {};
                    addToCart({
                      eventId: event._id || event.id,
                      eventName: event.title,
                      eventImage: event.image,
                      ticketId: ticket._id || ticket.id,
                      ticketType: ticket.type,
                      price: ticket.price || 0,
                      quantity: selectedQuantity
                    }, selectedQuantity);
                    showSuccess(`${selectedQuantity} ticket(s) for ${event.title} (${ticket.type}) added to cart!`);
                  }}>
                    Add to Cart
                  </Button>

                  {daysUntil <= 7 && daysUntil > 0 && (
                    <p className="text-sm text-orange-600 text-center">
                      ⚡ Event starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}!
                    </p>
                  )}

                  {available <= 10 && (
                    <p className="text-sm text-red-600 text-center">
                      🔥 Only {available} spots left!
                    </p>
                  )}
                </div>
              ) : available === 0 ? (
                <div className="text-center">
                  <Button fullWidth disabled size="large" variant="secondary">
                    Sold Out
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    This ticket type is currently sold out
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Button fullWidth disabled size="large" variant="secondary">
                    Event Ended
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    This event has already ended
                  </p>
                </div>
              )}

              {/* Event Info */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duration: 2-3 hours
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Age: All ages welcome
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  E-tickets provided
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;