// AdminDashboard.jsx - Main admin layout with routing
import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdEvent, MdCategory, MdAnalytics } from 'react-icons/md';
import { HiDocumentReport } from 'react-icons/hi';
import { FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminEvents from './AdminEvents';
import AdminUI from './AdminUI';  
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <MdDashboard className="text-xl" />, path: '/admin/overview' },
    { id: 'users', label: 'Users', icon: <MdPeople className="text-xl" />, path: '/admin/users' },
    { id: 'events', label: 'Events', icon: <MdEvent className="text-xl" />, path: '/admin/events' },
    { id: 'UI', label: 'UI', icon: <MdCategory className="text-xl" />, path: '/admin/ui' },
    { id: 'analytics', label: 'Analytics', icon: <MdAnalytics className="text-xl" />, path: '/admin/analytics' },
    { id: 'reports', label: 'Reports', icon: <HiDocumentReport className="text-xl" />, path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: <FiSettings className="text-xl" />, path: '/admin/settings' }
  ];

  const isActiveTab = (path) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Check for userType instead of role
  const isAdmin = user?.data?.userType === 'admin';
  console.log('User data:', user?.data); // Add this for debugging
  console.log('Is admin:', isAdmin); // Add this for debugging

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          {/* <pre className="mt-4 text-left bg-gray-100 p-4 rounded">
            {JSON.stringify({ userType: user?.data?.userType }, null, 2)}
          </pre> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your event platform and monitor system performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation - Fixed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 h-fit">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  A
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-sm text-gray-500">System Administrator</p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      isActiveTab(tab.path)
                        ? 'bg-red-50 text-red-700 border-r-4 border-red-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/overview" replace />} />
              <Route path="/overview" element={<AdminOverview />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/events" element={<AdminEvents />} />
              <Route path="/UI" element={<AdminUI />} />
              <Route path="/analytics" element={<AdminAnalytics />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;