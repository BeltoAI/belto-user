import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import useEditorStore from '@/store/editorStore';
import { X, Trash2 } from 'lucide-react';

const VersionHistory = ({ onVersionClick, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const versions = useEditorStore((state) => state.getVersions());
  const deleteVersion = useEditorStore((state) => state.deleteVersion);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDeleteVersion = (id) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      deleteVersion(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#262626] rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-[#363636] rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-[#363636] rounded"></div>
              <div className="h-12 bg-[#363636] rounded"></div>
              <div className="h-12 bg-[#363636] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#262626] rounded-lg p-4 max-h-[80vh] overflow-y-auto">
      <X
        className="w-6 h-6 text-white cursor-pointer absolute top-4 right-12"
        onClick={onClose}
      />
      <h2 className="text-white text-lg font-semibold mb-4">Version History</h2>
      {versions.length > 0 ? (
        versions.map((version) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(version.content, "text/html");
          const textContent = doc.body.textContent || "";
          const previewText = textContent.length > 50 ? textContent.slice(0, 50) + "..." : textContent;

          return (
            <div
              key={version.id}
              className="mb-4 cursor-pointer hover:bg-[#363636] p-2 rounded"
            >
              <div className="flex justify-between items-center">
                <div onClick={() => onVersionClick(version.content)}>
                  <p className="text-gray-400 text-sm">{format(version.date, "yyyy-MM-dd HH:mm")}</p>
                  <p className="text-white">{previewText}</p>
                </div>
                <Trash2
                  className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVersion(version.id);
                  }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-gray-400 text-sm">No versions available</p>
      )}
    </div>
  );
};

export default VersionHistory;