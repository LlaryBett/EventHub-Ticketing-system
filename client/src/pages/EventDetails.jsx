import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { formatDate, formatPrice, getDaysUntilEvent } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
// Add react-icons imports
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiFileText, FiChevronDown, FiChevronUp, FiCopy, FiShare2, FiMenu } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaCheck, FaWhatsapp, FaLinkedin, FaTicketAlt } from 'react-icons/fa';
import { IoShareSocialOutline, IoClose } from 'react-icons/io5';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTicketsMobile, setShowTicketsMobile] = useState(false);
  const [showMobileTicketModal, setShowMobileTicketModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const { addToCart } = useCart();
  const { showSuccess, showError } = useUI();
  const navigate = useNavigate();

  // Check if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Calculate time left for booking
  useEffect(() => {
    if (!event) return;
    
    const tickets = Array.isArray(event.tickets) ? event.tickets : [];
    if (!tickets.length) return;

    const calculateTimeLeft = () => {
      const selectedTicket = tickets[selectedTicketIndex];
      if (!selectedTicket || !selectedTicket.salesEnd) return;

      const endTime = new Date(selectedTicket.salesEnd).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [event, selectedTicketIndex]);

  // Share functionality
  const handleShare = (platform) => {
    const eventUrl = window.location.href;
    const eventTitle = event.title;
    const eventText = `Check out ${event.title} - ${formatDate(event.date)} at ${event.venue}`;
    const shareText = `${event.title}\n📅 ${formatDate(event.date)}\n📍 ${event.venue}\n\n${eventUrl}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(eventText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(eventText)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`, '_blank');
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
    setShowShareOptions(false);
  };

  // Free reservation handler
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
        // Close mobile modal if open
        if (showMobileTicketModal) setShowMobileTicketModal(false);
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

  // Success Modal Component
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
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: `Join me at ${event.title} - it's free!`,
                  url: window.location.href
                });
              } else {
                handleShare('copy');
              }
            }}
          >
            Share with Friends
          </Button>
        </div>
      </div>
    </div>
  );

  // Share Options Modal
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Share Event</h3>
          <button 
            onClick={() => setShowShareOptions(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button 
            onClick={() => handleShare('facebook')}
            className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <FaFacebook className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium">Facebook</span>
          </button>
          
          <button 
            onClick={() => handleShare('twitter')}
            className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <FaTwitter className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium">Twitter</span>
          </button>
          
          <button 
            onClick={() => handleShare('whatsapp')}
            className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-green-50 transition-colors"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <FaWhatsapp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </button>
          
          <button 
            onClick={() => handleShare('linkedin')}
            className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
              <FaLinkedin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium">LinkedIn</span>
          </button>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <button 
            onClick={() => handleShare('copy')}
            className="flex items-center justify-center w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <FaCheck className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-600">Link Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-700">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Ticket Modal
  const MobileTicketModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 lg:hidden">
      <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Get Tickets</h2>
          <button 
            onClick={() => setShowMobileTicketModal(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {isFreeEvent ? 'Free' : formatPrice(ticketPrice)}
              </span>
              {isFreeEvent ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  No Payment Required
                </span>
              ) : (
                <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                  Secure Payment
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">per person • {available} available</p>
          </div>

          {/* Ticket Selection */}
          {tickets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {isFreeEvent ? 'Reservation Type' : 'Ticket Type'}
              </h3>
              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <TicketCard
                    key={ticket.id || ticket._id || index}
                    ticket={ticket}
                    index={index}
                    isSelected={selectedTicketIndex === index}
                    onSelect={(idx) => {
                      setSelectedTicketIndex(idx);
                      setSelectedQuantity(tickets[idx]?.minOrder || 1);
                    }}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Total */}
          {isUpcoming && available > 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of {isFreeEvent ? 'spots' : 'tickets'}
                </label>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedQuantity}
                    onChange={e => setSelectedQuantity(parseInt(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  >
                    {[...Array(Math.min(maxOrder, available)).keys()].map(i => (
                      <option key={i + minOrder} value={i + minOrder}>
                        {i + minOrder}
                      </option>
                    ))}
                  </select>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold text-primary-600">
                      {isFreeEvent ? 'Free' : formatPrice(ticketPrice * selectedQuantity)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isFreeEvent ? (
                <Button 
                  fullWidth 
                  size="large" 
                  onClick={handleReserveSpot}
                  loading={reservationLoading}
                  className="text-lg py-4"
                >
                  {reservationLoading ? 'Reserving...' : 'Reserve Your Spot'}
                </Button>
              ) : (
                <Button 
                  fullWidth 
                  size="large" 
                  onClick={() => {
                    const ticket = tickets[selectedTicketIndex] || {};
                    setShowMobileTicketModal(false);
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
                  }}
                  className="text-lg py-4"
                >
                  Buy Tickets Now
                </Button>
              )}

              {/* Urgency Messages */}
              {available <= 10 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-medium">
                    🔥 Only {available} spots left!
                  </p>
                </div>
              )}

              {/* Event Info Summary */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <FiCalendar className="w-4 h-4 mr-3 text-primary-600" />
                  <span>{formatDate(event.date)} at {event.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 mr-3 text-primary-600" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TicketCard = ({ ticket, index, isSelected, onSelect, compact = false }) => {
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
        } ${compact ? 'p-3' : ''}`}
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
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {ticket.type}
            </h3>
            <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold ${isSelected ? 'text-primary-600' : isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
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

        {ticket.benefits && ticket.benefits.length > 0 && !compact && (
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

  // Mobile Floating Action Button
  const MobileFloatingButton = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4 z-40 lg:hidden">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">Starting from</p>
          <p className="text-xl font-bold text-primary-600">
            {isFreeEvent ? 'Free' : formatPrice(lowestTicketPrice)}
          </p>
        </div>

        <Button 
          onClick={() => setShowMobileTicketModal(true)}
          size="large"
          className="flex-1 ml-4 py-3"
        >
          Get Tickets
        </Button>
      </div>
    </div>
  </div>
);


  // Mobile Header Summary
  const MobileHeaderSummary = () => (
    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{event.title}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
              {event.category?.name}
            </span>
            {isFreeEvent && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Free
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowMobileTicketModal(true)}
          className="ml-3 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700"
        >
          <FaTicketAlt className="w-5 h-5" />
        </button>
      </div>
      
      {/* Quick Info Row */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="flex items-center space-x-2">
          <FiCalendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Date & Time</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {formatDate(event.date).split(',')[0]}, {event.time}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FiMapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Location</p>
            <p className="text-sm font-medium text-gray-900 truncate">{event.venue}</p>
          </div>
        </div>
      </div>
    </div>
  );

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
  
  // Calculate lowest ticket price for mobile display
  const lowestTicketPrice = tickets.length > 0 
    ? Math.min(...tickets.filter(t => t.available > 0).map(t => t.price || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {showSuccessModal && <SuccessModal />}
      {showShareOptions && <ShareModal />}
      {showMobileTicketModal && <MobileTicketModal />}
      
      {/* Mobile Header */}
      <MobileHeaderSummary />

      {/* Desktop Navigation */}
      <nav className="hidden lg:block max-w-7xl mx-auto pt-6 px-4 lg:px-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600 font-medium">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/events" className="hover:text-primary-600 font-medium">Events</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-700 font-semibold truncate max-w-xs">{event.title}</li>
        </ol>
      </nav>

      {/* GRID LAYOUT - Desktop Design */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Event Image & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Section with Overlay - Desktop Only */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl shadow-xl">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 md:h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-medium capitalize">
                    {event.category?.name}
                  </span>
                  {isFreeEvent && (
                    <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                      Free Event
                    </span>
                  )}
                  {event.featured && (
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">{event.title}</h1>
                
                {/* Quick Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <FiClock className="w-4 h-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    <span className="truncate max-w-[200px]">{event.venue}</span>
                  </div>
                </div>
              </div>
              
              {/* Share Button - Floating */}
              <button 
                onClick={() => setShowShareOptions(true)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <IoShareSocialOutline className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Mobile Image */}
            <div className="lg:hidden relative overflow-hidden rounded-xl shadow-lg">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-56 object-cover"
              />
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowShareOptions(true)}
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
                >
                  <IoShareSocialOutline className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              {/* Booking Deadline & Countdown - Visible on All Screens */}
              {isUpcoming && available > 0 && selectedTicketIndex < tickets.length && tickets[selectedTicketIndex]?.salesEnd && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Booking will end on <span className="font-semibold">{new Date(tickets[selectedTicketIndex].salesEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {new Date(tickets[selectedTicketIndex].salesEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-3 font-medium">Time left to book this event</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.days).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">days</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.hours).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">hours</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.minutes).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">minutes</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.seconds).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">seconds</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <section className="pb-4 border-b border-gray-200">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">About This Event</h2>
                <p className="text-gray-600 text-sm lg:text-base leading-relaxed">{event.description}</p>
              </section>

              {/* Event Details Grid */}
<section className="py-4 border-b border-gray-200">
  <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Event Details</h2>
  
  <div className="grid grid-cols-2 gap-4 lg:gap-6">
    
    <div className="pb-4 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <FiUsers className="w-5 h-5 text-primary-600" />
        <div>
          <p className="text-xs lg:text-sm text-gray-500">Capacity</p>
          <p className="font-semibold text-gray-900 text-sm lg:text-base">{event.capacity} attendees</p>
        </div>
      </div>
    </div>

    <div className="pb-4 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <FiUsers className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-xs lg:text-sm text-gray-500">Registered</p>
          <p className="font-semibold text-gray-900 text-sm lg:text-base">{event.registered} people</p>
        </div>
      </div>
    </div>

    <div className="pb-4 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <span className="text-blue-600 font-bold">🎫</span>
        <div>
          <p className="text-xs lg:text-sm text-gray-500">Available Spots</p>
          <p className={`font-semibold text-sm lg:text-base ${spotsLeft <= 10 ? 'text-red-600' : 'text-green-600'}`}>
            {spotsLeft} spots left
          </p>
        </div>
      </div>
    </div>

    <div className="pb-4 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <span className="text-purple-600 font-bold">⏱️</span>
        <div>
          <p className="text-xs lg:text-sm text-gray-500">Duration</p>
          <p className="font-semibold text-gray-900 text-sm lg:text-base">{event.duration || '2-3 hours'}</p>
        </div>
      </div>
    </div>

  </div>
</section>


              {/* Organizer Info */}
              <section className="py-4 border-b border-gray-200">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Organizer</h2>
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-lg lg:text-xl font-bold">
                      {event.organizer?.organizationName?.charAt(0) || 'O'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                      {event.organizer?.organizationName || 'Event Organizer'}
                    </h3>
                    <p className="text-gray-600 text-sm lg:text-base">Professional Event Host</p>
                  </div>
                </div>
              </section>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <section className="py-4 border-b border-gray-200">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm transition-colors duration-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Location & Map */}
              <section className="py-4">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Event Location</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 lg:space-x-4">
                    <FiMapPin className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base lg:text-lg">{event.venue}</h3>
                      {event.address && (
                        <p className="text-gray-600 text-sm lg:text-base mt-1">{event.address}</p>
                      )}
                      {event.city && event.country && (
                        <p className="text-gray-600 text-sm lg:text-base">{event.city}, {event.country}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Google Maps Embed */}
                  <div className="rounded-lg overflow-hidden h-64 lg:h-96 mt-4">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent([event.venue, event.address, event.city, event.country].filter(Boolean).join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing location of ${event.venue}`}
                    ></iframe>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue, event.address, event.city, event.country].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-800 font-medium text-sm lg:text-base"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN - Ticket & Reservation (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              {/* Booking Deadline & Countdown - Desktop Only (Desktop version for sticky) */}
              {isUpcoming && available > 0 && selectedTicketIndex < tickets.length && tickets[selectedTicketIndex]?.salesEnd && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Booking will end on <span className="font-semibold">{new Date(tickets[selectedTicketIndex].salesEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {new Date(tickets[selectedTicketIndex].salesEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-3 font-medium">Time left to book this event</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.days).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">days</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.hours).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">hours</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.minutes).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">minutes</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{String(timeLeft.seconds).padStart(4, '0')}</p>
                      </div>
                      <p className="text-xs text-gray-600">seconds</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price & Badge */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {isFreeEvent ? 'Free' : formatPrice(ticketPrice)}
                  </span>
                  {isFreeEvent ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      No Payment Required
                    </span>
                  ) : (
                    <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      Secure Payment
                    </span>
                  )}
                </div>
                <p className="text-gray-500">per person • {available} available</p>
              </div>

              {/* Ticket Selection */}
              {tickets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {isFreeEvent ? 'Reservation Type' : 'Ticket Type'}
                  </h3>
                  <div className="space-y-3">
                    {tickets.map((ticket, index) => (
                      <TicketCard
                        key={ticket.id || ticket._id || index}
                        ticket={ticket}
                        index={index}
                        isSelected={selectedTicketIndex === index}
                        onSelect={(idx) => {
                          setSelectedTicketIndex(idx);
                          setSelectedQuantity(tickets[idx]?.minOrder || 1);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Total */}
              {isUpcoming && available > 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of {isFreeEvent ? 'spots' : 'tickets'}
                    </label>
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedQuantity}
                        onChange={e => setSelectedQuantity(parseInt(e.target.value))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {[...Array(Math.min(maxOrder, available)).keys()].map(i => (
                          <option key={i + minOrder} value={i + minOrder}>
                            {i + minOrder}
                          </option>
                        ))}
                      </select>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {isFreeEvent ? 'Free' : formatPrice(ticketPrice * selectedQuantity)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isFreeEvent ? (
                    <Button 
                      fullWidth 
                      size="large" 
                      onClick={handleReserveSpot}
                      loading={reservationLoading}
                      className="text-lg py-4"
                    >
                      {reservationLoading ? 'Reserving...' : 'Reserve Your Spot'}
                    </Button>
                  ) : (
                    <Button 
                      fullWidth 
                      size="large" 
                      onClick={() => {
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
                      }}
                      className="text-lg py-4"
                    >
                      Buy Tickets Now
                    </Button>
                  )}

                  {/* Urgency Messages */}
                  {daysUntil <= 7 && daysUntil > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-700 text-sm font-medium">
                        ⚡ Event starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}!
                      </p>
                    </div>
                  )}

                  {available <= 10 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm font-medium">
                        🔥 Only {available} spots left!
                      </p>
                    </div>
                  )}

                  {/* Additional Event Info */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-gray-600 text-sm">Duration</span>
                      <span className="font-medium text-sm">{event.duration || '2-3 hours'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-t border-gray-100">
                      <span className="text-gray-600 text-sm">Age Restriction</span>
                      <span className="font-medium text-sm">{event.ageRestriction || 'All ages welcome'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-t border-gray-100">
                      <span className="text-gray-600 text-sm">Ticket Delivery</span>
                      <span className="font-medium text-sm">{event.ticketDelivery || 'E-tickets provided'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sold Out State */}
              {available === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-500 text-2xl">🎫</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Sold Out</h4>
                  <p className="text-gray-500 mb-6">
                    This {isFreeEvent ? 'reservation type' : 'ticket type'} is currently unavailable
                  </p>
                  <Button 
                    fullWidth 
                    disabled 
                    variant="secondary"
                  >
                    Join Waitlist
                  </Button>
                </div>
              )}

              {/* Event Ended State */}
              {!isUpcoming && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-500 text-2xl">⏰</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Event Ended</h4>
                  <p className="text-gray-500">
                    This event has already taken place
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {isUpcoming && available > 0 && <MobileFloatingButton />}
    </div>
  );
};

export default EventDetails;