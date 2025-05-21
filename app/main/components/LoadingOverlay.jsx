import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ isVisible, message }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
        <p className="text-white text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;