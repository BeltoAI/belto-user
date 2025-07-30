"use client";

import React, { useState } from 'react';
import { Paperclip, ThumbsUp, ThumbsDown, Copy, Trash2, X, Info, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Custom renderer for code blocks
const CodeBlock = ({ language, value }) => {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="bg-[#363636] hover:bg-[#464646] text-xs px-2 py-1 rounded"
        >
          Copy
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'javascript'}
        style={atomDark}
        customStyle={{
          margin: '1em 0',
          borderRadius: '0.375rem',
          backgroundColor: '#262626'
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatMessage = ({
  id,
  isBot,
  avatar,
  name,
  message,
  suggestions,
  attachments,
  onLike,
  onDislike,
  onCopy,
  onDelete,
  liked,
  disliked,
  reactionPending = false,
  isLoading,
  tokenUsage,
  limitReached,
  limitType,
  tokenLimitWarning,
  isStreaming
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    }
  };

  // Add message reaction buttons with improved styling and transitions
  const renderReactionButtons = () => {
    if (!isBot) return null; // Only show reaction buttons for AI responses
    
    return (
      <div className="flex space-x-2 mt-1">
        <button
          onClick={onLike}
          disabled={reactionPending}
          className={`text-xs px-2 py-1 rounded transition-all duration-200 transform active:scale-95 ${
            liked 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-[#363636] hover:bg-[#464646] text-gray-300 hover:shadow-md'
          } ${reactionPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          aria-label="Like this response"
        >
          <span className={`mr-1 transition-transform duration-200 ${liked ? 'scale-110' : ''} ${reactionPending ? 'animate-pulse' : ''}`}>
            👍
          </span>
          {liked ? 'Liked' : 'Like'}
          {reactionPending && <span className="ml-1 inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>}
        </button>
        
        <button
          onClick={onDislike}
          disabled={reactionPending}
          className={`text-xs px-2 py-1 rounded transition-all duration-200 transform active:scale-95 ${
            disliked 
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25' 
              : 'bg-[#363636] hover:bg-[#464646] text-gray-300 hover:shadow-md'
          } ${reactionPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          aria-label="Dislike this response"
        >
          <span className={`mr-1 transition-transform duration-200 ${disliked ? 'scale-110' : ''} ${reactionPending ? 'animate-pulse' : ''}`}>
            👎
          </span>
          {disliked ? 'Disliked' : 'Dislike'}
          {reactionPending && <span className="ml-1 inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>}
        </button>
        
        <button
          onClick={onCopy}
          className="bg-[#363636] hover:bg-[#464646] text-xs px-2 py-1 rounded text-gray-300 transition-all duration-200 hover:shadow-md active:scale-95"
          aria-label="Copy message"
        >
          <span className="mr-1">📋</span>
          Copy
        </button>
        
        <button
          onClick={handleDelete}
          className={`bg-[#363636] hover:bg-[#464646] text-xs px-2 py-1 rounded text-gray-300 transition-all duration-200 hover:shadow-md active:scale-95 ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isDeleting}
          aria-label="Delete message"
        >
          <span className="mr-1">🗑️</span>
          Delete
        </button>
        
        {tokenUsage && (
          <button
            onClick={() => setShowTokenInfo(!showTokenInfo)}
            className="bg-[#363636] hover:bg-[#464646] text-xs px-2 py-1 rounded text-gray-300 transition-all duration-200 hover:shadow-md active:scale-95"
            aria-label="Show token usage information"
          >
            <span className="mr-1">ℹ️</span>
            Info
          </button>
        )}
      </div>
    );
  };

  // Render limit warning banner
  const renderLimitWarning = () => {
    if (!limitReached && !tokenLimitWarning) return null;

    const warningMessage = limitReached 
      ? (limitType === 'token' 
          ? "Token limit reached! You've used all available tokens for this session."
          : "Message limit reached! You've used all available messages for this session.")
      : tokenLimitWarning;

    return (
      <div className="bg-red-900/30 border border-red-700 rounded-md p-3 mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-sm text-red-200 font-medium">{warningMessage}</span>
      </div>
    );
  };

  // Render streaming indicators
  const renderLoadingIndicator = () => {
    if (!isLoading) return null;
    
    if (isStreaming) {
      // For streaming, show a subtler indicator
      return (
        <div className="flex items-center space-x-1 mb-2">
          <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse"></div>
        </div>
      );
    } else {
      // For non-streaming, show the bouncing dots
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      );
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-[#1A1A1A] text-white relative">
      {/* Blur effect during deletion */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
        </div>
      )}

      <div className="flex gap-3">
        {isBot ? (
          <Image 
            src="/logo.png"
            alt="Belto"
            width={64}
            height={64}
            className="rounded-full object-cover w-8 h-8"
          />
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {avatar && avatar !== '/user.png' ? (
              <Image 
                src={avatar}
                alt={name || "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default user image if profile image fails to load
                  e.target.src = '/user.png';
                }}
              />
            ) : (
              <Image 
                src="/user.png"
                alt={name || "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm font-medium">
              {name === "BELTO" ? (
                <span>
                  <span className="text-[#FFB800]">B</span>ELTO
                </span>
              ) : (
                name
              )}
            </span>
          </div>
          
          {/* Show limit warning banner if applicable */}
          {isBot && renderLimitWarning()}
          
          {/* Show loading indicators appropriate for streaming/non-streaming */}
          {isLoading ? renderLoadingIndicator() : (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    ) : (
                      <code className="bg-[#262626] px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => <p className="text-sm text-gray-300 mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-gray-300">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#FFB800] pl-4 italic my-2">
                      {children}
                    </blockquote>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-[#FFB800] mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-[#FFB800] mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-bold text-[#FFB800] mb-2">{children}</h3>
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}

          {/* Display attachments */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-[#262626] px-2 py-1 rounded-md"
                >
                  <Paperclip className="w-4 h-4 text-[#FFB800]" />
                  <span className="text-sm text-
                  gray-300">{file.name}</span>
                  <button className="hover:bg-[#363636] rounded-full p-1">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bot-specific actions */}
          {isBot && (
            <>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={onLike}
                  className="p-1 hover:bg-[#262626] rounded-md"
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${liked ? 'text-[#FFB800]' : 'text-gray-400'}`}
                  />
                </button>
                <button
                  onClick={onDislike}
                  className="p-1 hover:bg-[#262626] rounded-md"
                >
                  <ThumbsDown
                    className={`w-4 h-4 ${disliked ? 'text-[#FFB800]' : 'text-gray-400'}`}
                  />
                </button>
                <button
                  onClick={onCopy}
                  className="p-1 hover:bg-[#262626] rounded-md"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 hover:bg-[#262626] rounded-md"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 text-[#FFB800] animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {tokenUsage && (
                  <button
                    onClick={() => setShowTokenInfo(!showTokenInfo)}
                    className="p-1 hover:bg-[#262626] rounded-md flex items-center gap-1"
                  >
                    <Info className={`w-4 h-4 ${showTokenInfo ? 'text-[#FFB800]' : 'text-gray-400'}`} />
                  </button>
                )}
              </div>

              {/* Token Usage Information - Show when showTokenInfo is true */}
              {isBot && tokenUsage && showTokenInfo && (
                <div className="bg-[#262626] p-2 rounded-md mb-3">
                  <p className="text-xs text-gray-300">
                    <span className="text-[#FFB800]">Total tokens:</span> {tokenUsage.total_tokens || 0}
                  </p>
                  <p className="text-xs text-gray-300">
                    <span className="text-[#FFB800]">Prompt tokens:</span> {tokenUsage.prompt_tokens || 0}
                  </p>
                  <p className="text-xs text-gray-300">
                    <span className="text-[#FFB800]">Completion tokens:</span> {tokenUsage.completion_tokens || 0}
                  </p>
                </div>
              )}

              {/* Display suggestions */}
              {suggestions && suggestions.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-[#1A1A1A] p-3 rounded-lg border border-[#262626]"
                    >
                      <div className="text-[#FFB800] text-sm mb-2">
                        Suggestion {index + 1}
                      </div>
                      <p className="text-sm text-gray-300">{suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;