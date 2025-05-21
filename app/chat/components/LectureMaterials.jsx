import React from 'react';

export const LectureMaterials = ({ materials, isLoading }) => {
  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm">
        <div className="flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-[#FFB800] rounded-full"></div>
          <span className="text-gray-400">Loading materials...</span>
        </div>
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 p-2 bg-[#262626] rounded-md">
      <div className="mb-1 text-xs font-medium text-[#FFB800]">Lecture Materials:</div>
      <div className="flex flex-wrap gap-2">
        {materials.map((material, index) => (
          <div 
            key={material._id || index}
            className="text-xs px-2 py-1 bg-[#363636] rounded flex items-center group"
          >
            <span className="truncate max-w-[150px]">{material.title}</span>
            <button 
              className="ml-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Ask about this document"
              onClick={() => navigator.clipboard.writeText(`Summarize ${material.title}`)}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1 text-xs text-gray-400">
        You can ask questions about these materials, e.g., Summarize sample.docx.
      </div>
    </div>
  );
};