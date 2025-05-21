import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
        <p className="text-white">Loading class details...</p>
      </div>
    </div>
  );
}
