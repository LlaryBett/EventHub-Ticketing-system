import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Activity } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { formatPrice } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useUI } from '../../context/UIContext';

const AdminAnalytics = () => {
  const { showError } = useUI();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [events, setEvents] = useState([]);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 90days, 1year

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents();
      
      if (response.success) {
        setEvents(response.data || []);
        processAnalytics(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (eventsList) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let startDate = thirtyDaysAgo;
    if (dateRange === '7days') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === '90days') startDate = ninetyDaysAgo;
    else if (dateRange === '1year') startDate = oneYearAgo;

    // Filter events within date range
    const filteredEvents = eventsList.filter(e => new Date(e.date) >= startDate);

    // Calculate metrics
    const totalRevenue = filteredEvents.reduce((sum, e) => 
      sum + (e.tickets?.reduce((s, t) => s + (t.price * (t.quantity - t.available)), 0) || 0), 0
    );
    
    const totalAttendees = filteredEvents.reduce((sum, e) => sum + (e.registered || 0), 0);
    const totalEvents = filteredEvents.length;
    const avgTicketPrice = filteredEvents.length > 0 
      ? totalRevenue / (filteredEvents.reduce((sum, e) => sum + (e.tickets?.reduce((s, t) => s + (t.quantity - t.available), 0) || 0), 0) || 1)
      : 0;

    // Generate chart data by week
    const chartData = generateWeeklyChartData(filteredEvents, startDate, now);

    // Category breakdown
    const categoryData = getCategoryBreakdown(filteredEvents);

    // Event status breakdown
    const statusData = getStatusBreakdown(filteredEvents);

    // Top events
    const topEvents = getTopEvents(filteredEvents);

    setAnalyticsData({
      totalRevenue,
      totalAttendees,
      totalEvents,
      avgTicketPrice,
      chartData,
      categoryData,
      statusData,
      topEvents
    });
  };

  const generateWeeklyChartData = (eventsList, startDate, endDate) => {
    const weeks = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekEvents = eventsList.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= weekStart && eventDate < weekEnd;
      });

      const revenue = weekEvents.reduce((sum, e) => 
        sum + (e.tickets?.reduce((s, t) => s + (t.price * (t.quantity - t.available)), 0) || 0), 0
      );

      const attendees = weekEvents.reduce((sum, e) => sum + (e.registered || 0), 0);

      weeks.push({
        week: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        revenue: revenue / 1000, // Convert to thousands for chart readability
        attendees,
        events: weekEvents.length
      });

      currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return weeks;
  };

  const getCategoryBreakdown = (eventsList) => {
    const categories = {};

    eventsList.forEach(event => {
      const category = event.category?.name || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { name: category, value: 0, count: 0 };
      }
      categories[category].value += event.registered || 0;
      categories[category].count += 1;
    });

    return Object.values(categories);
  };

  const getStatusBreakdown = (eventsList) => {
    const statuses = {
      published: eventsList.filter(e => e.status === 'published').length,
      draft: eventsList.filter(e => e.status === 'draft').length,
      upcoming: eventsList.filter(e => new Date(e.date) > new Date()).length,
      past: eventsList.filter(e => new Date(e.date) <= new Date()).length
    };

    return [
      { name: 'Published', value: statuses.published, fill: '#10B981' },
      { name: 'Draft', value: statuses.draft, fill: '#F59E0B' },
      { name: 'Upcoming', value: statuses.upcoming, fill: '#3B82F6' },
      { name: 'Past', value: statuses.past, fill: '#6B7280' }
    ];
  };

  const getTopEvents = (eventsList) => {
    return eventsList
      .sort((a, b) => (b.registered || 0) - (a.registered || 0))
      .slice(0, 5);
  };

  // Helper function to format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper function to format price for display
  const formatPriceForDisplay = (price) => {
    if (price >= 1000000) {
      return '$' + (price / 1000000).toFixed(1) + 'M';
    }
    if (price >= 1000) {
      return '$' + (price / 1000).toFixed(1) + 'K';
    }
    return formatPrice(price);
  };

  // Helper function to get full number text
  const getFullNumberText = (num) => {
    return num.toLocaleString('en-US');
  };

  // Helper function to get full price text
  const getFullPriceText = (price) => {
    return formatPrice(price);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center py-8 text-gray-600">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <div className="flex gap-2">
            {[
              { value: '7days', label: '7 Days' },
              { value: '30days', label: '30 Days' },
              { value: '90days', label: '90 Days' },
              { value: '1year', label: '1 Year' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div 
          className="bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md relative group"
          title={`${getFullNumberText(analyticsData.totalEvents)} events`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>

          <p className="text-3xl font-bold text-gray-900 truncate">
            {formatLargeNumber(analyticsData.totalEvents)}
          </p>
          
          {/* Full value tooltip on hover */}
          <div className="absolute bottom-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getFullNumberText(analyticsData.totalEvents)} events
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>

        {/* Total Attendees */}
        <div 
          className="bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md relative group"
          title={`${getFullNumberText(analyticsData.totalAttendees)} attendees`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Attendees</p>
          </div>

          <p className="text-3xl font-bold text-gray-900 truncate">
            {formatLargeNumber(analyticsData.totalAttendees)}
          </p>
          
          {/* Full value tooltip on hover */}
          <div className="absolute bottom-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getFullNumberText(analyticsData.totalAttendees)} attendees
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">Registered users</p>
        </div>

        {/* Total Revenue */}
        <div 
          className="bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md relative group"
          title={`${getFullPriceText(analyticsData.totalRevenue)} total revenue`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>

          <p className="text-3xl font-bold text-gray-900 truncate">
            {formatPriceForDisplay(analyticsData.totalRevenue)}
          </p>
          
          {/* Full value tooltip on hover */}
          <div className="absolute bottom-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getFullPriceText(analyticsData.totalRevenue)}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">All transactions</p>
        </div>

        {/* Avg Ticket Price */}
        <div 
          className="bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-md relative group"
          title={`${getFullPriceText(analyticsData.avgTicketPrice)} average price`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Avg Ticket Price</p>
          </div>

          <p className="text-3xl font-bold text-gray-900 truncate">
            {formatPriceForDisplay(analyticsData.avgTicketPrice)}
          </p>
          
          {/* Full value tooltip on hover */}
          <div className="absolute bottom-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getFullPriceText(analyticsData.avgTicketPrice)}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">Average price</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Attendees Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Attendees Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue (K)') {
                    return [`$${(value * 1000).toLocaleString('en-US')}`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Revenue (K)" />
              <Area yAxisId="right" type="monotone" dataKey="attendees" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Attendees" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Event Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendees by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value.toLocaleString('en-US'), 'Attendees']}
            />
            <Bar dataKey="value" fill="#3B82F6" name="Attendees" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events by Attendance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Organizer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Attendees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Occupancy %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analyticsData.topEvents.map((event, idx) => {
                const occupancy = event.capacity ? ((event.registered || 0) / event.capacity * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{event.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{event.organizer?.organizationName || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{(event.registered || 0).toLocaleString('en-US')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{event.capacity ? event.capacity.toLocaleString('en-US') : 'Unlimited'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{occupancy}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;