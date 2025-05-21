import React from 'react';

const TokenUsage = ({ usage }) => {
  if (!usage) return null;

  return (
    <div className="mt-4 flex items-center gap-4">
      <div className="flex-1 border border-yellow-500/20 rounded-lg p-3 bg-yellow-500/5">
        <p className="text-xs text-yellow-500 mb-1">Completion Tokens</p>
        <p className="text-sm font-medium text-yellow-500">
          {usage.completion_tokens}
        </p>
      </div>
      
      <div className="flex-1 border border-yellow-500/20 rounded-lg p-3 bg-yellow-500/5">
        <p className="text-xs text-yellow-500 mb-1">Prompt Tokens</p>
        <p className="text-sm font-medium text-yellow-500">
          {usage.prompt_tokens}
        </p>
      </div>
      
      <div className="flex-1 border border-yellow-500/20 rounded-lg p-3 bg-yellow-500/5">
        <p className="text-xs text-yellow-500 mb-1">Total Tokens</p>
        <p className="text-sm font-medium text-yellow-500">
          {usage.total_tokens}
        </p>
      </div>
    </div>
  );
};

export default TokenUsage;
