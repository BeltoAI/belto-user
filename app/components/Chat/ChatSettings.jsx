import React, { useEffect, useState } from 'react';
import { Zap, MessageSquare } from 'lucide-react';

const ChatSettings = ({ 
  aiPreferences,
  tokenCount = 0,
  messageCount = 0,
  sessionId = null
}) => {
  const [persistentStats, setPersistentStats] = useState({
    totalTokenUsage: 0,
    totalPrompts: 0
  });

  // Load persistent stats from localStorage when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const cachedStats = localStorage.getItem(`sessionStats_${sessionId}`);
      if (cachedStats) {
        const parsedStats = JSON.parse(cachedStats);
        setPersistentStats({
          totalTokenUsage: parsedStats.totalTokenUsage || 0,
          totalPrompts: parsedStats.totalPrompts || 0
        });
      }
    }
  }, [sessionId]);

  if (!aiPreferences) return null;

  const { 
    tokenPredictionLimit,
    numPrompts,
    model,
    maxTokens
  } = aiPreferences;

  // Use persistent stats if available, otherwise fall back to props
  const displayTokenCount = Math.max(tokenCount, persistentStats.totalTokenUsage);
  const displayMessageCount = Math.max(messageCount, persistentStats.totalPrompts);

  return (
    <div className="px-4 py-3 bg-[#1A1A1A]/80 border-b border-[#262626] flex flex-wrap items-center gap-3 text-sm text-gray-300">
      {/* Message limit display */}
      {numPrompts && (
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4 text-[#FFB800]" />
          <span className="text-gray-400">Messages:</span>
          <span className={`font-medium ${displayMessageCount > numPrompts * 0.8 ? 'text-amber-400' : 'text-white'}`}>
            {displayMessageCount}/{numPrompts}
          </span>
        </div>
      )}

      {/* Token limit display */}
      {tokenPredictionLimit && (
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-[#FFB800]" />
          <span className="text-gray-400">Tokens:</span>
          <span className={`font-medium ${displayTokenCount > tokenPredictionLimit * 0.8 ? 'text-amber-400' : 'text-white'}`}>
            {displayTokenCount}/{tokenPredictionLimit}
          </span>
        </div>
      )}

      {/* Separator for visual clarity */}
      {((numPrompts && model) || (tokenPredictionLimit && model)) && (
        <div className="h-4 border-r border-[#363636]"></div>
      )}

      {/* Model display */}
      {model && (
        <div className="text-gray-400">
          <span>Model:</span> <span className="text-white">{model.split('/').pop()}</span>
        </div>
      )}

      {/* Max tokens per message */}
      {maxTokens && (
        <div className="text-gray-400">
          <span>Max per message:</span> <span className="text-white">{maxTokens}</span>
        </div>
      )}
    </div>
  );
};

export default ChatSettings;