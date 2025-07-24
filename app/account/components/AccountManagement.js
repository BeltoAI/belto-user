"use client";

import React, { useState } from 'react';
import { Settings, Trash2, User, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const AccountManagement = ({ user }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const accountId = user?._id || 'N/A';
  const accountStatus = 'Active'; // This should come from user data
  const subscriptionPlan = 'Free'; // This should come from user data

  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(accountId);
    toast.success('Account ID copied to clipboard');
  };

  const handleDeactivateAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/settings/account/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Account deactivated successfully');
        // Redirect to login or home page
        window.location.href = '/';
      } else {
        throw new Error('Failed to deactivate account');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Account Management</h2>

      {/* Account Status */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FFB800]" />
          Account Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Account Status
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                accountStatus === 'Active' 
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {accountStatus}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Subscription Plan
            </label>
            <div className="flex items-center justify-between">
              <span className="text-white">{subscriptionPlan}</span>
              <button className="text-[#FFB800] hover:text-[#FFD700] text-sm font-medium">
                Upgrade
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Account ID / Customer Number
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white font-mono text-sm">
                {accountId}
              </div>
              <button
                onClick={handleCopyAccountId}
                className="p-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Copy Account ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plan Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4">Subscription & Billing</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div>
              <p className="text-white font-medium">Current Plan: {subscriptionPlan}</p>
              <p className="text-gray-400 text-sm">Manage your subscription and billing</p>
            </div>
            <button className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#FFD700] transition-colors font-medium">
              Manage Plan
            </button>
          </div>

          <div className="p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <h4 className="text-white font-medium mb-3">Apply Discount Code</h4>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter discount code"
                className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              />
              <button className="bg-[#FFB800] text-black px-6 py-2 rounded-lg hover:bg-[#FFD700] transition-colors font-medium">
                Apply
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Have a discount code? Enter it here to apply to your subscription.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 p-6 rounded-lg border border-red-500/30">
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
            <h4 className="text-white font-medium mb-2">Deactivate Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Temporarily deactivate your account. You can reactivate it later by logging in.
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
              Deactivate Account
            </button>
          </div>

          <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
            <h4 className="text-white font-medium mb-2">Delete Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] p-6 rounded-lg border border-red-500/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Delete Account</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete your account? This action is permanent and cannot be undone.
              All your data will be permanently removed.
            </p>
            <p className="text-gray-300 mb-4">
              Type <span className="font-bold text-red-400">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="Type DELETE here"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-[#444444] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={loading || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
