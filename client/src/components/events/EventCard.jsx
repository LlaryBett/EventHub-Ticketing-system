import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, getDaysUntilEvent } from '../../utils/formatDate';
import Button from '../common/Button';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleBuyTickets = (e) => {
    e.stopPropagation();
    navigate(`/events/${event.id}`);
  };

  const daysUntil = getDaysUntilEvent(event.date);
  const isUpcoming = daysUntil >= 0;
  const isFreeEvent = event.pricingType === 'free';

  // Get the lowest price for display
  const getLowestPrice = () => {
    if (!event.tickets || event.tickets.length === 0) return null;
    
    const prices = event.tickets
      .filter(ticket => ticket.price > 0)
      .map(ticket => ticket.price);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const lowestPrice = getLowestPrice();
  const hasMultipleTickets = event.tickets && event.tickets.length > 1;

  // Format date and time as "Wed, Feb 4 • 10:00 AM"
  const formatEventDateTime = (dateString, timeString) => {
    try {
      const date = new Date(dateString);
      const time = timeString || '00:00';
      
      // Format date as "Wed, Feb 4"
      const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', dateOptions);
      
      // Format time as "10:00 AM"
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      const formattedTime = `${formattedHour}:${minutes} ${ampm}`;
      
      return `${formattedDate} • ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return `${dateString} • ${timeString}`;
    }
  };

  const formattedDateTime = formatEventDateTime(event.date, event.time);

  return (
    <div
      onClick={handleCardClick}
      className="block cursor-pointer"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="card overflow-hidden group flex flex-col h-full"
        tabIndex={-1}
        style={{ height: '420px' }}
      >
        <div className="relative">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {event.featured && (
            <div className="absolute top-4 left-4">
              <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            </div>
          )}
          
          {isFreeEvent && (
            <div className="absolute top-4 right-4">
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Free Event
              </span>
            </div>
          )}
          
          {!isUpcoming && (
            <div className="absolute top-4 right-4">
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Event Passed
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-1">
            <span className="text-sm text-primary-600 font-medium capitalize">
              {event.category?.name}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-sm text-gray-600 mb-3">
            <div className="flex items-start gap-1.5">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900 font-medium">{formattedDateTime}</span>
            </div>

            {event.venue && (
              <div className="flex items-start gap-1.5">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-500">
            {isFreeEvent ? 'Free' : (
              hasMultipleTickets ? `From ${formatPrice(lowestPrice)}` : formatPrice(lowestPrice)
            )}
          </span>

          {isUpcoming ? (
            <Button
              onClick={handleBuyTickets}
              className="py-1.5 px-4"
            >
              {event.actionButtonText || (isFreeEvent ? 'Reserve Spot' : 'Buy Tickets')}
            </Button>
          ) : (
            <Button disabled variant="secondary" className="py-1.5 px-4">
              Event Passed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;