import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationSystem from '../notifications/NotificationSystem';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {children}
      </main>

      {/* Footer should always be visible */}
      <Footer />

      {/* Notifications */}
      <NotificationSystem />
    </div>
  );
};

export default Layout;
