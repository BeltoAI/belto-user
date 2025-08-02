"use client";
import { useCallback, useState } from 'react';

export const useAIResponse = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAIResponse = useCallback(async (
    prompt, 
    attachments = [], 
    previousMessages = [], 
    aiPreferences = null,
    messageCount = 0
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if message count exceeds limit
      if (aiPreferences?.numPrompts && messageCount >= aiPreferences.numPrompts) {
        return {
          response: `I apologize, but you've reached the maximum number of messages (${aiPreferences.numPrompts}) allowed for this session.`,
          limitReached: true,
          limitType: 'prompt',
          tokenUsage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
        };
      }

      // Calculate total tokens used so far if tracking is enabled
      let totalTokensUsed = 0;
      if (aiPreferences?.tokenPredictionLimit && previousMessages.length > 0) {
        // If previousMessages contains properly formatted messages with tokenUsage
        if (previousMessages[0].tokenUsage) {
          totalTokensUsed = previousMessages.reduce((sum, msg) => {
            return sum + (msg.tokenUsage?.total_tokens || 0);
          }, 0);
        }
        
        // If approaching token limit (>90%), warn the user
        if (totalTokensUsed > aiPreferences.tokenPredictionLimit * 0.9) {
          console.warn(`Approaching token limit: ${totalTokensUsed}/${aiPreferences.tokenPredictionLimit}`);
        }
        
        // If exceeding token limit, return error message
        if (totalTokensUsed >= aiPreferences.tokenPredictionLimit) {
          return {
            response: `I apologize, but you've reached the maximum token usage limit (${aiPreferences.tokenPredictionLimit}) for this session.`,
            limitReached: true,
            limitType: 'token',
            tokenUsage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          };
        }
      }

      // Limit conversation history to last 6 messages for faster processing
      const recentMessages = Array.isArray(previousMessages) ? previousMessages.slice(-6) : [];
      
      // Ensure history is properly formatted for the AI model
      const formattedHistory = recentMessages.map(msg => {
        // If it's already in the right format, use it directly
        if (msg.role && msg.content) return msg;
        
        // Otherwise, convert it to the correct format
        return {
          role: msg.isBot ? 'assistant' : 'user',
          content: msg.message || msg.text || msg.content || ''
        };
      });

      // Prepare the request body with AI preferences if available
      const requestBody = {
        // Optimize prompt construction for attachments
        prompt: attachments && attachments.length > 0 
          ? `${prompt}\n\nDocument Analysis Request: Please analyze the attached document content.`
          : prompt,
        attachments, // Include the original attachments for reference
        history: formattedHistory,
        messageCount
      };
      
      // For document attachments, add helpful context
      if (attachments && attachments.length > 0) {
        const attachment = attachments[0];
        const contentLength = attachment.content?.length || 0;
        
        // Add processing hints for the AI
        requestBody.processingHints = {
          documentType: attachment.name?.split('.').pop() || 'unknown',
          contentLength: contentLength,
          analysisType: prompt.toLowerCase().includes('summarize') ? 'summary' : 'analysis',
          requestType: 'document_processing'
        };
        
        console.log("📄 Document processing hints:", requestBody.processingHints);
      }

      // If we have AI preferences, add them to the request
      if (aiPreferences) {
        requestBody.preferences = aiPreferences;
      }

      console.log("Sending AI request with history length:", formattedHistory.length);
      console.log("Message count:", messageCount, "Limit:", aiPreferences?.numPrompts || "unspecified");
      console.log("Token usage:", totalTokensUsed, "Limit:", aiPreferences?.tokenPredictionLimit || "unspecified");
      
      // Log attachment info for debugging
      if (attachments && attachments.length > 0) {
        console.log("📄 Processing attachment:", {
          name: attachments[0].name,
          contentLength: attachments[0].content?.length || 0,
          type: attachments[0].name?.split('.').pop() || 'unknown'
        });
      }

      // Enhanced retry logic with fallback for RAG system reliability
      let lastError = null;
      let maxRetries = attachments && attachments.length > 0 ? 3 : 2; // More retries for PDF attachments
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const logPrefix = attachments && attachments.length > 0 ? '📄' : '🤖';
          console.log(`${logPrefix} AI request attempt ${attempt}/${maxRetries}...`);
          
          const response = await fetch('/api/ai-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Check if this is a fallback response
            if (data.fallback) {
              console.log('✅ Received fallback response from AI proxy');
              
              // If it's a partial analysis, enhance it with additional suggestions
              if (data.partialAnalysis) {
                return {
                  response: data.response,
                  tokenUsage: data.tokenUsage,
                  fallback: true,
                  partialAnalysis: true,
                  suggestions: data.suggestions || []
                };
              }
              
              return {
                response: data.response,
                tokenUsage: data.tokenUsage,
                fallback: true
              };
            }
            
            // Check if the new response would exceed the token limit
            if (aiPreferences?.tokenPredictionLimit && 
                (totalTokensUsed + (data.tokenUsage?.total_tokens || 0)) > aiPreferences.tokenPredictionLimit) {
              return {
                response: data.response,
                tokenUsage: data.tokenUsage || {
                  total_tokens: 0,
                  prompt_tokens: 0,
                  completion_tokens: 0
                },
                tokenLimitWarning: `You are now at ${totalTokensUsed + (data.tokenUsage?.total_tokens || 0)}/${aiPreferences.tokenPredictionLimit} tokens for this session.`
              };
            }
            
            console.log(`✅ AI response generated successfully on attempt ${attempt}`);
            return {
              response: data.response || 'I apologize, but I could not generate a response.',
              limitReached: data.limitReached || false,
              tokenUsage: data.tokenUsage || {
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0
              }
            };
          }
          
          // Handle error responses
          const errorData = await response.json().catch(() => ({}));
          lastError = new Error(errorData.error || `HTTP ${response.status}`);
          lastError.status = response.status;
          
          console.error(`❌ AI proxy error on attempt ${attempt}:`, response.status, errorData);
          
          // If this is not the last attempt and it's a potentially recoverable error, retry
          if (attempt < maxRetries && (response.status === 503 || response.status >= 500)) {
            const waitTime = attachments && attachments.length > 0 ? attempt * 1000 : attempt * 500; // Longer wait for PDFs
            console.log(`⏱️ Waiting ${waitTime}ms before retry (PDF processing)...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // If it's not a recoverable error, break out of the loop
          break;
        } catch (error) {
          lastError = error;
          console.error(`❌ Network error on attempt ${attempt}:`, error);
          
          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = attachments && attachments.length > 0 ? attempt * 1000 : attempt * 500; // Longer wait for PDFs
            console.log(`⏱️ Waiting ${waitTime}ms before retry (attachment processing)...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to generate AI response');
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      const errorMessage = error.message || "Failed to generate AI response";
      setError(errorMessage);
      
      // Provide more helpful fallback responses based on error type
      let fallbackResponse;
      
      // Generate a basic document analysis if we have attachment content
      if (attachments && attachments.length > 0 && attachments[0].content) {
        const content = attachments[0].content;
        const fileName = attachments[0].name || 'document';
        
        // Try to provide some value even when the main service fails
        const wordCount = content.split(/\s+/).length;
        const hasHeadings = /^#+\s|\n#+\s|heading|title|chapter|section/i.test(content);
        const firstSentences = content.substring(0, 300).split('.').slice(0, 2).join('.') + '.';
        
        let basicResponse = `📄 I can see your document "${fileName}" (approximately ${wordCount} words). `;
        
        if (hasHeadings) {
          basicResponse += "It appears to be a structured document with sections. ";
        }
        
        if (firstSentences.length > 10) {
          basicResponse += `\n\nDocument opening: "${firstSentences}" `;
        }
        
        basicResponse += `\n\nWhile I'm having connectivity issues with the full AI processing service, here's what I can tell you about your document. For a more detailed analysis, please try:`;
        basicResponse += `\n• Asking specific questions about particular sections`;
        basicResponse += `\n• Requesting analysis of specific topics`;
        basicResponse += `\n• Breaking down your request into smaller parts`;
        basicResponse += `\n• Trying again in a few moments`;
        
        return {
          response: basicResponse,
          tokenUsage: {
            total_tokens: 50,
            prompt_tokens: 25,
            completion_tokens: 25
          },
          partialAnalysis: true,
          error: false // Not really an error, just limited functionality
        };
      }
      
      // Standard error responses for non-document requests
      if (errorMessage.includes('Could not connect to AI service') || errorMessage.includes('503')) {
        // Check if this was a request with attachments
        if (attachments && attachments.length > 0) {
          const fileSize = attachments[0].content?.length || 0;
          if (fileSize > 10000) {
            fallbackResponse = "📄 Your document is quite large and I'm having trouble processing it right now. Please try asking specific questions about the document instead of requesting a full analysis, or try again in a moment.";
          } else {
            fallbackResponse = "📄 I'm having trouble processing your document right now. Please try asking specific questions about the content or try again in a moment.";
          }
        } else {
          fallbackResponse = "🔧 I'm experiencing connectivity issues with the AI service. The system is working to restore connection. Please try again in a moment.";
        }
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
        if (attachments && attachments.length > 0) {
          const fileSize = attachments[0].content?.length || 0;
          if (fileSize > 15000) {
            fallbackResponse = "⏱️ Your document is very large and taking longer than expected to process. Please try asking specific questions about the document instead of requesting a full summary, or upload a smaller document.";
          } else {
            fallbackResponse = "⏱️ Your document is taking longer than expected to process. Please try with specific questions about the content or wait a moment before trying again.";
          }
        } else {
          fallbackResponse = "⏱️ The AI service is taking longer than expected. Please try again with a shorter message or wait a moment.";
        }
      } else if (errorMessage.includes('500')) {
        fallbackResponse = "🔧 The AI service encountered an internal error. Please try again in a moment.";
      } else if (errorMessage.includes('429')) {
        fallbackResponse = "🚦 The AI service is currently busy. Please wait a moment and try again.";
      } else {
        fallbackResponse = `⚠️ I'm having trouble generating a response right now. Please try again.`;
      }
      
      return {
        response: fallbackResponse,
        tokenUsage: {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0
        },
        error: true
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateAIResponseWithPreferences = async (message, sessionId, lectureId, previousMessages = [], messageCount = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the parameters being used
      console.log("🔍 Generating AI response with preferences:", { 
        message: message.substring(0, 50) + '...', 
        sessionId, 
        lectureId,
        messageCount,
        historyLength: previousMessages.length
      });
      
      // Add a small delay to prevent race conditions when lecture is newly selected
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch AI preferences first
      const preferencesResponse = await fetch(`/api/lectures/${lectureId}/preferences`);
      
      if (!preferencesResponse.ok) {
        const errorData = await preferencesResponse.json();
        console.error("❌ Failed to fetch AI preferences:", errorData);
        throw new Error(`Failed to fetch AI preferences: ${errorData.error || preferencesResponse.statusText}`);
      }
      
      const preferences = await preferencesResponse.json();
      console.log("✅ AI preferences fetched:", preferences);
      
      // Check message limits
      if (preferences.numPrompts && messageCount >= preferences.numPrompts) {
        return {
          response: `I apologize, but you've reached the maximum number of messages (${preferences.numPrompts}) allowed for this session.`,
          limitReached: true,
          limitType: 'prompt',
          tokenUsage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
        };
      }

      // Calculate total tokens used so far if tracking is enabled
      let totalTokensUsed = 0;
      if (preferences.tokenPredictionLimit && previousMessages.length > 0) {
        totalTokensUsed = previousMessages.reduce((sum, msg) => {
          return sum + (msg.tokenUsage?.total_tokens || 0);
        }, 0);
        
        // If exceeding token limit, return error message
        if (totalTokensUsed >= preferences.tokenPredictionLimit) {
          return {
            response: `I apologize, but you've reached the maximum token usage limit (${preferences.tokenPredictionLimit}) for this session.`,
            limitReached: true,
            limitType: 'token',
            tokenUsage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          };
        }
      }

      // Format previous messages correctly for the API
      const formattedHistory = previousMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text || msg.content || msg.message || ''
      }));
      
      // Now make the actual AI request with properly formatted message
      let lastError = null;
      let maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🤖 AI request attempt ${attempt}/${maxRetries} for lecture ${lectureId}...`);
          
          const aiResponse = await fetch('/api/ai-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              sessionId,
              preferences,
              history: formattedHistory,
              messageCount,
              messages: [
                { role: 'user', content: message }
              ]
            }),
          });
          
          if (aiResponse.ok) {
            const data = await aiResponse.json();
            
            // Check if this is a fallback response
            if (data.fallback) {
              console.log('✅ Received fallback response from AI proxy');
              return {
                response: data.response,
                tokenUsage: data.tokenUsage,
                fallback: true
              };
            }
            
            // Check if the new response would exceed the token limit
            if (preferences.tokenPredictionLimit && 
                (totalTokensUsed + (data.tokenUsage?.total_tokens || 0)) > preferences.tokenPredictionLimit) {
              return {
                response: data.response,
                tokenUsage: data.tokenUsage || {
                  total_tokens: 0,
                  prompt_tokens: 0,
                  completion_tokens: 0
                },
                tokenLimitWarning: `You are now at ${totalTokensUsed + (data.tokenUsage?.total_tokens || 0)}/${preferences.tokenPredictionLimit} tokens for this session.`
              };
            }
            
            console.log(`✅ AI response generated successfully for lecture ${lectureId}`);
            return {
              response: data.response || 'I apologize, but I could not generate a response.',
              limitReached: data.limitReached || false,
              tokenUsage: data.tokenUsage || {
                total_tokens: 0, 
                prompt_tokens: 0,
                completion_tokens: 0
              },
              streaming: preferences.streaming || false
            };
          }
          
          // Handle error response
          const errorData = await aiResponse.json().catch(() => ({}));
          lastError = new Error(errorData.error || `HTTP ${aiResponse.status}`);
          lastError.status = aiResponse.status;
          
          console.error(`❌ AI response generation failed on attempt ${attempt}:`, errorData);
          
          // If this is not the last attempt and it's a potentially recoverable error, retry
          if (attempt < maxRetries && (aiResponse.status === 503 || aiResponse.status >= 500)) {
            const waitTime = attempt * 500; // Progressive delay: 500ms, 1000ms
            console.log(`⏱️ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // If it's not a recoverable error, break out of the loop
          break;
        } catch (error) {
          lastError = error;
          console.error(`❌ Network error on attempt ${attempt}:`, error);
          
          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = attempt * 500; // Progressive delay: 500ms, 1000ms
            console.log(`⏱️ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('AI response generation failed after retries');
    } catch (error) {
      console.error("❌ Error in generateAIResponseWithPreferences:", error);
      setError(error.message || "Failed to generate AI response");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    generateAIResponse, 
    generateAIResponseWithPreferences, 
    isLoading, 
    error 
  };
};
