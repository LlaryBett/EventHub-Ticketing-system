import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Pages
import Home from '../pages/Home';
import Events from '../pages/Events';
import EventDetails from '../pages/EventDetails';
import Discover from '../pages/Discover';
import Checkout from '../pages/Checkout';
import UserAccount from '../pages/UserAccount'; // Updated from Dashboard
import Organizer from '../pages/Organizer';
import OrganizerDashboard from '../pages/OrganizerDashboard';
import Pricing from '../pages/Pricing';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';
import HowItWorks from '../pages/HowItWorks';
import PaymentConfirmation from '../pages/PaymentConfirmation';
import TicketsPage from '../pages/TicketsPage';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';

// Admin Pages
import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminOverview from '../pages/Admin/AdminOverview';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminEvents from '../pages/Admin/AdminEvents';
import AdminUI from '../pages/Admin/AdminUI';
import AdminAnalytics from '../pages/Admin/AdminAnalytics';
import AdminReports from '../pages/Admin/AdminReports';
import AdminSettings from '../pages/Admin/AdminSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Layout */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/events" element={<Layout><Events /></Layout>} />
      <Route path="/events/:id" element={<Layout><EventDetails /></Layout>} />
      <Route path="/discover" element={<Layout><Discover /></Layout>} />
      <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
      <Route path="/tickets" element={<Layout><TicketsPage /></Layout>} />
      <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
      <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />

      {/* Auth Routes with Layout */}
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/reset-password/:resetToken" element={<Layout><ResetPassword /></Layout>} />
      
      {/* Protected Routes with Layout */}
      <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
      <Route path="/account" element={<Layout><UserAccount /></Layout>} /> {/* Updated from /dashboard */}
      <Route path="/organizer" element={<Layout><Organizer /></Layout>} />
      <Route path="/organizer-dashboard" element={<Layout><OrganizerDashboard /></Layout>} />
      <Route path="/payment-confirmation/:orderId?" element={<Layout><PaymentConfirmation /></Layout>} />
      
      {/* Admin Routes - No Layout */}
      <Route path="/admin/*" element={<AdminDashboard />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;