"use client";
import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-[#111111] overflow-hidden">
      {/* Header placeholder */}
      <div className="flex items-center justify-between h-12 border-b border-[#262626] px-4">
        <div className="w-32 h-6 bg-gray-700 rounded"></div>
        <div className="w-20 h-6 bg-gray-700 rounded"></div>
      </div>
      {/* Content area placeholder */}
      <div className="flex-grow flex items-center justify-center relative">
        <div className="w-full max-w-4xl p-6 animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
        </div>
      </div>
      {/* Sidebar placeholder */}
      <div className="w-full h-12 bg-[#262626]"></div>
    </div>
  );
}
