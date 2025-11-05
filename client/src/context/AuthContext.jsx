import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import * as userService from '../services/userService'; // Import the new user service

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token is still valid by fetching user data
          const userData = await userService.getMe(); // Changed to userService
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token might be invalid, clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // 1. First, call the login API to get the token
      const response = await authService.login({ email, password });
      console.log('Login API response:', response);
      
      // 2. Now verify the token and get fresh user data by calling getMe()
      console.log('Calling getMe() to verify token and get user data...');
      const userData = await userService.getMe(); // Changed to userService
      console.log('getMe() response:', userData);
      
      // 3. Set the user in context with the data from getMe()
      setUser(userData);
      
      // 4. Return the combined response
      return {
        ...response,
        user: userData // Include the fresh user data from getMe()
      };
      
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const registerAttendee = async (userData) => {
    const response = await authService.registerAttendee(userData);
    const freshUserData = await userService.getMe();
    setUser(freshUserData);
    return {
      ...response,
      user: freshUserData
    };
  };

  const registerOrganizerStep1 = async (userData) => {
    const response = await authService.registerOrganizerStep1(userData);
    // Remove getMe and setUser here to proceed directly to step 2
    return response;
  };

  const registerOrganizerStep2 = async (userData) => {
    return await authService.registerOrganizerStep2(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (resetToken, password) => {
    return await authService.resetPassword(resetToken, password);
  };

  const updateDetails = async (userData) => {
    const response = await userService.updateDetails(userData);
    const freshUserData = await userService.getMe();
    setUser(freshUserData);
    return {
      ...response,
      user: freshUserData
    };
  };

  const updatePassword = async (currentPassword, newPassword) => {
    return await userService.updatePassword({
      currentPassword,
      newPassword
    });
  };

  // New function to update organizer profile
  const updateOrganizerProfile = async (profileData) => {
    return await userService.updateOrganizerProfile(profileData);
  };

  // New function to delete account
  const deleteAccount = async () => {
    const response = await userService.deleteAccount();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response;
  };

  const value = {
    user,
    loading,
    isAuthenticated: authService.isAuthenticated(),
    isOrganizer: authService.isOrganizer(),
    isAttendee: authService.isAttendee(),
    login,
    registerAttendee,
    registerOrganizerStep1,
    registerOrganizerStep2,
    logout,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    updateOrganizerProfile, // Added new function
    deleteAccount, // Added new function
    getCurrentUser: authService.getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };