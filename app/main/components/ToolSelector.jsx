import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ToolSelector = ({ selectedTool, setSelectedTool, tools, setSelectedFiles }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 text-white"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className="text-2xl md:text-3xl font-normal tracking-wide">
          <span className="text-[#FFD700]">B</span>ELTO
        </span>
        <div className="flex items-center ml-2 bg-[#1A1A1A] px-3 py-1 md:px-4 md:py-1.5 rounded text-gray-300 text-sm">
          {selectedTool}
          <ChevronDown className="ml-2 w-4 h-4" />
        </div>
      </button>
      
      {isDropdownOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center pt-20 md:pt-40"
          onClick={() => setIsDropdownOpen(false)}
        >
          <div
            className="w-[90%] md:w-[480px] bg-[#141414] rounded-lg shadow-xl z-50"
            onClick={e => e.stopPropagation()}
          >
            {tools.map((section, idx) => (
              <div key={idx} className="py-3">
                <h3 className="text-xs text-[#FFD700] px-4 mb-2 uppercase font-medium">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      className={`w-full text-left px-4 py-3 transition-colors duration-200 flex items-start gap-3 
                        ${item.disabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-[#1A1A1A] cursor-pointer'
                        }
                        ${selectedTool === item.title ? 'bg-[#1A1A1A]' : ''}`}
                      onClick={() => {
                        if (item.disabled) return;
                        setSelectedTool(item.title);
                        setIsDropdownOpen(false);
                        setSelectedFiles([]);
                      }}
                      disabled={item.disabled}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg
                        ${item.disabled ? 'bg-[#2A2A2A] text-gray-500' : 'bg-[#1A1A1A]'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.disabled ? 'text-gray-500' : 'text-white'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-[#808080] mt-1">{item.description}</p>
                      </div>
                      <div className={`w-5 h-5 mt-1 rounded-full border flex items-center justify-center transition-colors duration-200 
                        ${selectedTool === item.title
                          ? 'border-[#FFD700] bg-[#FFD700]'
                          : item.disabled 
                            ? 'border-[#2A2A2A] bg-[#2A2A2A]'
                            : 'border-[#333333]'}`}
                      >
                        {selectedTool === item.title && !item.disabled && (
                          <div className="w-2 h-2 rounded-full bg-black"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolSelector;