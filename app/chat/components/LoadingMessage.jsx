import Image from 'next/image';

export const LoadingMessage = ({ message = "Generating response..." }) => (
  <div className="flex items-start space-x-3 p-4 bg-[#141414] rounded-lg mb-4 border border-[#FFB800]/20">
    <Image 
      src="/logo.png"
      alt="Belto Logo"
      width={32}
      height={32}
      className='rounded-full w-8 h-8'
    />
    <div className="flex-1">
      <div className="text-sm text-[#FFB800] mb-2 font-medium">BELTO</div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-sm text-gray-300 animate-pulse">{message}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Processing your request using AI...
      </div>
    </div>
  </div>
);
