"use client";

import React from 'react';
import ProfileInformation from './ProfileInformation';
import LoginSecurity from './LoginSecurity';
import AccountManagement from './AccountManagement';
import PaymentBilling from './PaymentBilling';
import PrivacySettings from './PrivacySettings';
import SupportHelp from './SupportHelp';
import LegalCompliance from './LegalCompliance';

const AccountSettings = ({ activeSection, user, onUserUpdate }) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileInformation user={user} onUserUpdate={onUserUpdate} />;
      case 'login':
        return <LoginSecurity user={user} />;
      case 'account':
        return <AccountManagement user={user} />;
      case 'billing':
        return <PaymentBilling user={user} />;
      case 'privacy':
        return <PrivacySettings user={user} />;
      case 'support':
        return <SupportHelp user={user} />;
      case 'legal':
        return <LegalCompliance />;
      default:
        return <ProfileInformation user={user} onUserUpdate={onUserUpdate} />;
    }
  };

  return (
    <div className="bg-[#1f1f1f] rounded-lg border border-[#333333] overflow-hidden">
      {renderSection()}
    </div>
  );
};

export default AccountSettings;
