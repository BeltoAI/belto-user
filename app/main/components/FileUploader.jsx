import React from 'react';
import { X } from 'lucide-react';

const FileUploader = ({ selectedFiles, removeFile, getFileIcon }) => {
  if (selectedFiles.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {selectedFiles.map((file, index) => (
        <div
          key={index}
          className="flex items-center bg-[#1A1A1A] rounded px-2 py-1 text-xs text-yellow-500 border border-[#262626]"
        >
          <span className="mr-2 text-xs text-white px-1.5 py-0.5 bg-[#262626] rounded">
            {file.type === 'url' ? 'URL' : getFileIcon(file.name)}
          </span>
          <span className="mr-2">{file.name}</span>
          <button
            onClick={() => removeFile(index)}
            className="text-[#666666] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FileUploader;