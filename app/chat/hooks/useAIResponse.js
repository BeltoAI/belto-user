"use client";
import { useCallback, useState } from 'react';
import { processAIResponse } from '../utils/responseProcessor';

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

      // Optimize conversation history based on message complexity for SPEED
      let recentMessages;
      const isSimpleMessage = prompt.length < 50 && (!attachments || attachments.length === 0);
      
      if (isSimpleMessage) {
        // For simple greetings/short messages, use minimal or no history for speed
        recentMessages = previousMessages.length > 0 ? previousMessages.slice(-2) : [];
        console.log("⚡ FAST TRACK: Using minimal history for simple message");
      } else {
        // For complex messages, use more history but still limit to last 6 messages
        recentMessages = Array.isArray(previousMessages) ? previousMessages.slice(-6) : [];
      }
      
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

      // Enhanced retry logic with improved attempts based on message complexity
      let lastError = null;
      let maxRetries;
      
      // Determine retry strategy based on message complexity - IMPROVED STABILITY
      if (isSimpleMessage) {
        maxRetries = 2; // Increased from 1 for better reliability
      } else if (attachments && attachments.length > 0) {
        maxRetries = 3; // Keep same for document processing
      } else {
        maxRetries = 3; // Increased for normal messages
      }
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const logPrefix = attachments && attachments.length > 0 ? '📄' : (isSimpleMessage ? '⚡' : '🤖');
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
            
            // Process the raw response to improve formatting and detect issues
            const processedData = processAIResponse(data.response || '', {
              checkTruncation: true,
              improveFormatting: true,
              analyzeCompleteness: true
            });
            
            console.log('Response analysis:', {
              originalLength: processedData.originalLength,
              processedLength: processedData.processedLength,
              isComplete: processedData.isComplete,
              isTruncated: processedData.isTruncated,
              confidence: processedData.confidence
            });

            // Use the processed response
            const finalResponse = processedData.response;
            
            // Check if this is a fallback response
            if (data.fallback) {
              console.log('✅ Received enhanced fallback response from AI proxy');
              
              // If it's a partial analysis with processing hints, enhance it with additional context
              if (data.partialAnalysis && data.processingHints) {
                const hints = data.processingHints;
                console.log('📄 Enhanced fallback with processing context:', hints);
                
                return {
                  response: finalResponse,
                  tokenUsage: data.tokenUsage,
                  fallback: true,
                  partialAnalysis: true,
                  processingHints: hints,
                  suggestions: data.suggestions || [],
                  responseQuality: processedData
                };
              }
              
              // If it's a partial analysis, enhance it with additional suggestions
              if (data.partialAnalysis) {
                return {
                  response: finalResponse,
                  tokenUsage: data.tokenUsage,
                  fallback: true,
                  partialAnalysis: true,
                  suggestions: data.suggestions || [],
                  responseQuality: processedData
                };
              }
              
              return {
                response: finalResponse,
                tokenUsage: data.tokenUsage,
                fallback: true,
                responseQuality: processedData
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
              response: finalResponse || 'I apologize, but I could not generate a response.',
              limitReached: data.limitReached || false,
              tokenUsage: data.tokenUsage || {
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0
              },
              responseQuality: processedData
            };
          }
          
          // Handle error responses
          const errorData = await response.json().catch(() => ({}));
          lastError = new Error(errorData.error || `HTTP ${response.status}`);
          lastError.status = response.status;
          
          console.error(`❌ AI proxy error on attempt ${attempt}:`, response.status, errorData);
          
          // If this is not the last attempt and it's a potentially recoverable error, retry
          if (attempt < maxRetries && (response.status === 503 || response.status >= 500)) {
            // IMPROVED wait times based on message complexity
            let waitTime;
            if (isSimpleMessage) {
              waitTime = 300; // Increased from 100ms for simple messages
            } else if (attachments && attachments.length > 0) {
              waitTime = attempt * 1000; // Keep longer wait for document processing
            } else {
              waitTime = attempt * 500; // Increased retry for normal messages
            }
            
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
            // IMPROVED wait times based on message complexity
            let waitTime;
            if (isSimpleMessage) {
              waitTime = 300; // Increased from 100ms for simple messages
            } else if (attachments && attachments.length > 0) {
              waitTime = attempt * 1000; // Keep longer wait for document processing
            } else {
              waitTime = attempt * 500; // Increased retry for normal messages
            }
            
            console.log(`⏱️ Waiting ${waitTime}ms before retry...`);
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
        const hints = requestBody.processingHints;
        
        console.log('📄 Generating client-side fallback analysis with hints:', hints);
        
        // Enhanced client-side document analysis
        let basicResponse = `📄 **Document Processing Issue - Basic Analysis**\n\n`;
        basicResponse += `**File:** ${fileName}\n`;
        
        if (hints) {
          basicResponse += `**Type:** ${hints.documentType.toUpperCase()}\n`;
          basicResponse += `**Size:** ${Math.floor(hints.contentLength/1000)}KB\n`;
          basicResponse += `**Requested:** ${hints.analysisType === 'summary' ? 'Summary' : 'Detailed Analysis'}\n\n`;
        }
        
        // Basic content analysis
        const wordCount = content.split(/\s+/).length;
        const hasHeadings = /^#+\s|\n#+\s|heading|title|chapter|section/i.test(content);
        const firstSentences = content.substring(0, 300).split('.').slice(0, 2).join('.') + '.';
        
        basicResponse += `**Quick Overview:**\n`;
        basicResponse += `• Document contains approximately ${wordCount} words\n`;
        
        if (hasHeadings) {
          basicResponse += `• Structured document with sections/headings\n`;
        }
        
        if (firstSentences.length > 10) {
          basicResponse += `\n**Opening Content:**\n"${firstSentences}"\n`;
        }
        
        basicResponse += `\n**⚠️ Processing Status:** The AI service is experiencing connectivity issues and cannot provide full ${hints?.analysisType || 'analysis'} right now.\n`;
        
        basicResponse += `\n**💡 Try These Options:**\n`;
        
        if (hints?.analysisType === 'summary') {
          basicResponse += `• Ask for a summary of specific sections\n`;
          basicResponse += `• Request key points from particular topics\n`;
        } else {
          basicResponse += `• Ask specific questions about the document content\n`;
          basicResponse += `• Request analysis of particular sections\n`;
        }
        
        basicResponse += `• Break your request into smaller parts\n`;
        basicResponse += `• Try uploading a smaller document section\n`;
        basicResponse += `• Retry in a few moments when service stabilizes\n`;
        
        return {
          response: basicResponse,
          tokenUsage: {
            total_tokens: 60,
            prompt_tokens: 30,
            completion_tokens: 30
          },
          partialAnalysis: true,
          processingHints: hints,
          error: false // Not really an error, just limited functionality
        };
      }
      
      // Standard error responses for non-document requests with educational focus
      if (errorMessage.includes('Could not connect to AI service') || errorMessage.includes('503')) {
        // Check if this was a request with attachments
        if (attachments && attachments.length > 0) {
          const fileSize = attachments[0].content?.length || 0;
          if (fileSize > 10000) {
            fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. 📄 I'm having some trouble processing your large document right now due to connectivity issues. 

**Here's how I can still help you**:
• Ask specific questions about sections of your document
• Request summaries of particular topics or chapters
• Get explanations of key concepts within the material  
• Break down complex topics into simpler explanations

Please try asking about a specific part of your document, or try again in a moment when my full processing capabilities are restored!`;
          } else {
            fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. 📄 I'm experiencing some connectivity issues while processing your document, but I'm designed to help you with your academic needs.

**Try these approaches**:
• Ask specific questions about the document content
• Request explanations of particular concepts
• Ask for summaries of specific sections

I'll do my best to assist you with your educational tasks once connectivity is restored!`;
          }
        } else {
          fallbackResponse = `Hello! I'm BELTO AI, your dedicated educational assistant designed to help students with their academic tasks and educational activities.

🎓 **I'm here to help you with**:
• Academic questions and coursework support
• Explaining complex concepts in simple terms
• Study guidance and learning assistance  
• Research and analysis support
• Educational content review

I'm currently experiencing some connectivity issues, but please try your question again in a moment. I'm committed to supporting your learning journey!`;
        }
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
        if (attachments && attachments.length > 0) {
          const fileSize = attachments[0].content?.length || 0;
          if (fileSize > 15000) {
            fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. ⏱️ Your document is quite large and taking longer than expected to process. 

**For faster results, try**:
• Asking specific questions about document sections
• Requesting summaries of particular topics
• Breaking your request into smaller parts
• Uploading smaller document sections

I'm designed to help with your academic needs, so please try a more focused request or wait a moment for full processing capability!`;
          } else {
            fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. ⏱️ Your document is taking longer than expected to process due to system load.

**Quick alternatives**:
• Ask specific questions about the content
• Request explanations of key concepts
• Try asking about particular sections

I'm here to support your learning, so please try again with a more specific question or wait a moment!`;
          }
        } else {
          fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. ⏱️ I'm taking longer than expected to respond due to high system demand.

I'm designed specifically to help students with academic tasks and educational activities. Please try again with your question in a moment, and I'll be ready to support your learning!`;
        }
      } else if (errorMessage.includes('500')) {
        fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. 🔧 I'm experiencing some internal system issues, but I'm designed to help you with your academic tasks and educational activities.

**While I work on resolving this**:
• Please try your question again in a moment
• Consider rephrasing your request
• Break complex questions into simpler parts

I'm committed to supporting your learning journey, so please don't hesitate to try again!`;
      } else if (errorMessage.includes('429')) {
        fallbackResponse = `Hello! I'm BELTO AI, your educational assistant. 🚦 I'm currently experiencing high demand for my educational support services.

**Please try again in a moment** - I'm designed specifically to help students with:
• Academic questions and coursework
• Concept explanations and study guidance  
• Educational content analysis
• Learning support and research assistance

Your education is important, so I'll be ready to help shortly!`;
      } else {
        fallbackResponse = `Hello! I'm BELTO AI, your dedicated educational assistant. ⚠️ I'm experiencing some technical difficulties right now, but I'm designed to help students with their academic tasks and educational activities.

**I'm here to support your learning with**:
• Academic questions and explanations
• Study guidance and research help
• Educational content analysis
• Concept clarification and learning support

Please try your question again in a moment - I'm committed to helping you succeed in your studies!`;
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
            
            // Process the response for better formatting and quality
            const processedData = processAIResponse(data.response || '', {
              checkTruncation: true,
              improveFormatting: true,
              analyzeCompleteness: true
            });
            
            console.log(`Response quality analysis for lecture ${lectureId}:`, {
              isComplete: processedData.isComplete,
              confidence: processedData.confidence,
              isTruncated: processedData.isTruncated
            });

            const finalResponse = processedData.response;
            
            // Check if this is a fallback response
            if (data.fallback) {
              console.log('✅ Received fallback response from AI proxy');
              return {
                response: finalResponse,
                tokenUsage: data.tokenUsage,
                fallback: true,
                responseQuality: processedData
              };
            }
            
            // Check if the new response would exceed the token limit
            if (preferences.tokenPredictionLimit && 
                (totalTokensUsed + (data.tokenUsage?.total_tokens || 0)) > preferences.tokenPredictionLimit) {
              return {
                response: finalResponse,
                tokenUsage: data.tokenUsage || {
                  total_tokens: 0,
                  prompt_tokens: 0,
                  completion_tokens: 0
                },
                tokenLimitWarning: `You are now at ${totalTokensUsed + (data.tokenUsage?.total_tokens || 0)}/${preferences.tokenPredictionLimit} tokens for this session.`,
                responseQuality: processedData
              };
            }
            
            console.log(`✅ AI response generated successfully for lecture ${lectureId}`);
            return {
              response: finalResponse || 'I apologize, but I could not generate a response.',
              limitReached: data.limitReached || false,
              tokenUsage: data.tokenUsage || {
                total_tokens: 0, 
                prompt_tokens: 0,
                completion_tokens: 0
              },
              streaming: preferences.streaming || false,
              responseQuality: processedData
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
