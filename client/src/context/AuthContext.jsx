import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

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
          const userData = await authService.getMe();
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
      const userData = await authService.getMe();
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
    try {
      const response = await authService.registerAttendee(userData);
      
      // After registration, also call getMe() to get fresh user data
      const freshUserData = await authService.getMe();
      setUser(freshUserData);
      
      return {
        ...response,
        user: freshUserData
      };
    } catch (error) {
      throw error;
    }
  };

  const registerOrganizerStep1 = async (userData) => {
    try {
      const response = await authService.registerOrganizerStep1(userData);
      
      // After registration, also call getMe() to get fresh user data
      const freshUserData = await authService.getMe();
      setUser(freshUserData);
      
      return {
        ...response,
        user: freshUserData
      };
    } catch (error) {
      throw error;
    }
  };

  const registerOrganizerStep2 = async (userData) => {
    try {
      const response = await authService.registerOrganizerStep2(userData);
      // Step 2 doesn't return a token, so we don't need to set user
      return response;
    } catch (error) {
      throw error;
    }
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
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      const response = await authService.resetPassword(resetToken, password);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateDetails = async (userData) => {
    try {
      const response = await authService.updateDetails(userData);
      
      // After update, get fresh user data
      const freshUserData = await authService.getMe();
      setUser(freshUserData);
      
      return {
        ...response,
        user: freshUserData
      };
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authService.updatePassword({
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      throw error;
    }
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
    getCurrentUser: authService.getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };