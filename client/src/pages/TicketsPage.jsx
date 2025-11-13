import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ticketService from '../services/ticketService';

const TicketsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !user) {
      setLookupEmail(emailParam);
      handleEmailLookup(null, emailParam);
    }
  }, [searchParams, user]);

  const fetchUserTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketService.getMyTickets();
      if (response.success) {
        setTickets(response.data);
      } else {
        setError('Failed to load tickets');
      }
    } catch (error) {
      setError(error.message || 'Error fetching tickets');
      console.error('Error fetching tickets:', error);
    }
    setLoading(false);
  };

  const handleEmailLookup = async (e, emailOverride) => {
    if (e) e.preventDefault();
    
    const emailToLookup = emailOverride || lookupEmail;
    if (!emailToLookup) return;

    setLoading(true);
    setError('');
    try {
      const response = await ticketService.lookupTicketsByEmail(emailToLookup);
      if (response.success) {
        setTickets(response.data);
        if (response.data.length === 0) {
          setError('No tickets found for this email');
        }
      } else {
        setError('Failed to lookup tickets');
      }
    } catch (error) {
      setError(error.message || 'Error looking up tickets');
      console.error('Error looking up tickets:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return 'TBA';
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) {
      if (typeof dateInput === 'object' && dateInput !== null) {
        const candidate = dateInput.start || dateInput.date || dateInput.datetime;
        if (candidate) {
          const d2 = new Date(candidate);
          if (!isNaN(d2.getTime())) return d2.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
        }
      }
      return 'TBA';
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const normalizeDateFromTicket = (ticket) => {
    if (!ticket) return null;
    const candidates = [
      ticket.eventId?.date,
      ticket.event?.date,
      ticket.eventId?.dates?.start,
      ticket.event?.dates?.start,
      ticket.eventDate,
      ticket.event?.startDate,
      ticket.createdAt
    ];
    for (const c of candidates) {
      if (c) {
        return c;
      }
    }
    return null;
  };

  const maskTicketCode = (code) => {
    if (!code) return '';
    const s = String(code);
    if (s.length <= 4) return s;
    return '****' + s.slice(-4);
  };

  const getTicketPrice = (ticket) => {
    return ticket?.price ?? ticket?.ticketId?.price ?? null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Single responsive layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main content area - adapts to available space */}
          <div className="w-full lg:flex-1">
            
            {/* Header */}
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Your Tickets
              </h1>
              <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Access your event tickets and manage your bookings in one place.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto lg:mx-0">
                {error}
              </div>
            )}

            {/* Email Lookup Form - only for logged out users */}
            {!user && (
              <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl mx-auto lg:mx-0">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 text-center lg:text-left">
                  Lookup by Email
                </h2>
                
                <form onSubmit={handleEmailLookup} className="space-y-3 lg:space-y-0 lg:flex lg:gap-3">
                  <input
                    type="email"
                    placeholder="Enter your booking email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base lg:text-lg"
                    required
                  />
                  <button 
                    type="submit"
                    className="w-full lg:w-auto lg:flex-shrink-0 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-base lg:text-lg shadow-lg hover:shadow-xl"
                  >
                    Find My Tickets
                  </button>
                </form>

                <p className="text-sm text-gray-600 mt-4 text-center lg:text-left">
                  Enter the email address you used when booking the tickets
                </p>
              </div>
            )}

            {/* Tickets List */}
            <div className="max-w-2xl mx-auto lg:mx-0">
              {tickets.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 text-center lg:text-left">
                    Your Tickets ({tickets.length})
                  </h3>
                  {tickets.map(ticket => (
                    <div key={ticket._id || ticket.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {ticket.eventId?.title || ticket.event?.title}
                          </h4>
                          <p className="text-gray-600 mt-1 text-sm">
                            {ticket.eventId?.venue || ticket.event?.venue}
                          </p>
                        </div>
                        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.isUsed 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.isUsed ? 'Used' : 'Active'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Attendee:</span>
                          <span className="font-medium ml-2">{ticket.attendeeName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ticket Type:</span>
                          <span className="font-medium ml-2">{ticket.ticketType || ticket.ticketId?.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Event Date:</span>
                          <span className="font-medium ml-2">
                            {formatDate(normalizeDateFromTicket(ticket))}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          {(() => {
                            const priceVal = getTicketPrice(ticket);
                            return priceVal === 0 ? (
                              <span className="font-medium ml-2">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  Free
                                </span>
                              </span>
                            ) : (
                              <span className="font-medium ml-2">ksh {priceVal ?? 'TBA'}</span>
                            );
                          })()}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-600">Ticket Code:</span>
                          <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded text-xs ml-2">
                            {maskTicketCode(ticket.ticketCode)}
                          </span>
                        </div>
                      </div>

                      {ticket.qrCode && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">QR Code</p>
                          <div className="flex justify-center">
                            <img 
                              src={ticket.qrCode} 
                              alt="Ticket QR Code" 
                              className="w-32 h-32 border-2 border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !loading && !error && (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-400 text-6xl mb-4">🎫</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-600">
                      {user 
                        ? "You haven't purchased any tickets yet." 
                        : "Enter your email above to find your tickets."
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Side Image - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block flex-1 sticky top-8">
            <div className="flex justify-center">
              <img 
                src="https://img.freepik.com/free-vector/illustration-people-with-cloud_53876-26646.jpg" 
                alt="Tickets Background"
                className="w-full max-w-md object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;