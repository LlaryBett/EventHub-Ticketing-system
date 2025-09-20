// AdminUsers.jsx - Users management page with organizer verification
import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const AdminUsers = () => {
  const { showSuccess, showError } = useUI();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [showOrganizerSection, setShowOrganizerSection] = useState(false);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizerSearchTerm, setOrganizerSearchTerm] = useState('');
  const [organizerStatusFilter, setOrganizerStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchOrganizers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await adminService.getUsers();
      setUsers(Array.isArray(allUsers) ? allUsers : allUsers.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const allOrganizers = await adminService.getOrganizers();
      setOrganizers(Array.isArray(allOrganizers) ? allOrganizers : allOrganizers.data || []);
    } catch (error) {
      console.error('Failed to fetch organizers:', error);
    }
  };

  const handleUserAction = async (action, userId, userData = null) => {
    try {
      switch (action) {
        case 'suspend':
          await adminService.deactivateUser(userId, 'suspended');
          showSuccess('User suspended successfully');
          break;
        case 'activate':
          await adminService.deactivateUser(userId, 'active');
          showSuccess('User activated successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await adminService.deleteUser(userId);
            showSuccess('User deleted successfully');
          }
          break;
        case 'update':
          await adminService.updateUser(userId, userData);
          showSuccess('User updated successfully');
          setShowUserModal(false);
          break;
        case 'create':
          await adminService.createUser(userData);
          showSuccess('User created successfully');
          setShowUserModal(false);
          break;
      }
      fetchUsers();
    } catch (error) {
      showError(`Failed to ${action} user`);
    }
  };

  const handleOrganizerAction = async (action, organizerId, rejectionReason = null) => {
    try {
      switch (action) {
        case 'verify':
          await adminService.verifyOrganizer(organizerId, { verificationStatus: 'verified' });
          showSuccess('Organizer verified successfully');
          break;
        case 'reject':
          await adminService.verifyOrganizer(organizerId, { verificationStatus: 'rejected', rejectionReason });
          showSuccess('Organizer application rejected');
          break;
        case 'suspend':
          await adminService.verifyOrganizer(organizerId, { verificationStatus: 'suspended' });
          showSuccess('Organizer suspended successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this organizer? This action cannot be undone.')) {
            // If you have adminService.deleteOrganizer, call it here
            await adminService.deleteOrganizer(organizerId);
            showSuccess('Organizer deleted successfully');
          }
          break;
      }
      fetchOrganizers();
      fetchUsers();
      setShowOrganizerModal(false);
    } catch (error) {
      showError(`Failed to ${action} organizer`);
    }
  };

  // Get verification status for organizer users
  const getOrganizerVerificationStatus = (userId) => {
    const organizer = organizers.find(org => org.userId === userId || org.id === userId);
    return organizer?.verificationStatus || 'pending';
  };

  // Count pending organizers for notification
  const pendingOrganizersCount = organizers.filter(org => org.verificationStatus === 'pending').length;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.userType === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filteredOrganizers = organizers.filter(organizer => {
    const name = organizer.userId?.name?.toLowerCase() || '';
    const email = organizer.userId?.email?.toLowerCase() || '';
    const matchesSearch = name.includes(organizerSearchTerm.toLowerCase()) ||
                          email.includes(organizerSearchTerm.toLowerCase());
    const matchesStatus = organizerStatusFilter === 'all' || organizer.verificationStatus === organizerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      userType: formData.get('role'),
      password: modalMode === 'create' ? formData.get('password') : undefined
    };

    if (modalMode === 'create') {
      handleUserAction('create', null, userData);
    } else {
      handleUserAction('update', selectedUser.id, userData);
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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              {pendingOrganizersCount > 0 && (
                <button
                  onClick={() => setShowOrganizerSection(!showOrganizerSection)}
                  className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full hover:bg-red-200 transition-colors cursor-pointer"
                >
                  {pendingOrganizersCount} organizer{pendingOrganizersCount > 1 ? 's' : ''} pending verification
                </button>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Manage platform users{showOrganizerSection ? ' and review organizer applications' : ' and verify organizer applications'}
            </p>
          </div>
          <Button
            onClick={() => {
              setModalMode('create');
              setSelectedUser(null);
              setShowUserModal(true);
            }}
          >
            Add New User
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
            <option value="attendee">Attendee</option>
          </select>
          <div className="text-sm text-gray-500 self-center">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Organizer Management Section - Collapsible */}
      {showOrganizerSection && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Organizer Applications</h3>
                <p className="text-blue-700 text-sm">Review and manage organizer verification requests</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowOrganizerSection(false)}
                className="text-blue-600 border-blue-600 hover:bg-blue-100"
              >
                Hide Section
              </Button>
            </div>
            
            {/* Organizer Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <input
                  type="text"
                  placeholder="Search organizers..."
                  value={organizerSearchTerm}
                  onChange={(e) => setOrganizerSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={organizerStatusFilter}
                onChange={(e) => setOrganizerStatusFilter(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="text-sm text-blue-600 self-center">
                Showing {filteredOrganizers.length} of {organizers.length} organizers
              </div>
            </div>
          </div>

          {/* Organizers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizers.map((organizer) => (
                  <tr key={organizer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{organizer.userId?.name?.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{organizer.userId?.name}</div>
                          <div className="text-sm text-gray-500">{organizer.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        organizer.verificationStatus === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : organizer.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : organizer.verificationStatus === 'suspended'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organizer.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(organizer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {organizer.organizationName || 'Individual'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {organizer.totalEvents || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const organizerDetails = await adminService.getOrganizerById(organizer.id);
                              setSelectedOrganizer(organizerDetails);
                              setShowOrganizerModal(true);
                            } catch (error) {
                              showError('Failed to load organizer details');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded"
                        >
                          Review
                        </button>
                        
                        {organizer.verificationStatus === 'pending' && (
                          <button
                            onClick={() => handleOrganizerAction('verify', organizer.id)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded"
                          >
                            Verify
                          </button>
                        )}
                        
                        {(organizer.verificationStatus === 'verified' || organizer.verificationStatus === 'pending') && (
                          <button
                            onClick={() => handleOrganizerAction('suspend', organizer.id)}
                            className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded"
                          >
                            Suspend
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleOrganizerAction('delete', organizer.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrganizers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No organizers found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const verificationStatus = user.userType === 'organizer' ? getOrganizerVerificationStatus(user.id) : null;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{user.name?.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.userType === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : user.userType === 'organizer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.userType === 'organizer' ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : verificationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {verificationStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {
                        user.userType === 'organizer'
                          ? (user.analytics?.organizerStats?.totalEvents ?? user.upcomingEvents ?? 0)
                          : (user.eventsAttended ?? 0)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        
                        {/* Organizer verification actions */}
                        {user.userType === 'organizer' && verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const organizer = organizers.find(org => org.userId === user.id || org.id === user.id);
                                  if (organizer) {
                                    const organizerDetails = await adminService.getOrganizerById(organizer.id);
                                    setSelectedOrganizer(organizerDetails);
                                    setShowOrganizerModal(true);
                                  }
                                } catch (error) {
                                  showError('Failed to load organizer details');
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => {
                                const organizer = organizers.find(org => org.userId === user.id || org.id === user.id);
                                if (organizer) {
                                  handleOrganizerAction('verify', organizer.id);
                                }
                              }}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded"
                            >
                              Verify
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                          className={`px-2 py-1 rounded ${
                            user.status === 'active' 
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleUserAction('delete', user.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={modalMode === 'create' ? 'Add New User' : 'Edit User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            defaultValue={selectedUser?.name || ''}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={selectedUser?.email || ''}
            required
          />
          {modalMode === 'create' && (
            <Input
              label="Password"
              name="password"
              type="password"
              required
            />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              defaultValue={selectedUser?.userType || 'attendee'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {modalMode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Organizer Review Modal */}
      <Modal
        isOpen={showOrganizerModal}
        onClose={() => setShowOrganizerModal(false)}
        title="Review Organizer Application"
        size="large"
      >
        {selectedOrganizer && (
          <div className="space-y-6">
            {/* Organizer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.userId?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.userId?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.userId?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Organization</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.organizationName || 'Individual'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Applied Date</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedOrganizer.data?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedOrganizer.data?.verificationStatus === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : selectedOrganizer.data?.verificationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedOrganizer.data?.verificationStatus || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Business Type</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.businessType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Business Address</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.businessAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">City</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">State</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.state}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">ZIP Code</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.zipCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Tax ID</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.taxId || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Website</p>
                  {selectedOrganizer.data?.website ? (
                    <a href={selectedOrganizer.data.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      {selectedOrganizer.data.website}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-900">Not provided</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Approval Status</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.approvalStatus}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payout Method</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.payoutMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Commission Rate</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Events</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.totalEvents}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.totalRevenue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Featured Organizer</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.isFeatured ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upgraded From Attendee</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.upgradedFromAttendee ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Is Active</p>
                  <p className="text-sm text-gray-900">{selectedOrganizer.data?.isActive ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowOrganizerModal(false)}
              >
                Close
              </Button>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const organizerId = selectedOrganizer.data?.id || selectedOrganizer.data?._id;
                    if (!organizerId) {
                      console.warn('Organizer ID missing for reject action', selectedOrganizer);
                      return;
                    }
                    if (window.confirm('Are you sure you want to reject this organizer application?')) {
                      handleOrganizerAction('reject', organizerId);
                    }
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    const organizerId = selectedOrganizer.data?.id || selectedOrganizer.data?._id;
                    if (!organizerId) {
                      console.warn('Organizer ID missing for verify action', selectedOrganizer);
                      return;
                    }
                    handleOrganizerAction('verify', organizerId);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Verify Organizer
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;