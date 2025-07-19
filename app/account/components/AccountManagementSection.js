"use client";
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Settings, Trash2, Download, AlertTriangle } from 'lucide-react';

const AccountManagementSection = ({ user }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Simulate data export
      const userData = {
        profile: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          dateOfBirth: user?.dateOfBirth,
          gender: user?.gender,
          language: user?.language,
          timezone: user?.timezone
        },
        aiPreferences: user?.aiPreferences,
        accountInfo: {
          role: user?.role,
          status: user?.status,
          isVerified: user?.isVerified,
          createdAt: user?.createdAt
        }
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `account-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Account data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export account data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would call an API to delete the account
      toast.info('Account deletion request submitted. This feature is not implemented in demo mode.');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">Account Management</h2>
      </div>

      {/* Data Export */}
      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </h3>
        <p className="text-gray-300 mb-4">
          Download a copy of all your account data including profile information, AI preferences, and account settings.
        </p>
        <button
          onClick={handleExportData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          {loading ? 'Exporting...' : 'Export Data'}
        </button>
      </div>

      {/* Account Statistics */}
      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-600 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{user?.classes?.length || 0}</div>
            <div className="text-gray-300">Classes Enrolled</div>
          </div>
          <div className="bg-gray-600 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-gray-300">Member Since</div>
          </div>
          <div className="bg-gray-600 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {user?.aiPreferences?.preRules?.length || 0}
            </div>
            <div className="text-gray-300">AI Pre-Rules</div>
          </div>
          <div className="bg-gray-600 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-500">
              {user?.aiPreferences?.postRules?.length || 0}
            </div>
            <div className="text-gray-300">AI Post-Rules</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900 border border-red-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Danger Zone
        </h3>
        <p className="text-red-200 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-red-200 font-medium mb-2">
                Type "DELETE MY ACCOUNT" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-3 bg-red-800 border border-red-600 rounded-md text-white focus:ring-2 focus:ring-red-500"
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagementSection;
