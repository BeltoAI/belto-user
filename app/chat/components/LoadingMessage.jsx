import Image from 'next/image';

export const LoadingMessage = () => (
  <div className="flex items-start space-x-3 p-4 bg-[#141414] rounded-lg mb-4 border border-[#FFB800]/20">
    <Image 
      src="/logo.png"
      alt="Belto Logo"
      width={32}
      height={32}
      className='rounded-full w-8 h-8'
    />
    <div className="flex-1">
      <div className="text-sm text-[#FFB800] mb-2 font-medium">BELTO AI</div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-3 h-3 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
        </div>
      </div>
    </div>
  </div>
);
