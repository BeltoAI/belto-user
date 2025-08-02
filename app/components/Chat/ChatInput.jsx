"use client";

import React, { useState, useEffect } from 'react';
import { FileUp, SquareArrowUp, X, AlertTriangle, Shield, Copy } from 'lucide-react';
import useChatStore from '@/store/chatStore';
import { toast } from 'react-toastify';

const ChatInput = ({ 
  handleSubmit, 
  fileInputRef, 
  handleFileUpload, 
  isGenerating,
  disableFileUpload = false,
  limitReached = false,
  limitType = '',
  tokenCount = 0,
  tokenLimit = 0,
  messageCount = 0,
  messageLimit = 0,
  sessionId, // Now required
  userId     // Now required
}) => {
  const { 
    currentInput, 
    setCurrentInput, 
    currentAttachment,
    setCurrentAttachment,
    flaggedContent,
    setFlaggedContent
  } = useChatStore();

  // State to track flagging status
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagDetails, setFlagDetails] = useState(null);
  
  // Add state for copy-paste settings
  const [allowCopyPaste, setAllowCopyPaste] = useState(true);
  const [copyPasteWarningVisible, setCopyPasteWarningVisible] = useState(false);

  // Fetch professor settings on component mount
  useEffect(() => {
    const fetchProfessorSettings = async () => {
      if (!userId) {
        console.error("No user ID provided");
        return;
      }
      
      try {
        // First get the joined classes using userId
        const joinedClassesResponse = await fetch(`/api/classes/joined?studentId=${userId}`);
        if (!joinedClassesResponse.ok) {
          console.error("Failed to fetch joined classes");
          return;
        }
        
        const joinedClasses = await joinedClassesResponse.json();
        
        if (!joinedClasses || joinedClasses.length === 0) {
          console.error("No joined classes found");
          return;
        }
        
        // Get the first class from the response
        const firstClass = joinedClasses[0];
        const professorId = firstClass.professorId;
        
        if (!professorId) {
          console.error("No professor ID found in class data");
          return;
        }
        
        // Create professor-settings endpoint and use it
        const settingsResponse = await fetch(`/api/classes/professor-settings?classId=${firstClass._id}`);
        if (!settingsResponse.ok) {
          console.error("Failed to fetch professor settings");
          return;
        }
        
        const settingsData = await settingsResponse.json();
        
        if (settingsData) {
          // Set the copy-paste restriction based on professor settings
          setAllowCopyPaste(settingsData.allowCopyPaste);
          console.log("Copy-paste allowed:", settingsData.allowCopyPaste);
        }
      } catch (error) {
        console.error("Error fetching professor settings:", error);
      }
    };
    
    fetchProfessorSettings();
  }, [userId]);

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
    // Reset flagging state when input changes
    if (isFlagged) {
      setIsFlagged(false);
      setFlagDetails(null);
    }
  };

  const handleRemoveFile = () => {
    setCurrentAttachment(null);
  };

  // Handle paste event
  const handlePaste = (e) => {
    if (!allowCopyPaste) {
      e.preventDefault();
      setCopyPasteWarningVisible(true);
      
      // Show toast notification
      toast.error('Pasting is disabled by the professor for this class', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Hide warning after a delay
      setTimeout(() => {
        setCopyPasteWarningVisible(false);
      }, 3000);
      
      return false;
    }
  };

  // Simple keyword check for potentially problematic content
  const checkForFlaggedContent = async (text) => {
    // Ensure we have the required session and user ids
    if (!sessionId || !userId) {
      console.error("Missing sessionId or userId. Cannot flag message without these values.");
      return { isFlagged: false };
    }
    
    // Simple example keyword list
    const sensitiveKeywords = {
      high: [
        "kill", "murder", "death", "suicide", "harm", "hurt", "weapon",
        "gun", "knife", "bomb", "threat", "attack", "shoot", "stab", 
        "explosive", "destroy", "violence", "assault", "die", "dead"
      ],
      medium: [
        "hate", "revenge", "dangerous", "angry", "threat", "fight",
        "hurt", "pain", "suffer", "hate you", "watch out", "regret"
      ]
    };
    
    const textLower = text.toLowerCase();
    let matchedKeywords = [];
    let severity = null;
    
    // Check for high severity keywords
    const highMatches = sensitiveKeywords.high.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    );
    
    if (highMatches.length > 0) {
      matchedKeywords = highMatches;
      severity = 'high';
    } else {
      // Check medium severity keywords
      const mediumMatches = sensitiveKeywords.medium.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      );
      
      if (mediumMatches.length > 0) {
        matchedKeywords = mediumMatches;
        severity = 'medium';
      }
    }
    
    if (matchedKeywords.length > 0 && severity) {
      try {
        // Call the API to flag the message
        const response = await fetch('/api/flagged-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: text,
            sessionId,
            userId,
            matchedKeywords,
            severity
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store the flagged content
          setFlaggedContent([...flaggedContent, data.flaggedMessage]);
          return {
            isFlagged: true,
            severity,
            matchedKeywords,
            id: data.flaggedMessage._id
          };
        }
      } catch (error) {
        console.error('Error flagging message:', error);
      }
    }
    
    return { isFlagged: false };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = currentInput.trim();
    if (!text || limitReached) return;
    
    // Check for potentially sensitive content
    const flagResult = await checkForFlaggedContent(text);
    
    if (flagResult.isFlagged) {
      setIsFlagged(true);
      setFlagDetails(flagResult);
      // Don't clear input yet; wait for user confirmation
      return;
    }
    
    // Not flagged; proceed with submission
    setCurrentInput('');
    try {
      await handleSubmit(e);
      setCurrentAttachment(null);
    } catch (error) {
      console.error('Error submitting message:', error);
      setCurrentInput(text);
    }
  };
  
  // Handle confirmed submission of flagged content
  const handleConfirmSubmit = async () => {
    const messageText = currentInput.trim();
    setCurrentInput('');
    
    try {
      const syntheticEvent = { 
        preventDefault: () => {},
        isFlaggedContent: true,
        messageText: messageText
      };
      
      await handleSubmit(syntheticEvent);
      setCurrentAttachment(null);
      setIsFlagged(false);
      setFlagDetails(null);
    } catch (error) {
      console.error('Error submitting flagged message:', error);
      setCurrentInput(messageText);
    }
  };
  
  // Handle cancellation of flagged content submission
  const handleCancelSubmit = () => {
    setIsFlagged(false);
    setFlagDetails(null);
  };
  
  const renderLimitWarning = () => {
    if (!limitReached && !tokenLimit && !messageLimit) return null;
    
    let warningMessage = '';
    let isError = limitReached;
    
    if (limitReached) {
      warningMessage = limitType === 'token' 
        ? `Token limit reached (${tokenLimit} tokens). No more messages can be sent.`
        : `Message limit reached (${messageLimit} messages). No more messages can be sent.`;
    } else if (tokenLimit && tokenCount > tokenLimit * 0.8) {
      const percentage = Math.round((tokenCount / tokenLimit) * 100);
      warningMessage = `Token usage: ${tokenCount}/${tokenLimit} (${percentage}%)`;
    } else if (messageLimit && messageCount > messageLimit * 0.8) {
      const percentage = Math.round((messageCount / messageLimit) * 100);
      warningMessage = `Message count: ${messageCount}/${messageLimit} (${percentage}%)`;
    } else {
      return null;
    }
    
    return (
      <div className={`flex items-center gap-2 p-2 rounded-md mb-3 text-xs ${
        isError ? 'bg-red-900/30 border border-red-700 text-red-200' : 'bg-amber-900/30 border border-amber-700 text-amber-200'
      }`}>
        <AlertTriangle className="h-3 w-3" />
        <span>{warningMessage}</span>
      </div>
    );
  };

  // Render flagged content alert
  const renderFlaggedAlert = () => {
    if (!isFlagged || !flagDetails) return null;
    
    const severityColor = flagDetails.severity === 'high' 
      ? 'bg-red-900/30 border-red-700 text-red-200' 
      : 'bg-amber-900/30 border-amber-700 text-amber-200';
    
    return (
      <div className={`mb-3 p-3 border rounded-md ${severityColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Potential sensitive content detected</span>
        </div>
        <p className="text-sm mb-3">
          Your message appears to contain {flagDetails.severity} severity keywords: 
          <span className="font-semibold"> {flagDetails.matchedKeywords.join(', ')}</span>
        </p>
        <p className="text-xs mb-3">This message will be flagged for review by administrators.</p>
        <div className="flex justify-end gap-2">
          <button 
            type="button"
            onClick={handleCancelSubmit}
            className="px-3 py-1 text-sm bg-transparent border border-gray-400 hover:bg-[#262626] rounded-md"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirmSubmit}
            className="px-3 py-1 text-sm bg-[#FFD700] text-black hover:bg-[#FFB800] rounded-md"
          >
            Send Anyway
          </button>
        </div>
      </div>
    );
  };

  // Render copy-paste warning
  const renderCopyPasteWarning = () => {
    if (!copyPasteWarningVisible) return null;
    
    return (
      <div className="flex items-center gap-2 p-2 rounded-md mb-3 text-xs bg-red-900/30 border border-red-700 text-red-200">
        <Copy className="h-3 w-3" />
        <span>Pasting is disabled by the professor for this class</span>
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="p-4 bg-[#1A1A1A] border-t border-[#262626]">
      {renderLimitWarning()}
      {renderFlaggedAlert()}
      {renderCopyPasteWarning()}
      
      {currentAttachment && (
        <div className="flex items-center gap-2 mb-3 bg-[#262626] px-3 py-2 rounded-md">
          <span className="text-sm text-gray-300 truncate flex-1">
            {currentAttachment.name}
          </span>
          <button 
            type="button"
            onClick={handleRemoveFile}
            className="hover:bg-[#363636] rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4 text-[#FFB800]" />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt"
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          className={`p-2 hover:bg-[#262626] rounded-md transition-colors ${
            isGenerating || currentAttachment || disableFileUpload || limitReached ? 'opacity-50 cursor-not-allowed' : ''
          }`} 
          disabled={isGenerating || currentAttachment || disableFileUpload || limitReached}
          title={
            limitReached ? "Limit reached - uploads disabled" :
            disableFileUpload ? "File uploads are disabled for this lecture" : 
            "Upload a file"
          }
        >
          <FileUp className="w-5 h-5 text-[#FFD700]" />
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={currentInput} 
            onChange={handleInputChange}
            onPaste={handlePaste} // Add paste event handler
            placeholder={
              limitReached ? 
                limitType === 'token' ?
                  `Token limit reached (${tokenLimit} tokens)` : 
                  `Message limit reached (${messageLimit} messages)` 
                : isGenerating ? "Belto is thinking..." : "Type your message..."
            } 
            className={`w-full bg-transparent border-none focus:outline-none text-white ${
              limitReached ? 'opacity-50 cursor-not-allowed' : ''
            } ${isGenerating ? 'pr-20' : ''}`}
            disabled={isGenerating || limitReached} 
          />
          {isGenerating && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-xs text-[#FFB800] ml-2">Processing</span>
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className={`p-2 rounded-md transition-colors ${
            isGenerating || !currentInput.trim() || limitReached ? 
              'opacity-50 cursor-not-allowed bg-[#262626]' : 
              'hover:bg-[#262626] bg-[#1A1A1A] border border-[#FFB800]/30 hover:border-[#FFB800]/60'
          }`} 
          disabled={isGenerating || !currentInput.trim() || limitReached}
          title={isGenerating ? "Belto is processing..." : "Send message"}
        >
          {isGenerating ? (
            <div className="w-6 h-6 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SquareArrowUp className="w-6 h-6 text-[#FFD700]" />
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;