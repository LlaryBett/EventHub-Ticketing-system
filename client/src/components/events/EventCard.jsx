import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { formatDate, formatPrice, getDaysUntilEvent } from '../../utils/formatDate';
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

  const daysUntil = getDaysUntilEvent(event.date);
  const isUpcoming = daysUntil >= 0;
  const spotsLeft = event.capacity - event.registered;

  const firstTicket = Array.isArray(event.tickets) && event.tickets.length > 0
    ? event.tickets[0]
    : null;
  const hasPrice = firstTicket && typeof firstTicket.price === 'number';

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
          <div className="absolute top-4 right-4">
            <span className="bg-white bg-opacity-90 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
              {hasPrice ? formatPrice(firstTicket.price) : 'N/A'}
            </span>
          </div>
          {!isUpcoming && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                Event Passed
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-primary-600 font-medium capitalize">
              {event.category?.icon} {event.category?.name}
            </span>
            {isUpcoming && daysUntil <= 7 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {daysUntil === 0 ? 'Today' : `${daysUntil} days left`}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {event.title}
          </h3>

          <p className="text-gray-600 text-xs mb-2 line-clamp-3">
            {event.description}
          </p>

          <div className="mb-2 h-4">
            {spotsLeft <= 10 && spotsLeft > 0 && (
              <span className="text-orange-600 font-medium text-sm">
                Only {spotsLeft} spots left!
              </span>
            )}
            {spotsLeft === 0 && (
              <span className="text-red-600 font-medium text-sm">
                Sold Out
              </span>
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
            See More Details
            <svg 
              className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {isUpcoming ? (
            hasPrice ? (
              <Button
                fullWidth={false}
                onClick={e => handleAddToCart(e, firstTicket)}
                className="group-hover:bg-primary-700 min-w-[140px]"
              >
                • {formatPrice(firstTicket.price)}
              </Button>
            ) : (
              <Button fullWidth={false} disabled variant="secondary" className="min-w-[100px]">
                Sold Out
              </Button>
            )
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
