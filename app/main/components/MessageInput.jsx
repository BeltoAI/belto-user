import React from 'react';
import { FileUp, SquareArrowUp, Loader2 } from 'lucide-react';
import { analyzeMessage } from '@/utils/messageAnalyzer';

const MessageInput = ({
  currentSessionId,
  inputText,
  setInputText,
  handleFileSelect,
  handleSendMessage,
  handleKeyDown,
  isProcessing,
  isMessageSending,
  selectedFiles,
  userId
}) => {
  const checkAndFlagMessage = async (message) => {
    const analysisResult = analyzeMessage(message);
    
    if (analysisResult.isFlagged) {
      try {
        await fetch('/api/flagged-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            content: message,
            sessionId: currentSessionId,
            matchedKeywords: analysisResult.matchedKeywords,
            severity: analysisResult.severity
          }),
        });
      } catch (error) {
        console.error("Error flagging message:", error);
      }
    }
  };

  // Enhanced send message handler
  const enhancedSendMessage = async (e) => {
    if (inputText.trim()) {
      await checkAndFlagMessage(inputText);
    }
    // Call the original handler
    handleSendMessage(e);
  };

  // Enhanced key down handler
  const enhancedKeyDown = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey && inputText.trim()) {
      await checkAndFlagMessage(inputText);
    }
    // Call the original handler
    handleKeyDown(e);
  };

  return (
    <div className="w-full space-y-2">
      {!currentSessionId && (
        <div className="text-yellow-500 text-sm mb-2 p-2 bg-[#1A1A1A] rounded-lg border border-yellow-500/30">
          ⚠️ Please select a chat session from the sidebar to start messaging
        </div>
      )}
      
      <div className="flex items-center bg-[#1A1A1A] rounded-lg p-1 border border-[#262626]">
        <button
          className={`p-2 hover:bg-[#262626] rounded-md ${!currentSessionId || isMessageSending ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleFileSelect}
          disabled={!currentSessionId || isMessageSending}
        >
          <FileUp className="w-5 h-5 text-[#FFD700]" />
        </button>
        
        <input
          type="text"
          placeholder={
            isMessageSending 
              ? "" 
              : currentSessionId 
                ? "Type your prompt here..." 
                : "Select a chat session to start messaging"
          }
          className={`flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-400 px-4 ${
            isMessageSending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={enhancedKeyDown}
          disabled={!currentSessionId || isMessageSending}
          autoComplete="off"
          spellCheck="false"
        />
        
        <button
          className="p-2 hover:bg-[#262626] rounded-md"
          onClick={enhancedSendMessage}
          disabled={
            isProcessing || 
            isMessageSending || 
            !currentSessionId || 
            (!inputText.trim() && selectedFiles.length === 0)
          }
        >
          {isMessageSending ? (
            <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" />
          ) : (
            <SquareArrowUp 
              className={`w-6 h-6 ${
                (!currentSessionId || (!inputText.trim() && selectedFiles.length === 0))
                  ? 'text-gray-400'
                  : 'text-[#FFD700]'
              }`} 
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;