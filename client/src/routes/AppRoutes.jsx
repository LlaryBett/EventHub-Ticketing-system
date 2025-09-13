import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Pages
import Home from '../pages/Home';
import Events from '../pages/Events';
import EventDetails from '../pages/EventDetails';
import Categories from '../pages/Categories';
import Checkout from '../pages/Checkout';
import Dashboard from '../pages/Dashboard';
import Organizer from '../pages/Organizer';
import OrganizerDashboard from '../pages/OrganizerDashboard';
import Pricing from '../pages/Pricing';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import HowItWorks from '../pages/HowItWorks'; // 👈 added import
import PaymentConfirmation from '../pages/PaymentConfirmation';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Layout */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/events" element={<Layout><Events /></Layout>} />
      <Route path="/events/:id" element={<Layout><EventDetails /></Layout>} />
      <Route path="/categories" element={<Layout><Categories /></Layout>} />
      <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} /> {/* new route */}

      {/* Protected Routes with Layout */}
      <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/organizer" element={<Layout><Organizer /></Layout>} />
      <Route path="/organizer-dashboard" element={<Layout><OrganizerDashboard /></Layout>} />
      
      {/* Auth Routes with Layout (between header & footer) */}
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
      <Route path="/payment-confirmation/:orderId?" element={<Layout><PaymentConfirmation /></Layout>} />
    </Routes>
  );
};

export default AppRoutes;
