// AdminUsers.jsx - Users management page
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
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await adminService.getUsers();
      // Ensure users is always an array
      setUsers(Array.isArray(allUsers) ? allUsers : allUsers.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action, userId, userData = null) => {
    try {
      switch (action) {
        case 'suspend':
          await adminService.suspendUser(userId);
          showSuccess('User suspended successfully');
          break;
        case 'activate':
          await adminService.activateUser(userId);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role')
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
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage platform users and their permissions</p>
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
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
          </select>
          <div className="text-sm text-gray-500 self-center">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
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
              ))}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              defaultValue={selectedUser?.role || 'user'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="user">User</option>
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
    </div>
  );
};

export default AdminUsers;