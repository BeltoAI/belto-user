"use client";

import React, { useState } from 'react';
import { MessageCircle, Mail, HelpCircle, Send } from 'lucide-react';
import { toast } from 'react-toastify';

const SupportHelp = ({ user }) => {
  const [helpForm, setHelpForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmitHelp = async (e) => {
    e.preventDefault();
    
    if (!helpForm.subject || !helpForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/support/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...helpForm,
          userEmail: user?.email,
          userId: user?._id
        })
      });

      if (response.ok) {
        toast.success('Help request submitted successfully');
        setHelpForm({ subject: '', message: '', priority: 'medium' });
      } else {
        throw new Error('Failed to submit help request');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Support & Help</h2>

      {/* Contact Support */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#FFB800]" />
          Contact Support
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <p className="text-white font-medium">Email Support</p>
            <p className="text-[#FFB800] text-sm">support@belto.world</p>
            <p className="text-gray-400 text-xs mt-1">
              Send us an email for general inquiries and support requests
            </p>
          </div>
          
          <div className="p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <p className="text-white font-medium">Response Time</p>
            <p className="text-gray-400 text-sm">
              We typically respond within 24-48 hours during business days
            </p>
          </div>
        </div>
      </div>

      {/* Help Request Form */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FFB800]" />
          Submit Help Request
        </h3>
        
        <form onSubmit={handleSubmitHelp} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Subject *
            </label>
            <input
              type="text"
              value={helpForm.subject}
              onChange={(e) => setHelpForm(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Priority Level
            </label>
            <select
              value={helpForm.priority}
              onChange={(e) => setHelpForm(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Standard issue</option>
              <option value="high">High - Urgent problem</option>
              <option value="critical">Critical - System down</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Message *
            </label>
            <textarea
              value={helpForm.message}
              onChange={(e) => setHelpForm(prev => ({ ...prev, message: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent resize-vertical"
              placeholder="Please describe your issue in detail..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#FFB800] text-black px-6 py-3 rounded-lg hover:bg-[#FFD700] transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* HubSpot Chatbot */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#FFB800]" />
          Live Chat Support
        </h3>
        
        <div className="text-gray-400 text-sm">
          <p>Chat with our support team using our integrated chatbot</p>
          <p className="mt-2">HubSpot integration coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default SupportHelp;
