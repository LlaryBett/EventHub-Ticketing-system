import { mockEvents } from '../data/mockEvents';
import { mockCategories } from '../data/mockCategories';

export const eventService = {
  getAllEvents: async (filters = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let filteredEvents = [...mockEvents];
    
    if (filters.category) {
      filteredEvents = filteredEvents.filter(event => event.category === filters.category);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.priceRange) {
      filteredEvents = filteredEvents.filter(event =>
        event.price >= filters.priceRange.min && event.price <= filters.priceRange.max
      );
    }
    
    if (filters.dateRange) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(filters.dateRange.start) && 
               eventDate <= new Date(filters.dateRange.end);
      });
    }
    
    return filteredEvents;
  },

  getEventById: async (id) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const event = mockEvents.find(event => event.id === parseInt(id));
    if (!event) {
      throw new Error('Event not found');
    }
    
    return event;
  },

  getFeaturedEvents: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return mockEvents.filter(event => event.featured);
  },

  getCategories: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return mockCategories;
  },

  createEvent: async (eventData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newEvent = {
      id: Date.now(),
      ...eventData,
      registered: 0,
      featured: false
    };
    
    mockEvents.push(newEvent);
    return newEvent;
  },

  updateEvent: async (id, eventData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    mockEvents[eventIndex] = { ...mockEvents[eventIndex], ...eventData };
    return mockEvents[eventIndex];
  },

  deleteEvent: async (id) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    mockEvents.splice(eventIndex, 1);
    return true;
  }
};