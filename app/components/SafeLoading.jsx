"use client";

import React, { useEffect, useState } from 'react';

const SafeLoading = ({ componentName = "Component", onRetry }) => {
  const [dots, setDots] = useState('');
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Show retry button after 10 seconds
    const retryTimer = setTimeout(() => {
      setShowRetry(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(retryTimer);
    };
  }, []);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#111111] text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800] mx-auto mb-4"></div>
        <p className="text-gray-300 mb-2">
          Loading {componentName}{dots}
        </p>
        {showRetry && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">
              Taking longer than expected...
            </p>
            <button
              onClick={handleRetry}
              className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition-colors text-sm"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeLoading;
