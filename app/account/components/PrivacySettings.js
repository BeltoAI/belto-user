"use client";

import React from 'react';
import { Shield, Download, Trash2, Share2 } from 'lucide-react';

const PrivacySettings = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>

      {/* Data Sharing */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#FFB800]" />
          Data Sharing Preferences
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Control how your data is shared and used</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Data Download */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#FFB800]" />
          Download Personal Data
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Request a download of all your personal data (GDPR compliance)</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Data Deletion */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-[#FFB800]" />
          Request Data Deletion
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Request deletion of your personal data (GDPR/CCPA compliance)</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
