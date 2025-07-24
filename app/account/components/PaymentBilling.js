"use client";

import React from 'react';
import { CreditCard, Download, Calendar, DollarSign, Receipt } from 'lucide-react';

const PaymentBilling = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Payment & Billing</h2>

      {/* Payment Methods */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#FFB800]" />
          Payment Methods
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Manage your saved payment methods</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#FFB800]" />
          Billing History
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>View and download your billing history</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#FFB800]" />
          Subscription Details
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>View subscription start/end dates and auto-renewal settings</p>
          <p className="mt-2">Feature coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentBilling;
