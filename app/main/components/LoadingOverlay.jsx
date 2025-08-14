import React from 'react';

const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-4 h-4 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;