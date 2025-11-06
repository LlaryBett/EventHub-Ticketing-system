import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, FileText, Camera, MapPin, Tag, Calendar, RotateCcw, Plus, X, Clock, Users, FileCheck, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { uiService } from '../services/uiService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Organizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // ADDED: Pricing type state
  const [pricingType, setPricingType] = useState('paid');
  
  const [ticketTypes, setTicketTypes] = useState([
    { 
      type: '', 
      price: '', 
      quantity: '', 
      description: '',
      benefits: [''],
      salesEnd: '',
      minOrder: 1,
      maxOrder: 10,
      id: 1 
    }
  ]);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    image: '',
    tags: '',
    // NEW FIELDS
    duration: '2-3 hours',
    ageRestriction: 'All ages welcome',
    ticketDelivery: 'E-tickets provided',
    eventType: 'in_person',
    venueAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        // Try to use categories from discover configuration (admin-managed)
        try {
          const discoverResp = await uiService.getDiscoverContent();
          if (discoverResp?.success && Array.isArray(discoverResp.data?.categories) && discoverResp.data.categories.length > 0) {
            // discover categories typically have {_id, name, slug, ...}
            setCategories(discoverResp.data.categories);
            return;
          }
        } catch (err) {
          // No external fallback - log and continue with empty categories
          console.warn('uiService.getDiscoverContent failed; categories will be empty', err);
        }

        // If discover config didn't provide categories, leave categories empty
        setCategories([]);
      } catch (error) {
        // Show backend error message if available
        showError(error.response?.data?.message || 'Failed to load categories. Please try again.');
        console.error('Categories loading error:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [showError]);

  // ADDED: Effect to handle pricing type changes
  useEffect(() => {
    if (pricingType === 'free') {
      // Auto-set all ticket prices to 0 for free events
      const updatedTickets = ticketTypes.map(ticket => ({
        ...ticket,
        price: '0'
      }));
      setTicketTypes(updatedTickets);
    }
  }, [pricingType]);

  useEffect(() => {
    if (user?.data?.userType === 'attendee') {
      setShowInfoModal(true);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleVenueAddressChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      venueAddress: {
        ...prev.venueAddress,
        [field]: value
      }
    }));
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticketTypes];
    
    // ADDED: Auto-set price to 0 if changing to free event
    if (field === 'price' && pricingType === 'free') {
      updatedTickets[index][field] = '0';
    } else {
      updatedTickets[index][field] = value;
    }
    
    setTicketTypes(updatedTickets);
  };

  const handleBenefitChange = (ticketIndex, benefitIndex, value) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[ticketIndex].benefits[benefitIndex] = value;
    setTicketTypes(updatedTickets);
  };

  const addBenefit = (ticketIndex) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[ticketIndex].benefits.push('');
    setTicketTypes(updatedTickets);
  };

  const removeBenefit = (ticketIndex, benefitIndex) => {
    const updatedTickets = [...ticketTypes];
    if (updatedTickets[ticketIndex].benefits.length > 1) {
      updatedTickets[ticketIndex].benefits.splice(benefitIndex, 1);
      setTicketTypes(updatedTickets);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { 
      type: '', 
      price: pricingType === 'free' ? '0' : '', // ADDED: Auto-set price based on pricing type
      quantity: '', 
      description: '',
      benefits: [''],
      salesEnd: '',
      minOrder: 1,
      maxOrder: 10,
      id: Date.now() 
    }]);
  };

  const removeTicketType = (index) => {
    if (ticketTypes.length > 1) {
      const updatedTickets = [...ticketTypes];
      updatedTickets.splice(index, 1);
      setTicketTypes(updatedTickets);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showError('Please log in to create events');
      return;
    }

    if (user.data.userType !== 'organizer' || !user.data.organizerProfile || !user.data.organizerProfile._id) {
      showError('You must be an organizer to create events. Please complete your organizer profile first.');
      return;
    }

    // Validate tickets - Updated validation logic
    const validTickets = ticketTypes.filter(ticket => 
      ticket.type.trim() && 
      ticket.quantity && 
      ticket.salesEnd &&
      ticket.benefits.some(benefit => benefit.trim())
    );

    if (validTickets.length === 0) {
      showError('Please add at least one valid ticket type with all required fields filled');
      return;
    }

    // ADDED: Validate price for paid events
    if (pricingType === 'paid') {
      const hasInvalidPrice = validTickets.some(ticket => 
        !ticket.price || parseFloat(ticket.price) <= 0
      );
      if (hasInvalidPrice) {
        showError('Please set valid prices for all ticket types');
        return;
      }
    }

    setLoading(true);

    try {
      const newEvent = {
        ...eventData,
        // ADDED: Include pricing type
        pricingType: pricingType,
        tickets: validTickets.map(ticket => ({
          type: ticket.type.trim(),
          price: pricingType === 'free' ? 0 : parseFloat(ticket.price), // ADDED: Force 0 for free events
          quantity: parseInt(ticket.quantity),
          available: parseInt(ticket.quantity),
          description: ticket.description.trim(),
          benefits: ticket.benefits.filter(benefit => benefit.trim()).map(benefit => benefit.trim()),
          salesEnd: new Date(ticket.salesEnd),
          minOrder: parseInt(ticket.minOrder) || 1,
          maxOrder: parseInt(ticket.maxOrder) || 10
        })),
        organizer: user.data.organizerProfile._id,
        image: eventData.image || 'https://images.pexels.com/photos-1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: eventData.tags
          ? eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [],
        // NEW: Include venue address only if fields are filled
        venueAddress: eventData.venueAddress.street || eventData.venueAddress.city || eventData.venueAddress.state || eventData.venueAddress.zipCode
          ? eventData.venueAddress
          : undefined
      };

      console.log('Payload sent to backend (newEvent):', newEvent);

      const response = await eventService.createEvent(newEvent);
      // Use success message from backend
      showSuccess(response?.data?.message || response?.message || 'Event created successfully!');
      
      // Reset form
      setEventData({
        title: '',
        description: '',
        category: '',
        date: '',
        time: '',
        venue: '',
        image: '',
        tags: '',
        duration: '2-3 hours',
        ageRestriction: 'All ages welcome',
        ticketDelivery: 'E-tickets provided',
        eventType: 'in_person',
        venueAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        }
      });
      // ADDED: Reset pricing type
      setPricingType('paid');
      setTicketTypes([{ 
        type: '', 
        price: '', 
        quantity: '', 
        description: '',
        benefits: [''],
        salesEnd: '',
        minOrder: 1,
        maxOrder: 10,
        id: 1 
      }]);
    } catch (error) {
      // Show specific error message from backend
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('Failed to create event. Please try again.');
      }
      console.error('Event creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const InfoModal = () => (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 border border-white/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Want to Create Events?</h3>
          <p className="text-gray-600 mb-6">
            You're currently viewing this as an attendee. To create and manage your own events, 
            you'll need to register as an organizer.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <Button
              onClick={() => navigate('/register?type=organizer', {
                state: {
                  prefill: {
                    name: user.data.name,
                    email: user.data.email,
                    phone: user.data.phone,
                    marketingConsent: user.data.marketingConsent,
                    acceptTerms: user.data.acceptTerms
                  }
                }
              })}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Register as Organizer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInfoModal(false)}
            >
              Continue Browsing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show modal if user is attendee and modal is open */}
      {showInfoModal && <InfoModal />}
      
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            {/* Left: Text content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Create Your Event
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Share your passion with the world. Create an amazing event that people will love to attend.
              </p>
            </div>
            
            {/* Right: Image with clip-path */}
            <div
              className="flex-1 bg-cover bg-center min-h-[150px] md:min-h-[180px]"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop')",
                clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%, 0 50%)"
              }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Add disabled state to all form elements if user is attendee */}
                  <fieldset disabled={user?.data?.userType === 'attendee'} className={user?.data?.userType === 'attendee' ? 'opacity-60' : ''}>
                    {/* Basic Information */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Input
                            label="Event Title"
                            placeholder="Give your event a catchy title"
                            value={eventData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Describe your event in detail. What makes it special?"
                            value={eventData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          ></textarea>
                        </div>

                        {/* ADDED: Pricing Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Type <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                              pricingType === 'paid' 
                                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                                : 'border-gray-300'
                            }`}>
                              <input
                                type="radio"
                                name="pricingType"
                                value="paid"
                                checked={pricingType === 'paid'}
                                onChange={(e) => setPricingType(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <DollarSign className="h-6 w-6 text-gray-400" />
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">Paid Event</p>
                                    <p className="text-xs text-gray-500">Charge for tickets</p>
                                  </div>
                                </div>
                              </div>
                            </label>

                            <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                              pricingType === 'free' 
                                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                                : 'border-gray-300'
                            }`}>
                              <input
                                type="radio"
                                name="pricingType"
                                value="free"
                                checked={pricingType === 'free'}
                                onChange={(e) => setPricingType(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <Ticket className="h-6 w-6 text-gray-400" />
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">Free Event</p>
                                    <p className="text-xs text-gray-500">Reserve spots</p>
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={eventData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                            disabled={categoriesLoading}
                          >
                            <option value="">Select a category</option>
                            {categories.map((category, idx) => (
                              <option
                                key={category._id || category.id || idx}
                                value={category.slug || category._id || category.id}
                              >
                                {category.name || category.title || category.label || `Category ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                          {categoriesLoading && (
                            <p className="text-sm text-gray-500 mt-2">Loading categories...</p>
                          )}
                        </div>

                        <div>
                          <Input
                            label="Tags (comma separated)"
                            type="text"
                            placeholder="e.g. startup, pitch, investment"
                            value={eventData.tags}
                            onChange={(e) => handleInputChange('tags', e.target.value)}
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            Add relevant tags separated by commas
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Divider after Basic Information */}
                    <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

                    {/* NEW: Event Details Section */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                          </label>
                          <select
                            value={eventData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="1-2 hours">1-2 hours</option>
                            <option value="2-3 hours">2-3 hours</option>
                            <option value="3-4 hours">3-4 hours</option>
                            <option value="4+ hours">4+ hours</option>
                            <option value="All day">All day</option>
                            <option value="Multiple days">Multiple days</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Age Restriction
                          </label>
                          <select
                            value={eventData.ageRestriction}
                            onChange={(e) => handleInputChange('ageRestriction', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="All ages welcome">All ages welcome</option>
                            <option value="13+">13+</option>
                            <option value="16+">16+</option>
                            <option value="18+">18+</option>
                            <option value="21+">21+</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ticket Delivery
                          </label>
                          <select
                            value={eventData.ticketDelivery}
                            onChange={(e) => handleInputChange('ticketDelivery', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="E-tickets provided">E-tickets provided</option>
                            <option value="Mobile tickets">Mobile tickets</option>
                            <option value="Print at home">Print at home</option>
                            <option value="Will call">Will call</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Type
                          </label>
                          <select
                            value={eventData.eventType}
                            onChange={(e) => handleInputChange('eventType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="in_person">In Person</option>
                            <option value="virtual">Virtual</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Divider after Event Details */}
                    <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

                    {/* Date & Time */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Time</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Event Date"
                          type="date"
                          value={eventData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          required
                        />
                        <Input
                          label="Event Time"
                          type="time"
                          value={eventData.time}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          required
                        />
                      </div>
                    </section>

                    {/* Divider after Date & Time */}
                    <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

                    {/* Location */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
                      <div className="space-y-4">
                        <Input
                          label="Venue Name"
                          placeholder="e.g., Convention Center, Hotel Ballroom"
                          value={eventData.venue}
                          onChange={(e) => handleInputChange('venue', e.target.value)}
                          required
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Street Address"
                            placeholder="123 Main Street"
                            value={eventData.venueAddress.street}
                            onChange={(e) => handleVenueAddressChange('street', e.target.value)}
                          />
                          <Input
                            label="City"
                            placeholder="City"
                            value={eventData.venueAddress.city}
                            onChange={(e) => handleVenueAddressChange('city', e.target.value)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="State/Province"
                            placeholder="State"
                            value={eventData.venueAddress.state}
                            onChange={(e) => handleVenueAddressChange('state', e.target.value)}
                          />
                          <Input
                            label="ZIP/Postal Code"
                            placeholder="12345"
                            value={eventData.venueAddress.zipCode}
                            onChange={(e) => handleVenueAddressChange('zipCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Divider after Location */}
                    <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

                    {/* Event Image */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Image (Optional)</h2>
                      <Input
                        label="Image URL"
                        type="url"
                        placeholder="https://example.com/your-event-image.jpg"
                        value={eventData.image}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Provide a URL to an image that represents your event. If left blank, a default image will be used.
                      </p>
                    </section>

                    {/* Divider after Event Image */}
                    <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

                    {/* Enhanced Ticket Types Section */}
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {pricingType === 'free' ? 'Reservation Types' : 'Ticket Types'}
                        </h2>
                        <div className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                          {pricingType === 'free' ? 'Free Event' : 'Paid Event'}
                        </div>
                      </div>
                      <div className="space-y-6">
                        {ticketTypes.map((ticket, index) => (
                          <div key={ticket.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-gray-900">
                                {pricingType === 'free' ? 'Reservation Type' : 'Ticket Type'} #{index + 1}
                              </h3>
                              {ticketTypes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTicketType(index)}
                                  className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center space-x-1"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>

                            {/* Basic Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {pricingType === 'free' ? 'Reservation Type' : 'Ticket Type'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={pricingType === 'free' ? "e.g., General, VIP, Early Access" : "e.g., General, VIP, Early Bird"}
                                  value={ticket.type}
                                  onChange={(e) => handleTicketChange(index, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {pricingType === 'free' ? 'Price' : 'Price ($)'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={ticket.price}
                                  onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    pricingType === 'free' ? 'bg-gray-100 cursor-not-allowed' : ''
                                  }`}
                                  required
                                  disabled={pricingType === 'free'}
                                />
                                {pricingType === 'free' && (
                                  <p className="text-xs text-gray-500 mt-1">Free events have $0 tickets</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Spots Available <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="100"
                                  value={ticket.quantity}
                                  onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            </div>

                            {/* Description Row */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {pricingType === 'free' ? 'Reservation Description' : 'Ticket Description'}
                              </label>
                              <textarea
                                rows={2}
                                placeholder={pricingType === 'free' ? "Brief description of this reservation type" : "Brief description of this ticket type"}
                                value={ticket.description}
                                onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              ></textarea>
                            </div>

                            {/* Benefits Section */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Benefits <span className="text-red-500">*</span>
                              </label>
                              <div className="space-y-2">
                                {ticket.benefits.map((benefit, benefitIndex) => (
                                  <div key={benefitIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      placeholder="e.g., Access to all sessions, Free lunch, Networking dinner"
                                      value={benefit}
                                      onChange={(e) => handleBenefitChange(index, benefitIndex, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      required
                                    />
                                    {ticket.benefits.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeBenefit(index, benefitIndex)}
                                        className="p-2 text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addBenefit(index)}
                                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm font-medium"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add Benefit</span>
                                </button>
                              </div>
                            </div>

                            {/* Sales End Date and Order Limits */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {pricingType === 'free' ? 'Registration End Date' : 'Sales End Date'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={ticket.salesEnd}
                                  onChange={(e) => handleTicketChange(index, 'salesEnd', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Min Order
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={ticket.minOrder}
                                  onChange={(e) => handleTicketChange(index, 'minOrder', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Max Order
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={ticket.maxOrder}
                                  onChange={(e) => handleTicketChange(index, 'maxOrder', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          onClick={addTicketType}
                          variant="outline"
                          size="small"
                          className="flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Another {pricingType === 'free' ? 'Reservation Type' : 'Ticket Type'}</span>
                        </Button>
                      </div>
                    </section>

                    {/* Divider above submit */}
                    <div className="pt-6">
                      <hr aria-hidden="true" className="w-full border-t border-gray-300 mb-6" />
                       <Button
                         type="submit"
                         size="large"
                         loading={loading}
                         disabled={loading || categoriesLoading}
                         className="w-1/2 mx-auto"
                       >
                         {loading ? 'Creating Event...' : `Create ${pricingType === 'free' ? 'Free' : 'Paid'} Event`}
                       </Button>
                    </div>

                  </fieldset>
                </form>
              </div>
            </div>
          </div>

          {/* Tips Section - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-primary-50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tips for Success</h2>
                <div className="space-y-4">
                  {/* ADDED: Free Event Tip */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-primary-600" />
                      Free vs Paid Events
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Choose free for community events, workshops, or networking. Use paid for premium experiences with higher value.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <Ticket className="w-4 h-4 mr-2 text-primary-600" />
                      Multiple Ticket Types
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Offer different tiers (General, VIP, Early Bird) to appeal to various audiences.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-primary-600" />
                      Great Description
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Be clear about what attendees can expect. Include agenda and special features.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <Camera className="w-4 h-4 mr-2 text-primary-600" />
                      Quality Images
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Compelling images significantly increase registrations. Use bright, professional photos.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                      Right Venue
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Ensure your venue is accessible with the right capacity for your audience.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-primary-600" />
                      Relevant Tags
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Use specific tags to help your target audience discover your event.
                    </p>
                  </div>
                  {/* NEW TIPS */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary-600" />
                      Clear Duration
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Set realistic event duration to help attendees plan their schedule.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <Users className="w-4 h-4 mr-2 text-primary-600" />
                      Age Restrictions
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Clearly state age requirements to set proper expectations.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                      <FileCheck className="w-4 h-4 mr-2 text-primary-600" />
                      Ticket Delivery
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Choose the right ticket delivery method for your event type.
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider between Tips and Quick Actions */}
              <hr aria-hidden="true" className="w-full border-t border-gray-300 my-6" />

              {/* Quick Actions Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      const now = new Date();
                      const today = now.toISOString().split('T')[0];
                      const currentTime = now.toTimeString().slice(0, 5);
                      handleInputChange('date', today);
                      handleInputChange('time', currentTime);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Set to Today</div>
                        <div className="text-gray-500 text-xs">Use current date & time</div>
                      </div>
                    </div>
                  </button>

                  {/* ADDED: Free Event Sample */}
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setPricingType('free');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const salesEndDate = tomorrow.toISOString().slice(0, 16);
                      
                      setTicketTypes([
                        { 
                          type: 'General Admission', 
                          price: '0', 
                          quantity: '100', 
                          description: 'Free community event access',
                          benefits: ['Access to all sessions', 'Networking opportunities'],
                          salesEnd: salesEndDate,
                          minOrder: 1,
                          maxOrder: 5,
                          id: 1 
                        }
                      ]);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Ticket className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Free Event Setup</div>
                        <div className="text-gray-500 text-xs">Create a free community event</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setPricingType('paid');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const salesEndDate = tomorrow.toISOString().slice(0, 16);
                      
                      setTicketTypes([
                        { 
                          type: 'Early Bird', 
                          price: '25', 
                          quantity: '50', 
                          description: 'Special early bird pricing',
                          benefits: ['Access to all sessions', 'Welcome kit'],
                          salesEnd: salesEndDate,
                          minOrder: 1,
                          maxOrder: 5,
                          id: 1 
                        },
                        { 
                          type: 'General', 
                          price: '35', 
                          quantity: '100', 
                          description: 'Standard admission ticket',
                          benefits: ['Access to all sessions'],
                          salesEnd: salesEndDate,
                          minOrder: 1,
                          maxOrder: 10,
                          id: 2 
                        },
                        { 
                          type: 'VIP', 
                          price: '75', 
                          quantity: '25', 
                          description: 'Premium experience with extra benefits',
                          benefits: ['Access to all sessions', 'VIP lounge access', 'Networking dinner'],
                          salesEnd: salesEndDate,
                          minOrder: 1,
                          maxOrder: 3,
                          id: 3 
                        }
                      ]);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Paid Event Setup</div>
                        <div className="text-gray-500 text-xs">Add 3 complete ticket types</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      handleInputChange('tags', 'networking, professional, business');
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Popular Tags</div>
                        <div className="text-gray-500 text-xs">Add common event tags</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setEventData({
                        title: '',
                        description: '',
                        category: '',
                        date: '',
                        time: '',
                        venue: '',
                        image: '',
                        tags: '',
                        duration: '2-3 hours',
                        ageRestriction: 'All ages welcome',
                        ticketDelivery: 'E-tickets provided',
                        eventType: 'in_person',
                        venueAddress: {
                          street: '',
                          city: '',
                          state: '',
                          zipCode: ''
                        }
                      });
                      // ADDED: Reset pricing type
                      setPricingType('paid');
                      setTicketTypes([{ 
                        type: '', 
                        price: '', 
                        quantity: '', 
                        description: '',
                        benefits: [''],
                        salesEnd: '',
                        minOrder: 1,
                        maxOrder: 10,
                        id: 1 
                      }]);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Clear Form</div>
                        <div className="text-gray-500 text-xs">Reset all fields</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Organizer;