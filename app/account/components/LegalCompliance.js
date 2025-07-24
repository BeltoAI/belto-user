"use client";

import React from 'react';
import { FileText, Shield, Scale, ExternalLink } from 'lucide-react';

const LegalCompliance = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Legal & Compliance</h2>

      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#FFB800]" />
          Legal Documents
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#FFB800]" />
              <div>
                <p className="text-white font-medium">Terms of Service</p>
                <p className="text-gray-400 text-sm">Last updated: Coming soon</p>
              </div>
            </div>
            <a
              href="https://belto.world/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FFB800] hover:text-[#FFD700] flex items-center gap-1 text-sm font-medium"
            >
              View <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#FFB800]" />
              <div>
                <p className="text-white font-medium">Privacy Policy</p>
                <p className="text-gray-400 text-sm">Last updated: Coming soon</p>
              </div>
            </div>
            <a
              href="https://belto.world/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FFB800] hover:text-[#FFD700] flex items-center gap-1 text-sm font-medium"
            >
              View <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded-lg border border-[#333333]">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#FFB800]" />
              <div>
                <p className="text-white font-medium">License Agreements</p>
                <p className="text-gray-400 text-sm">Software and content licensing terms</p>
              </div>
            </div>
            <button className="text-[#FFB800] hover:text-[#FFD700] flex items-center gap-1 text-sm font-medium">
              View <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-900/20 p-6 rounded-lg border border-yellow-500/30">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">
          Legal Notice
        </h3>
        <p className="text-gray-300 text-sm">
          Our legal team is currently working on finalizing all legal documents and compliance requirements. 
          These will be available soon and will include comprehensive terms of service, privacy policies, 
          and license agreements that comply with international standards and regulations.
        </p>
        <p className="text-gray-300 text-sm mt-3">
          For any legal inquiries, please contact our legal department at legal@belto.world
        </p>
      </div>
    </div>
  );
};

export default LegalCompliance;
