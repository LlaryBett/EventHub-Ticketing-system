import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

  const addNotification = useCallback((notification) => {
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
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      message
    });
  }, [addNotification]);

  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      message
    });
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      message
    });
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      message
    });
  }, [addNotification]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  // Memoize the entire value object to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [
    notifications,
    loading,
    mobileMenuOpen,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toggleMobileMenu
    // Note: setLoading and setMobileMenuOpen are stable from useState
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};