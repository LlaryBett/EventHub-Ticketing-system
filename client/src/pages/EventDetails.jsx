import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await eventService.getEventById(id);
        console.log('Payload received from getEventById:', eventData);
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
    console.log('Event object in handleAddToCart:', event);
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

  const TicketCard = ({ ticket, index, isSelected, onSelect }) => {
    const isAvailable = ticket.available > 0;
    const isPopular = ticket.type?.toLowerCase().includes('vip') || ticket.type?.toLowerCase().includes('premium');
    
    return (
      <div 
        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-primary-500 bg-primary-50 shadow-md' 
            : isAvailable 
              ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm' 
              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
        }`}
        onClick={() => isAvailable && onSelect(index)}
      >
        {isPopular && (
          <div className="absolute -top-2 left-4">
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {ticket.type}
            </h3>
            <p className={`text-2xl font-bold ${isSelected ? 'text-primary-600' : isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {formatPrice(ticket.price)}
            </p>
          </div>
          
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? 'border-primary-500 bg-primary-500' 
              : 'border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Availability Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm ${
            ticket.available === 0 
              ? 'text-red-500 font-medium' 
              : ticket.available <= 10 
                ? 'text-orange-500 font-medium' 
                : 'text-green-600'
          }`}>
            {ticket.available === 0 
              ? 'Sold Out' 
              : `${ticket.available} available`
            }
          </span>
          
          {ticket.minOrder > 1 && (
            <span className="text-xs text-gray-500">
              Min: {ticket.minOrder}
            </span>
          )}
        </div>

        {/* Benefits */}
        {ticket.benefits && ticket.benefits.length > 0 && (
          <div className="space-y-1">
            {ticket.benefits.slice(0, 3).map((benefit, idx) => (
              <div key={idx} className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{benefit}</span>
              </div>
            ))}
            {ticket.benefits.length > 3 && (
              <p className="text-xs text-gray-500 ml-6">
                +{ticket.benefits.length - 3} more benefits
              </p>
            )}
          </div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-xl flex items-center justify-center">
            <span className="text-gray-500 font-semibold">Sold Out</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <nav className="max-w-5xl mx-auto pt-8 px-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600 font-medium">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/events" className="hover:text-primary-600 font-medium">Events</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-700 font-semibold truncate max-w-xs" title={event.title}>{event.title}</li>
        </ol>
      </nav>
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
                  {event.venue}
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
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100/60 backdrop-blur-md">
              {/* Description */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                <p className="text-gray-600 text-lg leading-relaxed">{event.description}</p>
              </section>

              {/* Event Details */}
<section>
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-600">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
        <p className="text-gray-600">{event.organizer?.organizationName || 'N/A'}</p>
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
        <p
          className={`font-medium ${
            spotsLeft <= 10 ? 'text-red-600' : 'text-green-600'
          }`}
        >
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

              {/* Sitemap */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sitemap</h2>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-gray-600 text-lg leading-relaxed">
                    {event.sitemap ? (
                      <>
                        {typeof event.sitemap === 'string' ? (
                          <p>{event.sitemap}</p>
                        ) : Array.isArray(event.sitemap) ? (
                          <ul className="space-y-2">
                            {event.sitemap.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="w-4 h-4 mr-2 mt-1 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : typeof event.sitemap === 'object' ? (
                          <div>
                            {Object.entries(event.sitemap).map(([key, value]) => (
                              <div key={key} className="mb-3">
                                <h3 className="font-semibold text-gray-900 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                <p className="text-gray-600">{value}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>{String(event.sitemap)}</p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No sitemap information available for this event.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            

          
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {/* Ticket Selection */}
              {tickets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Ticket</h3>
                  <div className="space-y-3">
  {tickets.map((ticket, index) => (
    <div 
      key={ticket.id || ticket._id || index} 
      className="border-l-4 border-primary-600 rounded-lg"
    >
      <TicketCard
        ticket={ticket}
        index={index}
        isSelected={selectedTicketIndex === index}
        onSelect={(idx) => {
          setSelectedTicketIndex(idx);
          setSelectedQuantity(tickets[idx]?.minOrder || 1);
        }}
      />
    </div>
  ))}
</div>

                </div>
              )}

              {/* Selected Ticket Details */}
              {selectedTicket && Object.keys(selectedTicket).length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Selected:</span>
                    <span className="font-semibold text-gray-900">{selectedTicket.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(selectedTicket.price)}
                    </span>
                  </div>
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
                    navigate('/checkout', {
                      state: {
                        item: {
                          eventId: event._id || event.id,
                          title: event.title,
                          price: ticket.price || 0,
                          quantity: selectedQuantity,
                          image: event.image,
                          type: ticket.type,
                        }
                      }
                    });
                  }}>
                    Buy Your ticket
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