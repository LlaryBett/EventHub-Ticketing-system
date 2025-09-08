import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message) => {
    addNotification({
      type: 'success',
      message
    });
  };

  const showError = (message) => {
    addNotification({
      type: 'error',
      message
    });
  };

  const showWarning = (message) => {
    addNotification({
      type: 'warning',
      message
    });
  };

  const showInfo = (message) => {
    addNotification({
      type: 'info',
      message
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const value = {
    notifications,
    loading,
    mobileMenuOpen,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setLoading,
    toggleMobileMenu,
    setMobileMenuOpen
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};