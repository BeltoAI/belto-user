"use client";
import React, { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import AccountManagementSection from './components/AccountManagementSection';
import AIPreferencesSection from './components/AIPreferencesSection';
import { User, Shield, Settings, Bot } from 'lucide-react';

const AccountPage = () => {
  const { user, loading } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to access your account settings.</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ai-preferences', label: 'AI Preferences', icon: Bot },
    { id: 'account', label: 'Account Management', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-700 mb-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-500 border-b-2 border-yellow-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'profile' && <ProfileSection user={user} />}
          {activeTab === 'security' && <SecuritySection user={user} />}
          {activeTab === 'ai-preferences' && <AIPreferencesSection user={user} />}
          {activeTab === 'account' && <AccountManagementSection user={user} />}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
