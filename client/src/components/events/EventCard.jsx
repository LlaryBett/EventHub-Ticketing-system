import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { formatPrice, getDaysUntilEvent } from '../../utils/formatDate';
import Button from '../common/Button';

const EventCard = ({ event }) => {
  const { addToCart } = useCart();
  const { showSuccess } = useUI();

  const handleAddToCart = (e, ticket) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ticket) {
      showSuccess('No tickets available for this event.');
      return;
    }

    const payload = {
      eventId: event.id,
      ticketType: ticket.type,
      quantity: 1
    };

    addToCart(payload);
    showSuccess(`${event.title} added to cart!`);
  };

  const firstTicket = Array.isArray(event.tickets) && event.tickets.length > 0
    ? event.tickets[0]
    : null;
  const hasPrice = firstTicket && typeof firstTicket.price === 'number';
  
  const daysUntil = getDaysUntilEvent(event.date);
  const isUpcoming = daysUntil >= 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="block"
      tabIndex={0}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="card overflow-hidden group flex flex-col h-full cursor-pointer"
        tabIndex={-1}
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
          {!isUpcoming && (
            <div className="absolute top-4 right-4">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                Event Passed
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-primary-600 font-medium capitalize">
              {event.category?.name}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{event.date}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{event.time}</span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between mt-auto gap-2">
          <Link
            to={`/events/${event.id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center group/link transition-colors duration-200"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
          >
            Buy Tickets
            <svg 
              className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {hasPrice && isUpcoming ? (
            <Button
              fullWidth={false}
              onClick={e => handleAddToCart(e, firstTicket)}
              className="group-hover:bg-primary-700 min-w-[140px]"
            >
              {formatPrice(firstTicket.price)}
            </Button>
          ) : !isUpcoming ? null : (
            <Button fullWidth={false} disabled variant="secondary" className="min-w-[100px]">
              No Tickets
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;