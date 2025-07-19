"use client";
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Shield, Lock, Save } from 'lucide-react';

const SecuritySection = ({ user }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">Security Settings</h2>
      </div>

      {/* Account Information */}
      <div className="bg-gray-700 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Email:</span>
            <span className="text-white ml-2">{user?.email}</span>
          </div>
          <div>
            <span className="text-gray-400">Role:</span>
            <span className="text-white ml-2 capitalize">{user?.role}</span>
          </div>
          <div>
            <span className="text-gray-400">Account Status:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              user?.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {user?.status || 'Active'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Verified:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              user?.isVerified ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
            }`}>
              {user?.isVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-700 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
              minLength={6}
            />
            <p className="text-sm text-gray-400 mt-1">Must be at least 6 characters long</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecuritySection;
