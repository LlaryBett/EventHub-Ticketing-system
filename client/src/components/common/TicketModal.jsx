import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { FaCheck } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { formatDate, formatPrice } from '../../utils/formatDate';
import Button from './Button';

const TicketModal = ({ 
  isOpen, 
  onClose, 
  event, 
  tickets, 
  selectedTicketIndex, 
  setSelectedTicketIndex,
  selectedQuantity, 
  setSelectedQuantity,
  isFreeEvent,
  isUpcoming,
  reservationLoading,
  onReserveSpot
}) => {
  const navigate = useNavigate();
  const selectedTicket = tickets[selectedTicketIndex] || {};
  const ticketPrice = selectedTicket.price || 0;
  const minOrder = selectedTicket.minOrder || 1;
  const maxOrder = Math.min(selectedTicket.maxOrder || 10, selectedTicket.available || 10);
  const available = selectedTicket.available || 0;

  if (!isOpen || !event) return null;

  const TicketCard = ({ ticket, index, isSelected, onSelect, compact = true }) => {
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
            <h3 className={`font-semibold text-base ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {ticket.type}
            </h3>
            <p className={`text-xl font-bold ${isSelected ? 'text-primary-600' : isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
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

        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-xl flex items-center justify-center">
            <span className="text-gray-500 font-semibold">Sold Out</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 lg:hidden">
      <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-gray-900">Get Tickets</h2>
          <button 
            onClick={onClose}
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
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  No Payment Required
                </span>
              ) : (
                <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-medium">
                  Secure Payment
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs">per person • {available} available</p>
          </div>

          {/* Ticket Selection */}
          {tickets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-3">
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
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Number of {isFreeEvent ? 'spots' : 'tickets'}
                </label>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedQuantity}
                    onChange={e => setSelectedQuantity(parseInt(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    {[...Array(Math.min(maxOrder, available)).keys()].map(i => (
                      <option key={i + minOrder} value={i + minOrder}>
                        {i + minOrder}
                      </option>
                    ))}
                  </select>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-primary-600">
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
                  onClick={onReserveSpot}
                  loading={reservationLoading}
                  className="font-semibold py-3"
                >
                  {reservationLoading ? 'Reserving...' : 'Reserve Your Spot'}
                </Button>
              ) : (
                <Button 
                  fullWidth 
                  size="large" 
                  onClick={() => {
                    const ticket = tickets[selectedTicketIndex] || {};
                    onClose();
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
                  className="font-semibold py-3"
                >
                  Buy Tickets Now
                </Button>
              )}

              {/* Urgency Messages */}
              {available <= 10 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-xs font-medium">
                    Only {available} spots left!
                  </p>
                </div>
              )}

              {/* Event Info Summary */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-600">
                  <FiCalendar className="w-4 h-4 mr-3 text-primary-600" />
                  <span>{formatDate(event.date)} at {event.time}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <FiMapPin className="w-4 h-4 mr-3 text-primary-600" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>

              {/* Additional Event Info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-xs">Duration</span>
                  <span className="font-medium text-xs text-gray-900">{event.duration || '2-3 hours'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-xs">Age Restriction</span>
                  <span className="font-medium text-xs text-gray-900">{event.ageRestriction || 'All ages welcome'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-xs">Ticket Delivery</span>
                  <span className="font-medium text-xs text-gray-900">{event.ticketDelivery || 'E-tickets provided'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
