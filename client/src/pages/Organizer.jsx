import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { eventService } from '../services/eventService';
import { mockCategories } from '../data/mockCategories';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Organizer = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    price: '',
    capacity: '',
    image: ''
  });

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showError('Please log in to create events');
      return;
    }

    setLoading(true);

    try {
      const newEvent = {
        ...eventData,
        price: parseFloat(eventData.price),
        capacity: parseInt(eventData.capacity),
        organizer: user.name,
        image: eventData.image || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: []
      };

      await eventService.createEvent(newEvent);
      showSuccess('Event created successfully!');
      
      // Reset form
      setEventData({
        title: '',
        description: '',
        category: '',
        date: '',
        time: '',
        location: '',
        price: '',
        capacity: '',
        image: ''
      });
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
                    >
                      <option value="">Select a category</option>
                      {mockCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
                  value={eventData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </section>

              {/* Pricing & Capacity */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Capacity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ticket Price (USD)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={eventData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    required
                  />
                  <Input
                    label="Maximum Capacity"
                    type="number"
                    min="1"
                    placeholder="How many people can attend?"
                    value={eventData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    required
                  />
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

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  loading={loading}
                  disabled={loading}
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
              <h3 className="font-semibold text-gray-900 mb-2">💰 Price it Right</h3>
              <p className="text-gray-600 text-sm">
                Research similar events in your area. Consider offering early bird discounts.
              </p>
            </div>
            <div>
              <h3 className="font-semibent text-gray-900 mb-2">📍 Choose the Right Venue</h3>
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