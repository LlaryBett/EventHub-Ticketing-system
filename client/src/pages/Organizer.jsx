import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { categoriesService } from '../services/categoriesService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Organizer = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [ticketTypes, setTicketTypes] = useState([
    { type: '', price: '', quantity: '', id: 1 }
  ]);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '', // Changed from location to venue
    image: '',
    tags: ''
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesData = await categoriesService.getAllCategories();
        // Ensure categories is always an array
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

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index][field] = value;
    setTicketTypes(updatedTickets);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { type: '', price: '', quantity: '', id: Date.now() }]);
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

    // Check if user is an organizer and has organizerProfile
    if (user.data.userType !== 'organizer' || !user.data.organizerProfile || !user.data.organizerProfile._id) {
      showError('You must be an organizer to create events. Please complete your organizer profile first.');
      return;
    }

    // Validate tickets
    const validTickets = ticketTypes.filter(ticket => 
      ticket.type.trim() && ticket.price && ticket.quantity
    );

    if (validTickets.length === 0) {
      showError('Please add at least one valid ticket type');
      return;
    }

    setLoading(true);

    try {
      const newEvent = {
        ...eventData,
        tickets: validTickets.map(ticket => ({
          type: ticket.type.trim(),
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity)
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
      setTicketTypes([{ type: '', price: '', quantity: '', id: 1 }]);
    } catch (error) {
      showError('Failed to create event. Please try again.');
      console.error('Event creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to create and manage events.</p>
          <Button onClick={() => window.location.href = '/login'}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Event</h1>
          <p className="text-xl text-gray-600">
            Share your passion with the world. Create an amazing event that people will love to attend.
          </p>
        </div>

        {/* Event Creation Form */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                <div className="space-y-4">
                  <Input
                    label="Event Title"
                    placeholder="Give your event a catchy title"
                    value={eventData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />

                  <div>
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
                </div>
              </section>

              {/* Date & Time */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Ticket Types */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Ticket Types</h2>
                <div className="space-y-4">
                  {ticketTypes.map((ticket, index) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {ticketTypes.length > 1 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="text-red-600 text-sm font-medium hover:text-red-800"
                          >
                            Remove Ticket Type
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addTicketType}
                    variant="outline"
                    size="small"
                  >
                    + Add Another Ticket Type
                  </Button>
                </div>
              </section>

              {/* Optional: Event Image */}
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

              {/* Tags Input */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags (Optional)</h2>
                <Input
                  label="Tags (comma separated)"
                  type="text"
                  placeholder="e.g. startup, pitch, investment"
                  value={eventData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Add relevant tags to help people find your event. Separate tags with commas.
                </p>
              </section>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  loading={loading}
                  disabled={loading || categoriesLoading}
                >
                  {loading ? 'Creating Event...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-primary-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tips for a Successful Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎫 Offer Multiple Ticket Types</h3>
              <p className="text-gray-600 text-sm">
                Consider offering different ticket tiers (General, VIP, Early Bird) to appeal to different audiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📝 Write a Great Description</h3>
              <p className="text-gray-600 text-sm">
                Be clear about what attendees can expect. Include the agenda, speakers, and any special features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📸 Use High-Quality Images</h3>
              <p className="text-gray-600 text-sm">
                A compelling image can significantly increase registrations. Use bright, professional photos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📍 Choose the Right Venue</h3>
              <p className="text-gray-600 text-sm">
                Make sure your venue is accessible and has the right capacity for your expected audience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organizer;