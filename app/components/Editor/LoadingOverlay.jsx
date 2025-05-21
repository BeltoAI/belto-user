const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="text-lg">Converting document...</span>
          <span className="text-sm text-gray-600">Please wait while we process your file</span>
        </div>
      </div>
    </div>
  );
  
  export default LoadingOverlay;