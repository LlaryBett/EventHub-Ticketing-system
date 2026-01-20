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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'organizers', 'pending'

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'attendee',
    password: '',
    status: 'active',
    // Organizer-specific fields
    organizationName: '',
    businessType: 'individual',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: '',
    website: ''
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizerSearchTerm, setOrganizerSearchTerm] = useState('');
  const [organizerStatusFilter, setOrganizerStatusFilter] = useState('all');

  useEffect(() => {
    console.log('AdminUsers component mounted');
    fetchUsers();
    fetchOrganizers();
  }, []);

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      setLoading(true);
      const allUsers = await adminService.getUsers();
      console.log('Fetched users:', allUsers);
      setUsers(Array.isArray(allUsers) ? allUsers : allUsers.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    console.log('Fetching organizers...');
    try {
      const allOrganizers = await adminService.getOrganizers();
      console.log('Fetched organizers:', allOrganizers);
      setOrganizers(Array.isArray(allOrganizers) ? allOrganizers : allOrganizers.data || []);
    } catch (error) {
      console.error('Failed to fetch organizers:', error);
    }
  };

  // Reset form when modal opens/closes
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      userType: 'attendee',
      password: '',
      status: 'active',
      organizationName: '',
      businessType: 'individual',
      businessAddress: '',
      city: '',
      state: '',
      zipCode: '',
      taxId: '',
      website: ''
    });
  };

  // Load organizer data for selected user
  const loadOrganizerData = async (userId) => {
    try {
      const organizer = await adminService.getOrganizerByUserId(userId);
      if (organizer?.data) {
        setFormData(prev => ({
          ...prev,
          organizationName: organizer.data.organizationName || '',
          businessType: organizer.data.businessType || 'individual',
          businessAddress: organizer.data.businessAddress || '',
          city: organizer.data.city || '',
          state: organizer.data.state || '',
          zipCode: organizer.data.zipCode || '',
          taxId: organizer.data.taxId || '',
          website: organizer.data.website || ''
        }));
      }
    } catch (error) {
      console.error('Failed to load organizer data:', error);
    }
  };

  const handleUserAction = async (action, userId, userData = null) => {
    console.log('User action:', { action, userId, userData });
    try {
      switch (action) {
        case 'suspend':
          console.log('Suspending user:', userId);
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
          resetForm();
          break;
        case 'create':
          await adminService.createUser(userData);
          showSuccess('User created successfully');
          setShowUserModal(false);
          resetForm();
          break;
      }
      console.log('User action completed successfully');
      fetchUsers();
      fetchOrganizers();
    } catch (error) {
      console.error('Failed user action:', error);
      showError(`Failed to ${action} user`);
    }
  };

  const handleOrganizerAction = async (action, organizerId, rejectionReason = null) => {
    console.log('Organizer action:', { action, organizerId, rejectionReason });
    try {
      switch (action) {
        case 'verify':
          console.log('Verifying organizer:', organizerId);
          await adminService.verifyOrganizer(organizerId, {
            verificationStatus: 'verified',
            approvalStatus: 'approved'
          });
          showSuccess('Organizer verified successfully');
          break;

        case 'reject':
          await adminService.verifyOrganizer(organizerId, {
            verificationStatus: 'rejected',
            rejectionReason
          });
          showSuccess('Organizer application rejected');
          break;

        case 'suspend':
          await adminService.verifyOrganizer(organizerId, {
            verificationStatus: 'suspended'
          });
          showSuccess('Organizer verification suspended');
          break;

        case 'reinstate':
          await adminService.verifyOrganizer(organizerId, {
            verificationStatus: 'verified'
          });
          showSuccess('Organizer reinstated');
          break;

        case 'delete':
          if (window.confirm('Are you sure you want to delete this organizer? This action cannot be undone.')) {
            await adminService.deleteOrganizer(organizerId);
            showSuccess('Organizer deleted successfully');
          }
          break;
      }

      console.log('Action completed successfully');
      fetchOrganizers();
      fetchUsers();
      setShowOrganizerModal(false);
    } catch (error) {
      console.error('Failed organizer action:', error);
      showError(`Failed to ${action} organizer: ${error?.message || error}`);
    }
  };

  // Get organizer by user ID
  const getOrganizerByUserId = (userId) => {
    return organizers.find(org => 
      org.userId === userId || 
      org.userId?._id === userId || 
      org.userId?.id === userId
    );
  };

  // Get verification status for organizer users
  const getOrganizerVerificationStatus = (userId) => {
    const organizer = getOrganizerByUserId(userId);
    return organizer?.verificationStatus || 'pending';
  };

  // Find organizer ID by user ID
  const findOrganizerIdByUser = (userId) => {
    const organizer = getOrganizerByUserId(userId);
    return organizer?.id || organizer?._id;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      userType: formData.userType,
      status: formData.status,
      ...(modalMode === 'create' && { password: formData.password })
    };

    // If creating/updating organizer, add organizer fields
    if (formData.userType === 'organizer') {
      userData.organizationName = formData.organizationName;
      userData.businessType = formData.businessType;
      userData.businessAddress = formData.businessAddress;
      userData.city = formData.city;
      userData.state = formData.state;
      userData.zipCode = formData.zipCode;
      userData.taxId = formData.taxId || null;
      userData.website = formData.website || null;
    }

    if (modalMode === 'create') {
      handleUserAction('create', null, userData);
    } else {
      handleUserAction('update', selectedUser.id, userData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper to determine which action buttons to show for a user
  const getUserActions = (user) => {
    const organizer = getOrganizerByUserId(user.id);
    const verificationStatus = user.userType === 'organizer' ? getOrganizerVerificationStatus(user.id) : null;
    const organizerId = findOrganizerIdByUser(user.id);

    const actions = [];

    // Always show Edit for all users
    actions.push({
      label: 'Edit',
      color: 'text-blue-600 hover:text-blue-900',
      onClick: async () => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          userType: user.userType || 'attendee',
          password: '',
          status: user.status || 'active',
          organizationName: '',
          businessType: 'individual',
          businessAddress: '',
          city: '',
          state: '',
          zipCode: '',
          taxId: '',
          website: ''
        });
        
        // If user is organizer, load their organizer data
        if (user.userType === 'organizer') {
          await loadOrganizerData(user.id);
        }
        
        setShowUserModal(true);
      }
    });

    // User status actions
    if (user.status === 'active' || user.status === 'pending_verification') {
      actions.push({
        label: 'Suspend User',
        color: 'text-yellow-600 hover:text-yellow-900',
        onClick: () => handleUserAction('suspend', user.id)
      });
    } else if (user.status === 'suspended') {
      actions.push({
        label: 'Activate User',
        color: 'text-green-600 hover:text-green-900',
        onClick: () => handleUserAction('activate', user.id)
      });
    }

    // Organizer-specific actions
    if (user.userType === 'organizer' && organizer) {
      // Review organizer application
      actions.push({
        label: 'Review Org',
        color: 'text-purple-600 hover:text-purple-900',
        onClick: async () => {
          try {
            const organizerDetails = await adminService.getOrganizerById(organizer.id);
            setSelectedOrganizer(organizerDetails);
            setShowOrganizerModal(true);
          } catch (error) {
            showError('Failed to load organizer details');
          }
        }
      });

      // Organizer verification actions
      if (verificationStatus === 'pending') {
        actions.push({
          label: 'Verify Org',
          color: 'text-green-600 hover:text-green-900',
          onClick: () => handleOrganizerAction('verify', organizerId)
        });
        actions.push({
          label: 'Reject Org',
          color: 'text-red-600 hover:text-red-900',
          onClick: () => {
            const reason = prompt('Enter rejection reason:');
            if (reason) {
              handleOrganizerAction('reject', organizerId, reason);
            }
          }
        });
      }

      if (verificationStatus === 'verified') {
        actions.push({
          label: 'Suspend Org',
          color: 'text-orange-600 hover:text-orange-900',
          onClick: () => handleOrganizerAction('suspend', organizerId)
        });
      }

      if (verificationStatus === 'suspended') {
        actions.push({
          label: 'Reinstate Org',
          color: 'text-blue-600 hover:text-blue-900',
          onClick: () => handleOrganizerAction('reinstate', organizerId)
        });
      }
    }

    // Delete action (always last)
    actions.push({
      label: 'Delete',
      color: 'text-red-600 hover:text-red-900',
      onClick: () => handleUserAction('delete', user.id)
    });

    return actions;
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
              resetForm();
              setShowUserModal(true);
            }}
          >
            Add New User
          </Button>
        </div>

        {/* Tabs for quick filtering */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('all')}
          >
            All Users ({users.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'organizers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setActiveTab('organizers');
              setRoleFilter('organizer');
            }}
          >
            Organizers ({users.filter(u => u.userType === 'organizer').length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setActiveTab('pending');
              setShowOrganizerSection(true);
            }}
          >
            Pending Verification ({pendingOrganizersCount})
          </button>
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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value !== 'all') setActiveTab('all');
            }}
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
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setActiveTab(e.target.value === 'organizer' ? 'organizers' : 'all');
            }}
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
                          <>
                            <button
                              onClick={() => handleOrganizerAction('verify', organizer.id)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleOrganizerAction('reject', organizer.id, reason);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {organizer.verificationStatus === 'verified' && (
                          <button
                            onClick={() => handleOrganizerAction('suspend', organizer.id)}
                            className="text-orange-600 hover:text-orange-900 px-2 py-1 rounded"
                          >
                            Suspend
                          </button>
                        )}
                        
                        {organizer.verificationStatus === 'suspended' && (
                          <button
                            onClick={() => handleOrganizerAction('reinstate', organizer.id)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded"
                          >
                            Reinstate
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
                const actions = getUserActions(user);
                
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
                          : user.status === 'pending_verification'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.status === 'suspended'
                          ? 'bg-orange-100 text-orange-800'
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
                            : verificationStatus === 'suspended'
                            ? 'bg-orange-100 text-orange-800'
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
                      {user.userType === 'organizer'
                        ? (user.analytics?.organizerStats?.totalEvents ?? user.upcomingEvents ?? 0)
                        : (user.eventsAttended ?? 0)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        {actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={action.onClick}
                            className={`${action.color} px-2 py-1 rounded text-xs`}
                          >
                            {action.label}
                          </button>
                        ))}
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

      {/* User Modal - UPDATED WITH DYNAMIC FIELDS */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          resetForm();
        }}
        title={modalMode === 'create' ? 'Add New User' : 'Edit User'}
        size={formData.userType === 'organizer' ? 'large' : 'medium'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0712345678"
              />
              {modalMode === 'create' && (
                <Input
                  label="Password *"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={modalMode === 'create'}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type *
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="attendee">Attendee</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending_verification">Pending Verification</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organizer Business Information Section - Only shown for organizers */}
          {formData.userType === 'organizer' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Organizer Business Information</h3>
              <p className="text-sm text-blue-700 mb-4">
                {modalMode === 'create' 
                  ? 'Fill in organizer business details. These fields are required for organizer accounts.'
                  : 'Update organizer business information.'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name *"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  required={formData.userType === 'organizer'}
                  placeholder="My Event Company"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={formData.userType === 'organizer'}
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="nonprofit">Nonprofit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Business Address *"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required={formData.userType === 'organizer'}
                  placeholder="123 Main Street"
                />
                <Input
                  label="City *"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required={formData.userType === 'organizer'}
                  placeholder="Nairobi"
                />
                <Input
                  label="State/Province *"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required={formData.userType === 'organizer'}
                  placeholder="Nairobi County"
                />
                <Input
                  label="ZIP/Postal Code *"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required={formData.userType === 'organizer'}
                  placeholder="00100"
                />
                <Input
                  label="Tax ID (Optional)"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="Tax identification number"
                />
                <Input
                  label="Website (Optional)"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => {
                setShowUserModal(false);
                resetForm();
              }}
            >
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
                      : selectedOrganizer.data?.verificationStatus === 'suspended'
                      ? 'bg-orange-100 text-orange-800'
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
                    if (!organizerId) return;
                    
                    const reason = prompt('Enter rejection reason:');
                    if (reason) {
                      handleOrganizerAction('reject', organizerId, reason);
                    }
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    const organizerId = selectedOrganizer.data?.id || selectedOrganizer.data?._id;
                    if (!organizerId) return;
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