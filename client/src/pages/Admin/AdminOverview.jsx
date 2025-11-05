// AdminOverview.jsx - Event ticketing admin dashboard overview
import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import adminService  from '../../services/adminService';
import { formatDate, formatPrice } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
// Import necessary icons from react-icons
import { 
  FiUsers, 
  FiDollarSign, 
  FiAlertTriangle,
  FiSettings,
  FiFileText,
  FiCreditCard // Use this instead of FiTicket
} from 'react-icons/fi';
import { 
  MdCategory, 
  MdAnalytics, 
  MdWarning,
  MdEventAvailable 
} from 'react-icons/md';
import { BsGraphUp } from 'react-icons/bs';
import { IoTicketOutline } from 'react-icons/io5';
// Add Recharts imports
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AdminOverview = () => {
  const { showError } = useUI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    // KPI Stats
    totalUsers: 0,
    totalOrganizers: 0,
    totalAttendees: 0,
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    
    // Charts data
    ticketTrend: [],
    revenueTrend: [],
    eventsByCategory: [],
    userGrowth: [],
    
    // Activity feeds
    recentEvents: [],
    recentPurchases: [],
    newSignups: [],
    supportTickets: [],
    
    // Top performers
    topEvents: [],
    topOrganizers: [],
    
    // Alerts
    pendingOrganizerVerification: 0,
    reportedItems: 0,
    lowStockEvents: [],
    soldOutEvents: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use the new backend dashboard endpoint
      const dashboardStats = await adminService.getAdminDashboardStats();
      setDashboardData(dashboardStats.data || dashboardStats); // handle both {data: ...} and direct object
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Summary Stats - Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalUsers}</p>
              <p className="text-xs text-gray-400">{dashboardData.totalOrganizers} organizers, {dashboardData.totalAttendees} attendees</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MdEventAvailable className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalEvents}</p>
              <p className="text-xs text-gray-400">{dashboardData.activeEvents} active, {dashboardData.upcomingEvents} upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <IoTicketOutline className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalTicketsSold}</p>
              <p className="text-xs text-gray-400">Platform-wide</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(dashboardData.totalRevenue)}</p>
              <p className="text-xs text-gray-400">Commission earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.pendingApprovals}</p>
              <p className="text-xs text-gray-400">Awaiting review</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tickets Sold Over Time</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            {dashboardData.ticketTrend && dashboardData.ticketTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.ticketTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No ticket sales data</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Events by Category</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            {dashboardData.eventsByCategory && dashboardData.eventsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.eventsByCategory}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#a78bfa"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {dashboardData.eventsByCategory.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color || ["#6366f1", "#a78bfa", "#f59e42", "#f87171", "#34d399"][idx % 5]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No category data</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentEvents?.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Purchases</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentPurchases?.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 text-sm">{purchase.eventTitle}</p>
                      <p className="text-sm text-gray-500">{purchase.buyerName} • {purchase.quantity} tickets</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(purchase.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Top Events</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.topEvents?.slice(0, 5).map((event, index) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 mr-3">#{index + 1}</span>
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.ticketsSold} tickets sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(event.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Top Organizers</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.topOrganizers?.slice(0, 5).map((organizer, index) => (
                <div key={organizer.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 mr-3">#{index + 1}</span>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{organizer.name?.charAt(0)}</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 text-sm">{organizer.name}</p>
                      <p className="text-sm text-gray-500">{organizer.eventsCount} events</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(organizer.totalRevenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Alerts & Pending Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Alerts & Pending Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center">
              <MdWarning className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">Organizer Verification</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-2">{dashboardData.pendingOrganizerVerification}</p>
            <p className="text-sm text-orange-600">Pending approval</p>
          </div>

          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <MdWarning className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">Reported Items</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-2">{dashboardData.reportedItems}</p>
            <p className="text-sm text-red-600">Need review</p>
          </div>

          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <MdWarning className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">{dashboardData.lowStockEvents?.length || 0}</p>
            <p className="text-sm text-yellow-600">Events</p>
          </div>

          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <MdWarning className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Sold Out</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{dashboardData.soldOutEvents?.length || 0}</p>
            <p className="text-sm text-blue-600">Events</p>
          </div>
        </div>
      </div>

      {/* 6. Quick Access Shortcuts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Users</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/events')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FiCreditCard className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Events</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/categories')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <MdCategory className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Categories</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/analytics')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <MdAnalytics className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Analytics</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/reports')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FiFileText className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Reports</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/admin/settings')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FiSettings className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;