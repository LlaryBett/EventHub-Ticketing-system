import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useCart } from '../../context/CartContext';
import CartSidebar from '../cart/CartSidebar';
import NotificationSystem from '../notifications/NotificationSystem';

const Layout = ({ children }) => {
  const { isOpen: isCartOpen } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* Cart Sidebar */}
      <CartSidebar />
      
      {/* Notifications */}
      <NotificationSystem />
    </div>
  );
};

export default Layout;