import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { formatDate, formatPrice, getDaysUntilEvent } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
// Add react-icons imports
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiFileText, FiChevronDown, FiChevronUp, FiCopy } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaCheck } from 'react-icons/fa';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTicketsMobile, setShowTicketsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Share functionality
  const handleShare = (platform) => {
    const eventUrl = window.location.href;
    const eventTitle = event.title;
    const eventText = `Check out ${event.title} - ${formatDate(event.date)} at ${event.venue}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(eventText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(eventText)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(eventUrl).then(() => {
          setCopied(true);
          showSuccess('Event link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        });
        break;
      default:
        break;
    }
  };

  // ADDED: Free reservation handler
  const handleReserveSpot = async () => {
    try {
      setReservationLoading(true);
      
      const selectedTicket = tickets[selectedTicketIndex];
      if (!selectedTicket) {
        showError('Please select a reservation type');
        return;
      }

      const result = await eventService.reserveFreeSpots(
        event.id, 
        selectedTicket.id, 
        selectedQuantity
      );
      
      if (result.success) {
        setShowSuccessModal(true);
        // Refresh event data to update available spots
        const updatedEvent = await eventService.getEventById(id);
        setEvent(updatedEvent.data);
      }
      
    } catch (error) {
      showError(error.message || 'Failed to reserve spots');
    } finally {
      setReservationLoading(false);
    }
  };

  // ADDED: Success Modal Component
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">You're In! 🎉</h3>
        <p className="text-gray-600 mb-4">
          {selectedQuantity} spot(s) reserved for <strong>{event.title}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Check your email for confirmation and event details. 
          Add it to your calendar so you don't forget!
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            fullWidth 
            onClick={() => setShowSuccessModal(false)}
          >
            Continue Browsing
          </Button>
          <Button 
            fullWidth 
            variant="outline"
            onClick={() => {
              // Share event with friends
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: `Join me at ${event.title} - it's free!`,
                  url: window.location.href
                });
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href);
                showSuccess('Event link copied to clipboard!');
              }
            }}
          >
            Share with Friends
          </Button>
        </div>
      </div>
    </div>
  );

  const handleAddToCart = () => {
    console.log('Event object in handleAddToCart:', event);
    if (event && spotsLeft >= selectedQuantity) {
      addToCart({ ...event, price: ticketPrice }, selectedQuantity);
      showSuccess(`${selectedQuantity} ticket(s) for ${event.title} added to cart!`);
    } else {
      showError('Not enough spots available');
    }
  };

  // Function to generate proper Google Maps embed URL
  const generateMapsEmbedUrl = (event) => {
    // If the event has coordinates, use them directly
    if (event.latitude && event.longitude) {
      return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15057.534307180755!2d${event.longitude}!3d${event.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1635959999999!5m2!1sen!2s`;
    }
    
    // If no coordinates, build a proper search query
    const addressParts = [
      event.venue,
      event.address,
      event.city,
      event.state || event.region,
      event.country
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ');
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Use the newer embed API format that works better for search
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6disiuIcVgzgS_Q&q=${encodedAddress}&zoom=15&maptype=roadmap`;
  };

  // Fallback function for when API key is not available
  const generateMapsSearchUrl = (event) => {
    const addressParts = [
      event.venue,
      event.address,
      event.city,
      event.state || event.region,
      event.country
    ].filter(Boolean);
    
    const query = encodeURIComponent(addressParts.join(', '));
    
    // Use the search parameter which works better than the pb parameter
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
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
  const isFreeEvent = event.pricingType === 'free';

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
              {ticket.price === 0 ? 'Free' : formatPrice(ticket.price)}
            </p>
          </div>
          
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? 'border-primary-500 bg-primary-500' 
              : 'border-gray-300'
          }`}>
            {isSelected && (
              <FaCheck className="w-3 h-3 text-white" />
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
                <FaCheck className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
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

  // Compact Event Details Card Component for Mobile
  const CompactEventDetails = () => (
    <div className="lg:hidden bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
      {/* Event Status & Price Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
            {event.category?.name}
          </span>
          {isFreeEvent && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Free
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600">
            {isFreeEvent ? 'Free' : formatPrice(ticketPrice)}
          </p>
          <p className="text-xs text-gray-500">per person</p>
        </div>
      </div>

      {/* Compact Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <FiCalendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {formatDate(event.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiClock className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="text-sm font-medium text-gray-900">{event.time}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiMapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Venue</p>
            <p className="text-sm font-medium text-gray-900 truncate">{event.venue}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiUsers className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Available</p>
            <p className={`text-sm font-medium ${
              spotsLeft <= 10 ? 'text-red-600' : 'text-green-600'
            }`}>
              {spotsLeft} spots
            </p>
          </div>
        </div>
      </div>

      {/* Get Tickets Button */}
      <Button 
        fullWidth 
        size="large"
        onClick={() => setShowTicketsMobile(!showTicketsMobile)}
        className="flex items-center justify-center"
      >
        {showTicketsMobile ? (
          <>
            <FiChevronUp className="w-5 h-5 mr-2" />
            Hide Tickets
          </>
        ) : (
          <>
            <FiChevronDown className="w-5 h-5 mr-2" />
            Get Tickets
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Modal */}
      {showSuccessModal && <SuccessModal />}
      
      {/* Breadcrumb Navigation */}
      <nav className="max-w-5xl mx-auto pt-4 px-4" aria-label="Breadcrumb">
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
      
      {/* Hero Section - Mobile Optimized */}
      <div className="max-w-5xl mx-auto mt-4 rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl overflow-hidden bg-white/80 relative">
        <div className="relative h-48 md:h-64 lg:h-96">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white bg-gradient-to-t from-black/80 to-transparent">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {event.category?.name}
                </span>
                {isFreeEvent && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Free Event
                  </span>
                )}
                {event.featured && (
                  <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 drop-shadow-lg">{event.title}</h1>
              <div className="flex flex-col space-y-2 text-sm md:text-base drop-shadow">
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span>{formatDate(event.date)} at {event.time}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12">
        {/* Mobile-first layout with ticket section first */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Compact Mobile Event Details */}
          <div className="lg:hidden">
            <CompactEventDetails />
          </div>

          {/* Ticket Section - Collapsible on Mobile */}
          <div className={`lg:col-span-1 ${showTicketsMobile ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl lg:rounded-lg shadow-lg p-4 lg:p-6 sticky top-4 lg:top-8 z-30">
              {/* Free Event Badge */}
              {isFreeEvent && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-800 font-semibold text-sm">
                    Free Event - No Payment Required
                  </span>
                </div>
              )}

              {/* Ticket Selection */}
              {tickets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {isFreeEvent ? 'Choose Your Reservation' : 'Choose Your Ticket'}
                  </h3>
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
                    <span className="font-semibold text-gray-900 text-sm">{selectedTicket.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {isFreeEvent ? 'Free' : formatPrice(selectedTicket.price)}
                    </span>
                  </div>
                </div>
              )}

              {isUpcoming && available > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of {isFreeEvent ? 'spots' : 'tickets'}
                    </label>
                    <select
                      id="quantity"
                      value={selectedQuantity}
                      onChange={e => setSelectedQuantity(parseInt(e.target.value))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                        {isFreeEvent ? 'Free' : formatPrice(ticketPrice * selectedQuantity)}
                      </span>
                    </div>
                  </div>

                  {/* UPDATED: Different behavior for free vs paid events */}
                  {isFreeEvent ? (
                    <Button 
                      fullWidth 
                      size="large" 
                      onClick={handleReserveSpot}
                      loading={reservationLoading}
                    >
                      {reservationLoading ? 'Reserving...' : 'Reserve Spot'}
                    </Button>
                  ) : (
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
                            _id: ticket.id
                          }
                        }
                      });
                    }}>
                      Buy Your ticket
                    </Button>
                  )}

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
                    This {isFreeEvent ? 'reservation type' : 'ticket type'} is currently sold out
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
                  <FiClock className="w-4 h-4 mr-2 flex-shrink-0" />
                  Duration: {event.duration || '2-3 hours'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiUsers className="w-4 h-4 mr-2 flex-shrink-0" />
                  Age: {event.ageRestriction || 'All ages welcome'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiFileText className="w-4 h-4 mr-2 flex-shrink-0" />
                  {event.ticketDelivery || 'E-tickets provided'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
                    {isFreeEvent ? '🎉' : '💰'}
                  </span>
                  {isFreeEvent ? 'Free Admission' : 'Paid Event'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <div className="bg-white rounded-xl lg:rounded-3xl shadow-lg lg:shadow-2xl p-4 lg:p-8 border border-gray-100/60">
              {/* Description */}
              <section className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">About This Event</h2>
                <p className="text-gray-600 text-base lg:text-lg leading-relaxed">{event.description}</p>
              </section>

              {/* Event Details - Hidden on mobile since we have compact version */}
              <section className="mb-6 lg:mb-8 hidden lg:block">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Event Details</h2>
                <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-primary-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Event Type</h3>
                      <p className="text-gray-600">
                        {isFreeEvent ? 'Free Event' : 'Paid Event'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
                      <p className="text-gray-600">{event.duration || '2-3 hours'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <section className="mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Tags</h2>
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

              {/* Share - Updated with Icon Buttons */}
              <section className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-4">Share This Event</h2>
                <div className="flex justify-center space-x-4">
                  {/* Facebook Share */}
                  <button 
                    onClick={() => handleShare('facebook')}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105"
                    aria-label="Share on Facebook"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </button>

                  {/* Twitter/X Share */}
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105"
                    aria-label="Share on X (Twitter)"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </button>

                  {/* Copy Link */}
                  <button 
                    onClick={() => handleShare('copy')}
                    className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105"
                    aria-label="Copy event link"
                  >
                    {copied ? (
                      <FaCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <FiCopy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Share hint text */}
                <p className="text-center text-gray-500 text-sm mt-3">
                  Spread the word about this event!
                </p>
              </section>

              {/* Location & Map */}
              <section>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Event Location</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Address Info */}
                  <div className="p-4 lg:p-6 bg-gray-50 border-b">
                    <div className="flex items-start space-x-3">
                      <FiMapPin className="w-5 h-5 lg:w-6 lg:h-6 text-primary-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base lg:text-lg">{event.venue}</h3>
                        {event.address && (
                          <p className="text-gray-600 mt-1 text-sm lg:text-base">{event.address}</p>
                        )}
                        {event.city && event.country && (
                          <p className="text-gray-600 text-sm lg:text-base">{event.city}, {event.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Google Maps Embed */}
                  <div className="relative">
                    <iframe
                      src={generateMapsSearchUrl(event)}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full"
                      title={`Map showing location of ${event.venue}`}
                    ></iframe>
                    
                    {/* Fallback for when map doesn't load */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="text-center">
                        <FiMapPin className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-4 text-gray-400" />
                        <p className="text-gray-500 text-xs lg:text-sm">Interactive Map</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Location Info */}
                  <div className="p-3 lg:p-4 bg-gray-50 text-xs lg:text-sm text-gray-600">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span>📍 Click and drag to explore the area</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue, event.address, event.city, event.country].filter(Boolean).join(', '))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        Open in Google Maps →
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;