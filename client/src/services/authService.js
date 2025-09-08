// Mock authentication service
export const authService = {
  login: async (email, password) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@example.com' && password === 'admin123') {
      return {
        id: 1,
        email,
        name: 'Admin User',
        role: 'admin',
        token: 'mock-jwt-token'
      };
    } else if (email && password) {
      return {
        id: 2,
        email,
        name: 'Regular User',
        role: 'user',
        token: 'mock-jwt-token'
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  register: async (userData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: Date.now(),
      ...userData,
      role: 'user',
      token: 'mock-jwt-token'
    };
  },

  logout: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  updateProfile: async (userData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentUser = authService.getCurrentUser();
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  }
};