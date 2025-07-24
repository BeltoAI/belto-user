"use client";

import React, { useState } from 'react';
import { Lock, Shield, Key, History, Smartphone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const LoginSecurity = ({ user }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !twoFactorEnabled })
      });

      if (response.ok) {
        setTwoFactorEnabled(!twoFactorEnabled);
        toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error('Failed to update 2FA settings');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Login & Security</h2>

      {/* Change Password Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#FFB800]" />
          Change Password
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwords.new}
              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className="bg-[#FFB800] text-black px-6 py-2 rounded-lg hover:bg-[#FFD700] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FFB800]" />
          Two-Factor Authentication (2FA)
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Two-Factor Authentication</p>
            <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={handleTwoFactorToggle}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FFB800]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFB800]"></div>
          </label>
        </div>
      </div>

      {/* Login History */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-[#FFB800]" />
          Login History
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Recent login activity will be displayed here</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Security Questions */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-[#FFB800]" />
          Security Questions
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Set up security questions for account recovery</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#FFB800]" />
          Linked Accounts
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-black">G</span>
              </div>
              <div>
                <p className="text-white font-medium">Google</p>
                <p className="text-gray-400 text-xs">Not connected</p>
              </div>
            </div>
            <button className="text-[#FFB800] hover:text-[#FFD700] text-sm font-medium">
              Connect
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">f</span>
              </div>
              <div>
                <p className="text-white font-medium">Facebook</p>
                <p className="text-gray-400 text-xs">Not connected</p>
              </div>
            </div>
            <button className="text-[#FFB800] hover:text-[#FFD700] text-sm font-medium">
              Connect
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">🍎</span>
              </div>
              <div>
                <p className="text-white font-medium">Apple</p>
                <p className="text-gray-400 text-xs">Not connected</p>
              </div>
            </div>
            <button className="text-[#FFB800] hover:text-[#FFD700] text-sm font-medium">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSecurity;
