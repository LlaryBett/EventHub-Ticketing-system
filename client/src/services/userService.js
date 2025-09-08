export const userService = {
  getUserProfile: async (userId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      joinedDate: '2024-01-15',
      eventsAttended: 12,
      upcomingEvents: 3,
      preferences: {
        categories: ['technology', 'business'],
        notifications: true,
        newsletter: true
      }
    };
  },

  updateUserProfile: async (userId, userData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: userId,
      ...userData,
      updatedAt: new Date().toISOString()
    };
  },

  getUserEvents: async (userId, status = 'all') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const userEvents = [
      {
        id: 1,
        title: 'Tech Conference 2025',
        date: '2025-03-15',
        status: 'upcoming',
        ticketType: 'Premium'
      },
      {
        id: 2,
        title: 'Digital Marketing Workshop',
        date: '2024-12-28',
        status: 'completed',
        ticketType: 'Standard'
      }
    ];
    
    if (status === 'all') return userEvents;
    return userEvents.filter(event => event.status === status);
  },

  updateNotificationSettings: async (userId, settings) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      userId,
      settings,
      updatedAt: new Date().toISOString()
    };
  }
};