import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, FileText, Camera, MapPin, Tag, Calendar, RotateCcw, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { categoriesService } from '../services/categoriesService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Organizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
    tags: ''
  });
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesData = await categoriesService.getAllCategories();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (Array.isArray(categoriesData?.data)) {
          setCategories(categoriesData.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        showError('Failed to load categories. Please try again.');
        console.error('Categories loading error:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [showError]);

  useEffect(() => {
    if (user?.data?.userType === 'attendee') {
      setShowInfoModal(true);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index][field] = value;
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
      price: '', 
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
      ticket.price && 
      ticket.quantity && 
      ticket.salesEnd &&
      ticket.benefits.some(benefit => benefit.trim()) // This now works because we have benefit inputs
    );

    if (validTickets.length === 0) {
      showError('Please add at least one valid ticket type with all required fields filled');
      return;
    }

    setLoading(true);

    try {
      const newEvent = {
        ...eventData,
        tickets: validTickets.map(ticket => ({
          type: ticket.type.trim(),
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity),
          available: parseInt(ticket.quantity),
          description: ticket.description.trim(),
          benefits: ticket.benefits.filter(benefit => benefit.trim()).map(benefit => benefit.trim()),
          salesEnd: new Date(ticket.salesEnd),
          minOrder: parseInt(ticket.minOrder) || 1,
          maxOrder: parseInt(ticket.maxOrder) || 10
        })),
        organizer: user.data.organizerProfile._id,
        image: eventData.image || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: eventData.tags
          ? eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : []
      };

      console.log('Payload sent to backend (newEvent):', newEvent);

      await eventService.createEvent(newEvent);
      showSuccess('Event created successfully!');
      
      // Reset form
      setEventData({
        title: '',
        description: '',
        category: '',
        date: '',
        time: '',
        venue: '',
        image: '',
        tags: ''
      });
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
      showError('Failed to create event. Please try again.');
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Event</h1>
          <p className="text-xl text-gray-600">
            Share your passion with the world. Create an amazing event that people will love to attend.
          </p>
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
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
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

                    {/* Location */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
                      <Input
                        label="Venue Address"
                        placeholder="Where will your event take place?"
                        value={eventData.venue}
                        onChange={(e) => handleInputChange('venue', e.target.value)}
                        required
                      />
                    </section>

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

                    {/* Enhanced Ticket Types Section */}
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ticket Types</h2>
                      <div className="space-y-6">
                        {ticketTypes.map((ticket, index) => (
                          <div key={ticket.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-gray-900">Ticket Type #{index + 1}</h3>
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
                                  Ticket Type <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g., General, VIP, Early Bird"
                                  value={ticket.type}
                                  onChange={(e) => handleTicketChange(index, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Price ($) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={ticket.price}
                                  onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Quantity <span className="text-red-500">*</span>
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
                                Ticket Description
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Brief description of this ticket type"
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
                                  Sales End Date <span className="text-red-500">*</span>
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
                          <span>Add Another Ticket Type</span>
                        </Button>
                      </div>
                    </section>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <Button
                        type="submit"
                        size="large"
                        loading={loading}
                        disabled={loading || categoriesLoading}
                        className="w-1/2 mx-auto"
                      >
                        {loading ? 'Creating Event...' : 'Create Event'}
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
                </div>
              </div>

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

                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
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
                      <Ticket className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Sample Tickets</div>
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
                        tags: ''
                      });
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