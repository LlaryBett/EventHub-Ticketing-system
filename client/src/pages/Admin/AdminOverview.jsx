import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, DollarSign, Calendar, Activity, LinkIcon, Bell, Eye, Trash2, Download } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { formatPrice, formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { useUI } from '../../context/UIContext';

const AdminOverview = () => {
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents();
      
      if (response.success) {
        const allEvents = response.data || [];
        setEvents(allEvents);
        
        // Calculate today's metrics
        calculateTodayMetrics(allEvents);
        
        // Get pending actions
        getPendingActions(allEvents);
        
        // Get system alerts
        getSystemAlerts(allEvents);
        
        // Get recent activity (last 24 hours)
        getRecentActivity(allEvents);
        
        showSuccess('Admin overview data loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      showError('Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayMetrics = (eventsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = eventsList.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    const todayRevenue = todayEvents.reduce((sum, e) => 
      sum + (e.tickets?.reduce((s, t) => s + (t.price * (t.quantity - t.available)), 0) || 0), 0
    );

    const todayAttendees = todayEvents.reduce((sum, e) => sum + (e.registered || 0), 0);

    setTodayMetrics({
      eventsToday: todayEvents.length,
      attendeesJoined: todayAttendees,
      revenueToday: todayRevenue,
      newRegistrations: Math.floor(todayAttendees * 0.3) // Approximate
    });
  };

  const getPendingActions = (eventsList) => {
    const actions = [];
    const now = new Date();

    // Unpublished events
    const unpublishedCount = eventsList.filter(e => e.status !== 'published').length;
    if (unpublishedCount > 0) {
      actions.push({
        id: 'unpublished',
        title: `${unpublishedCount} Events Pending Publication`,
        description: 'Events waiting to be published',
        action: 'Review',
        priority: 'high',
        icon: Calendar
      });
    }

    // Events starting soon (within 7 days)
    const soonEvents = eventsList.filter(e => {
      const eventDate = new Date(e.date);
      const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= 7;
    }).length;

    if (soonEvents > 0) {
      actions.push({
        id: 'upcoming',
        title: `${soonEvents} Events Starting Soon`,
        description: 'Events happening within the next 7 days',
        action: 'Prepare',
        priority: 'high',
        icon: TrendingUp
      });
    }

    // Low attendance events
    const lowAttendanceEvents = eventsList.filter(e => {
      const capacity = e.capacity || 100;
      const registered = e.registered || 0;
      return registered < (capacity * 0.3);
    }).length;

    if (lowAttendanceEvents > 0) {
      actions.push({
        id: 'lowAttendance',
        title: `${lowAttendanceEvents} Events with Low Attendance`,
        description: 'Less than 30% capacity filled',
        action: 'Promote',
        priority: 'medium',
        icon: Users
      });
    }

    setPendingActions(actions);
  };

  const getSystemAlerts = (eventsList) => {
    const alerts = [];
    const now = new Date();

    // High capacity events
    const highCapacityEvents = eventsList.filter(e => {
      if (!e.capacity) return false;
      const occupancy = ((e.registered || 0) / e.capacity) * 100;
      return occupancy >= 90;
    }).length;

    if (highCapacityEvents > 0) {
      alerts.push({
        id: 'highCapacity',
        type: 'warning',
        title: 'High Event Capacity',
        message: `${highCapacityEvents} events are at 90% or more capacity`,
        icon: AlertCircle
      });
    }

    // Past events not archived
    const pastEvents = eventsList.filter(e => new Date(e.date) < now && e.status === 'published').length;
    if (pastEvents > 5) {
      alerts.push({
        id: 'pastEvents',
        type: 'info',
        title: 'Archive Old Events',
        message: `${pastEvents} past events should be archived`,
        icon: Clock
      });
    }

    // No events scheduled for next week
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEvents = eventsList.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > now && eventDate < nextWeek;
    }).length;

    if (nextWeekEvents === 0) {
      alerts.push({
        id: 'noEvents',
        type: 'warning',
        title: 'No Events Scheduled',
        message: 'Consider scheduling new events for next week',
        icon: AlertCircle
      });
    }

    setSystemAlerts(alerts);
  };

  const getRecentActivity = (eventsList) => {
    // Simulate recent activity - in production this would come from an activity log
    const activities = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // New registrations in last 24h
    const recentEvents = eventsList.filter(e => {
      const eventDate = new Date(e.createdAt || e.date);
      return eventDate >= oneDayAgo;
    });

    recentEvents.forEach((event, idx) => {
      activities.push({
        id: `event-${idx}`,
        type: 'event_created',
        title: 'Event Created',
        description: event.title,
        timestamp: event.createdAt || event.date,
        icon: Calendar,
        color: 'blue'
      });

      if (event.registered > 0) {
        activities.push({
          id: `reg-${idx}`,
          type: 'registration',
          title: 'New Registrations',
          description: `${event.registered} people registered for ${event.title}`,
          timestamp: event.date,
          icon: Users,
          color: 'green'
        });
      }
    });

    setRecentActivity(activities.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ).slice(0, 8));
  };

  const quickLinks = [
    { id: 'create-event', label: 'Create Event', icon: Calendar, path: '/organizer', color: 'blue' },
    { id: 'view-users', label: 'Manage Users', icon: Users, path: '/admin/users', color: 'green' },
    { id: 'view-analytics', label: 'View Analytics', icon: TrendingUp, path: '/admin/analytics', color: 'purple' },
    { id: 'send-alert', label: 'Send Alert', icon: Bell, path: '/admin/reports', color: 'red' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Metrics */}
      {todayMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Events Today</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{todayMetrics.eventsToday}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Attendees Joined</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{todayMetrics.attendeesJoined}</p>
              </div>
              <Users className="w-10 h-10 text-green-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Revenue Today</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{formatPrice(todayMetrics.revenueToday)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">New Registrations</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{todayMetrics.newRegistrations}</p>
              </div>
              <Activity className="w-10 h-10 text-orange-300" />
            </div>
          </div>
        </div>
      )}

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Pending Actions
          </h2>
          <div className="space-y-3">
            {pendingActions.map(action => {
              const IconComponent = action.icon;
              return (
                <div
                  key={action.id}
                  className={`flex items-center justify-between p-4 border-l-4 rounded ${
                    action.priority === 'high'
                      ? 'border-red-500 bg-red-50'
                      : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${
                      action.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <Button size="small" variant="outline">
                    {action.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* System Alerts & Quick Links Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              System Alerts
            </h2>
            <div className="space-y-3">
              {systemAlerts.map(alert => {
                const IconComponent = alert.icon;
                return (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 rounded ${
                      alert.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            Quick Links
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(link => {
              const IconComponent = link.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
                green: 'bg-green-100 text-green-600 hover:bg-green-200',
                purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
                red: 'bg-red-100 text-red-600 hover:bg-red-200'
              };

              return (
                <a
                  key={link.id}
                  href={link.path}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${colorClasses[link.color]}`}
                  onClick={() => showSuccess(`Navigating to ${link.label}`)}
                >
                  <IconComponent className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium text-center">{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity (Last 24 Hours)
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => {
              const IconComponent = activity.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600'
              };

              return (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {events.length > 0 && (
            <p className="text-xs text-gray-400 mt-4">
              Total events tracked: {events.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;