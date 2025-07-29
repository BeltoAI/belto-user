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

      // Ensure history is properly formatted for the AI model
      const formattedHistory = Array.isArray(previousMessages) ? 
        previousMessages.map(msg => {
          // If it's already in the right format, use it directly
          if (msg.role && msg.content) return msg;
          
          // Otherwise, convert it to the correct format
          return {
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.message || msg.text || msg.content || ''
          };
        }) : [];

      // Prepare the request body with AI preferences if available
      const requestBody = {
        // If prompt has attachments, explicitly include them in the main content
        prompt: attachments && attachments.length > 0 
          ? `${prompt}\n\nAttached document content:\n${attachments[0].content}`
          : prompt,
        attachments, // Still include the original attachments for reference
        history: formattedHistory,
        messageCount
      };

      // If we have AI preferences, add them to the request
      if (aiPreferences) {
        requestBody.preferences = aiPreferences;
      }

      console.log("Sending AI request with history length:", formattedHistory.length);
      console.log("Message count:", messageCount, "Limit:", aiPreferences?.numPrompts || "unspecified");
      console.log("Token usage:", totalTokensUsed, "Limit:", aiPreferences?.tokenPredictionLimit || "unspecified");

      // Implement client-side retry logic for better reliability
      let lastError = null;
      let maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`AI request attempt ${attempt}...`);
          
          const response = await fetch('/api/ai-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestBody,
              preferences: {
                ...requestBody.preferences,
                streaming: aiPreferences?.streaming || false
              }
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
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
          
          console.error(`AI proxy error on attempt ${attempt}:`, response.status, errorData);
          
          // If this is not the last attempt and it's a potentially recoverable error, retry
          if (attempt < maxRetries && (response.status === 503 || response.status >= 500)) {
            const waitTime = attempt * 1000; // Progressive delay: 1s, 2s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // If it's not a recoverable error, break out of the loop
          break;
        } catch (error) {
          lastError = error;
          console.error(`Network error on attempt ${attempt}:`, error);
          
          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = attempt * 1000; // Progressive delay: 1s, 2s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to generate AI response');
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage = error.message || "Failed to generate AI response";
      setError(errorMessage);
      
      return {
        response: `I apologize, but an error occurred: ${errorMessage}`,
        tokenUsage: {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0
        }
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
      console.log("Generating AI response with:", { 
        message, 
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
        console.error("Failed to fetch AI preferences:", errorData);
        throw new Error(`Failed to fetch AI preferences: ${errorData.error || preferencesResponse.statusText}`);
      }
      
      const preferences = await preferencesResponse.json();
      console.log("AI preferences fetched:", preferences);
      
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
          console.log(`AI request attempt ${attempt} for lecture ${lectureId}...`);
          
          const aiResponse = await fetch('/api/ai-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              sessionId,
              preferences: {
                ...preferences,
                streaming: preferences?.streaming || false
              },
              history: formattedHistory,
              messageCount,
              messages: [
                { role: 'user', content: message }
              ]
            }),
          });
          
          if (aiResponse.ok) {
            const data = await aiResponse.json();
            
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
          
          console.error(`AI response generation failed on attempt ${attempt}:`, errorData);
          
          // If this is not the last attempt and it's a potentially recoverable error, retry
          if (attempt < maxRetries && (aiResponse.status === 503 || aiResponse.status >= 500)) {
            const waitTime = attempt * 1000; // Progressive delay: 1s, 2s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // If it's not a recoverable error, break out of the loop
          break;
        } catch (error) {
          lastError = error;
          console.error(`Network error on attempt ${attempt}:`, error);
          
          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = attempt * 1000; // Progressive delay: 1s, 2s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('AI response generation failed after retries');
    } catch (error) {
      console.error("Error in generateAIResponseWithPreferences:", error);
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