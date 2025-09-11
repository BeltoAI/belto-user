"use client";

import { useCallback, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAIResponse } from './useAIResponse';
import { useResponseQualityMonitor } from './useResponseQualityMonitor';
import { useUser } from '@/contexts/UserContext';
import { processAIResponse, enhanceCodeExamples } from '../utils/responseProcessor';

// Update the function signature to accept lectureMaterials
export const useChatHandlers = (
  userId,
  currentSessionId,
  messages,
  setMessages,
  setIsGenerating,
  updateTokenUsage,
  clearInputs,
  aiPreferences, // Add AI preferences parameter
  lectureMaterials = [] // Add this parameter
) => {
  const { user } = useUser();
  const [username, setUsername] = useState('User');
  // Start with empty avatar; UI will render an icon fallback (no user.png)
  const [userAvatar, setUserAvatar] = useState('');
  const { generateAIResponse } = useAIResponse();
  const { logQualityMetrics } = useResponseQualityMonitor();

  // Track total token usage for the session - SECURITY: These should NEVER decrease when messages are deleted
  const [totalTokenUsage, setTotalTokenUsage] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);
  
  // SECURITY: Track if counters have been initialized to prevent reset attacks
  const [countersInitialized, setCountersInitialized] = useState(false);
  
  // SECURITY: Fetch and sync with server-side security counters when session changes
  useEffect(() => {
    const fetchSecurityCounters = async () => {
      if (!currentSessionId) return;
      
      try {
        const response = await fetch(`/api/chat/security?sessionId=${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔒 SECURITY: Syncing with server-side counters', {
            sessionId: currentSessionId.substring(0, 8) + '...',
            serverPrompts: data.security.totalPromptsUsed,
            serverTokens: data.security.totalTokensUsed,
            clientPrompts: totalPrompts,
            clientTokens: totalTokenUsage
          });
          
          // Use server-side counters as the source of truth
          setTotalPrompts(data.security.totalPromptsUsed);
          setTotalTokenUsage(data.security.totalTokensUsed);
          setCountersInitialized(true);
        }
      } catch (error) {
        console.error('Failed to fetch security counters:', error);
        // Fallback to message-based calculation if server fetch fails
        if (!countersInitialized && messages.length > 0) {
          const tokenSum = messages.reduce((sum, msg) => {
            if (msg.isBot && msg.tokenUsage) {
              return sum + (msg.tokenUsage.total_tokens || 0);
            }
            return sum;
          }, 0);
          const promptCount = messages.filter(msg => !msg.isBot).length;
          setTotalTokenUsage(tokenSum);
          setTotalPrompts(promptCount);
          setCountersInitialized(true);
        }
      }
    };
    
    fetchSecurityCounters();
  }, [currentSessionId]); // Only run when session changes

  // Update username and avatar when user data changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || 'User');
      // Prefer profileImage, then Google picture, else empty string
      const avatarToUse = (user.profileImage && user.profileImage.trim() !== '')
        ? user.profileImage
        : (user.picture && user.picture.trim() !== '')
          ? user.picture
          : '';
      setUserAvatar(avatarToUse);
      console.log('Chat handler updated avatar:', {
        profileImage: user.profileImage,
        picture: user.picture,
        avatarToUse,
        hasProfileImage: !!(user.profileImage && user.profileImage.trim() !== '')
      });
    }
  }, [user]);

  // SECURITY FIX: Initialize counters only once and never allow them to decrease
  // This prevents users from bypassing limits by deleting messages
  useEffect(() => {
    if (!countersInitialized && messages.length > 0) {
      // Calculate initial values ONLY on first load
      const tokenSum = messages.reduce((sum, msg) => {
        if (msg.isBot && msg.tokenUsage) {
          return sum + (msg.tokenUsage.total_tokens || 0);
        }
        return sum;
      }, 0);
      
      // Count user messages (prompts)
      const promptCount = messages.filter(msg => !msg.isBot).length;
      
      setTotalTokenUsage(tokenSum);
      setTotalPrompts(promptCount);
      setCountersInitialized(true);
      
      console.log('🔒 SECURITY: Counters initialized once', {
        tokenSum,
        promptCount,
        sessionId: currentSessionId?.substring(0, 8) + '...'
      });
    }
  }, [messages, countersInitialized, currentSessionId]);

  const handleMessageUpdate = useCallback((updatedMessages) => {
    setMessages(updatedMessages);
    // Force scroll to bottom after a small delay to ensure messages are rendered
    setTimeout(() => {
      const simplebarEl = document.querySelector('.simplebar-content-wrapper');
      if (simplebarEl) {
        simplebarEl.scrollTo({
          top: simplebarEl.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [setMessages]);

  // Modify handleNewMessage to use the username
  const handleNewMessage = useCallback(async (text, attachment = null) => {
    if (!userId || !text.trim() || !currentSessionId) {
      console.warn('Missing required parameters for handleNewMessage:', {
        userId: !!userId,
        text: !!text.trim(),
        currentSessionId: !!currentSessionId
      });
      return;
    }

    // Check if we've reached the maximum prompts limit
    const maxPromptsLimit = aiPreferences?.numPrompts || 5;
    if (totalPrompts >= maxPromptsLimit) {
      const systemMessage = {
        id: `system-${Date.now()}`,
        isBot: true,
        message: `I apologize, but you've reached the maximum number of prompts (${maxPromptsLimit}) for this session.`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, systemMessage]);
      return;
    }

    // SECURITY FIX: Increment prompt count for the new user message
    // This should NEVER be decremented when messages are deleted
    setTotalPrompts(prevCount => {
      const newCount = prevCount + 1;
      console.log('🔒 SECURITY: Prompt counter incremented', {
        previous: prevCount,
        new: newCount,
        sessionId: currentSessionId?.substring(0, 8) + '...'
      });
      return newCount;
    });
    
    const messageId = `${Date.now()}-${Math.random()}`;
    
    try {
      setIsGenerating(true);

      // Update user message to use the fetched username and avatar
      const userMessage = {
        id: `temp-user-${messageId}`,
        isBot: false,
        avatar: userAvatar, // Use the fetched user avatar here
        name: username, // Use the fetched username here
        message: text.trim(),
        suggestions: [],
        attachments: attachment ? [{
          name: attachment.name,
          content: attachment.content
        }] : [],
        timestamp: new Date().toISOString()
      };

      // Check if the message is asking about a document in lecture materials
      const documentMentioned = findMentionedDocument(text, lectureMaterials);
      
      // Format conversation history for the AI (limit to last 6 messages for speed)
      const recentMessages = messages.slice(-6);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.attachments && msg.attachments.length > 0 
          ? `${msg.message}\n\nAttached document content:\n${msg.attachments[0].content}`
          : msg.message
      }));
      
      // Determine what to send as the prompt
      let promptToSend = text.trim();
      let attachmentsToSend = attachment ? [attachment] : [];
      
      // If there's an uploaded attachment, use optimized processing
      if (attachment) {
        // Don't concatenate the entire content - let the AI proxy handle it intelligently
        const contentLength = attachment.content?.length || 0;
        console.log(`📄 Processing attachment: ${attachment.name} (${contentLength} characters)`);
        
        if (contentLength > 20000) {
          promptToSend = `${text.trim()}\n\n[Large document attached: ${attachment.name} - ${Math.floor(contentLength/1000)}KB. Processing with intelligent content optimization.]`;
        } else {
          promptToSend = `${text.trim()}\n\n[Document attached: ${attachment.name} for analysis]`;
        }
      } 
      // If user is asking about a lecture document and no attachment was uploaded
      else if (documentMentioned) {
        const contentLength = documentMentioned.content?.length || 0;
        console.log(`📚 Processing lecture document: ${documentMentioned.title} (${contentLength} characters)`);
        
        if (contentLength > 20000) {
          promptToSend = `${text.trim()}\n\n[Large lecture document referenced: ${documentMentioned.title} - ${Math.floor(contentLength/1000)}KB. Processing with intelligent content optimization.]`;
        } else {
          promptToSend = `${text.trim()}\n\n[Lecture document referenced: ${documentMentioned.title}]`;
        }
        
        // Create a virtual attachment from lecture material
        attachmentsToSend = [{
          name: documentMentioned.title,
          content: documentMentioned.content,
          type: documentMentioned.fileType || 'text/plain'
        }];
      }

      console.log('Generating AI response optimized for speed:', {
        promptLength: promptToSend.length,
        attachmentsCount: attachmentsToSend.length,
        conversationHistoryLength: conversationHistory.length,
        totalPrompts,
        hasAIPreferences: !!aiPreferences
      });

      handleMessageUpdate([...messages, userMessage]);

      // Parallel execution: Save user message AND start AI generation simultaneously
      const [savedUserMessage, aiResult] = await Promise.allSettled([
        // Save user message to database
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            sessionId: currentSessionId,
            message: userMessage
          })
        }).then(async (userRes) => {
          if (!userRes.ok) {
            const errorText = await userRes.text();
            console.error('❌ Failed to save user message:', {
              status: userRes.status,
              statusText: userRes.statusText,
              error: errorText
            });
            throw new Error(`Failed to save user message: ${userRes.status} - ${errorText}`);
          }
          const result = await userRes.json();
          console.log('✅ User message saved successfully:', {
            messageId: result._id?.substring(0, 8) + '...'
          });
          return result;
        }),
        
        // Generate AI response in parallel
        generateAIResponse(
          promptToSend,
          attachmentsToSend,
          conversationHistory,
          aiPreferences,
          totalPrompts
        )
      ]);

      // Handle user message save result
      if (savedUserMessage.status === 'fulfilled') {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, _id: savedUserMessage.value._id } : msg
        ));
        console.log('✅ User message updated with database ID');
      } else {
        console.error('❌ Failed to save user message:', savedUserMessage.reason);
        toast.error('User message displayed but not saved to database: ' + savedUserMessage.reason.message);
      }

      // Handle AI response result
      let aiResponse, messageTokenUsage;
      if (aiResult.status === 'fulfilled') {
        // Define quality context first for processing decisions
        const qualityContext = {
          hasDocument: attachmentsToSend.length > 0,
          isMathOrScience: /math|science|equation|formula|calculate|solve/i.test(text),
          isGreeting: /hello|hi|hey|greetings/i.test(text.toLowerCase())
        };
        
        // Process and enhance the AI response for better formatting
        let rawResponse = aiResult.value.response;
        
        // Apply comprehensive response processing
        aiResponse = processAIResponse(rawResponse);
        
        // If the response contains code, enhance it further
        if (aiResponse.includes('```') || /\bcode\b|\bfunction\b|\bvariable\b|\balgorithm\b/i.test(text)) {
          aiResponse = enhanceCodeExamples(aiResponse);
        }
        
        messageTokenUsage = aiResult.value.tokenUsage;
        
        console.log('✨ Response processed and enhanced:', {
          originalLength: rawResponse.length,
          enhancedLength: aiResponse.length,
          hasCodeBlocks: aiResponse.includes('```'),
          responseType: qualityContext.isMathOrScience ? 'technical' : qualityContext.isGreeting ? 'greeting' : 'general'
        });
        
        const qualityAnalysis = logQualityMetrics(aiResponse, qualityContext, currentSessionId);
        
        // If quality is poor, log additional details for debugging
        if (qualityAnalysis.score < 50) {
          console.warn('🚨 Poor quality response detected:', {
            score: qualityAnalysis.score,
            issues: qualityAnalysis.issues,
            promptLength: text.length,
            attachments: attachmentsToSend.length,
            tokenUsage: messageTokenUsage
          });
        }
        
        // If this is a fallback response, inform the user subtly
        if (aiResult.value.fallback) {
          aiResponse += "\n\n*Note: Response generated using fallback system due to temporary service issues.*";
        }
      } else {
        console.error('AI response generation failed:', aiResult.reason);
        
        // Create a more user-friendly error message based on error type
        let errorMsg = `Hello! I'm BELTO AI, your educational assistant. I encountered an issue while generating my response, but I'm here to help you with your academic tasks and educational activities.`;
        const errorMessage = aiResult.reason.message || '';
        
        if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
          errorMsg = `🔧 Hello! I'm BELTO AI, your educational assistant. My services are temporarily experiencing high demand, but I'm designed specifically to help students with their academic needs. Our team is working to restore full capacity. Please try again in a moment!`;
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
          errorMsg = `⏱️ Hello! I'm BELTO AI, your educational assistant. I'm taking longer than expected to process your request due to high system load. I'm designed to support your learning journey, so please try again with your academic question!`;
        } else if (errorMessage.includes('Could not connect')) {
          errorMsg = `🌐 Hello! I'm BELTO AI, your educational assistant. I'm having trouble connecting to my processing systems right now. As your dedicated academic support assistant, I'm committed to helping you with your studies. Please check your connection and try again!`;
        } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          errorMsg = `🔑 Hello! I'm BELTO AI, your educational assistant. There's a temporary authentication issue with my services. I'm designed to help students with their academic tasks, so please refresh the page or contact support if this persists.`;
        } else {
          errorMsg = `❌ Hello! I'm BELTO AI, your educational assistant. I encountered an unexpected error while processing your request. I'm specifically designed to help students with academic tasks and educational activities, so please try rephrasing your question.`;
        }
        
        // Add a helpful educational suggestion
        errorMsg += `\n\n💡 **Academic Support Tip**: Try asking me specific questions about your studies, coursework, or educational materials. I'm here to support your learning journey!`;
        
        aiResponse = errorMsg;
        messageTokenUsage = { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 };
      }

      const botMessage = {
        id: `temp-bot-${messageId}`,
        isBot: true,
        avatar: '/logo.png',
        name: 'BELTO',
        message: aiResponse,
        suggestions: [],
        attachments: [],
        timestamp: new Date().toISOString(),
        tokenUsage: messageTokenUsage
      };

      // Check if we would exceed token limit with this message
      const tokenLimit = aiPreferences?.maxTokens || 2000;
      const newTotalTokens = totalTokenUsage + (messageTokenUsage?.total_tokens || 0);
      
      if (newTotalTokens > tokenLimit) {
        // We've exceeded the token limit
        const limitMessage = {
          id: `limit-${Date.now()}`,
          isBot: true,
          message: `I apologize, but you've reached the maximum token usage limit (${tokenLimit}) for this session.`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prevMessages => [...prevMessages, limitMessage]);
      } else {
        // SECURITY FIX: Add bot message and update total token usage (only increment, never decrement)
        setTotalTokenUsage(prevTotal => {
          const newTotal = prevTotal + (messageTokenUsage?.total_tokens || 0);
          console.log('🔒 SECURITY: Token usage incremented', {
            previousTotal: prevTotal,
            messageTokens: messageTokenUsage?.total_tokens || 0,
            newTotal: newTotal,
            sessionId: currentSessionId?.substring(0, 8) + '...'
          });
          return newTotal;
        });
        updateTokenUsage(messageTokenUsage);
        handleMessageUpdate([...messages, userMessage, botMessage]);

        console.log('💾 Saving bot message to database...', {
          messageLength: botMessage.message.length,
          hasTokenUsage: !!botMessage.tokenUsage,
          sessionId: currentSessionId?.substring(0, 8) + '...'
        });

        try {
          const botRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              userId,
              sessionId: currentSessionId,
              message: botMessage
            })
          });

          if (!botRes.ok) {
            const errorText = await botRes.text();
            console.error('❌ Failed to save bot message:', {
              status: botRes.status,
              statusText: botRes.statusText,
              error: errorText
            });
            throw new Error(`Failed to save bot message: ${botRes.status} - ${errorText}`);
          }

          const savedBotMessage = await botRes.json();
          console.log('✅ Bot message saved successfully:', {
            messageId: savedBotMessage._id?.substring(0, 8) + '...'
          });
          
          setMessages(prev => prev.map(msg => 
            msg.id === botMessage.id ? { ...msg, _id: savedBotMessage._id } : msg
          ));
        } catch (botSaveError) {
          console.error('💥 Error saving bot message:', botSaveError);
          // Don't fail the entire operation, but show a warning
          toast.error('Bot message displayed but not saved to database: ' + botSaveError.message);
        }
      }

      clearInputs();

    } catch (error) {
      console.error('Error handling message:', error);
      toast.error(error.message || 'Failed to process message');
    } finally {
      setIsGenerating(false);
    }
  }, [
    userId, 
    currentSessionId, 
    messages, 
    generateAIResponse, 
    handleMessageUpdate, 
    setIsGenerating, 
    updateTokenUsage, 
    clearInputs,
    username,
    userAvatar,
    aiPreferences, // Add to dependencies
    totalTokenUsage,
    totalPrompts,
    lectureMaterials, // Add this dependency
    setMessages
  ]);

  const handleDelete = useCallback(async (index) => {
    try {
      const messageToDelete = messages[index];
      if (!messageToDelete?._id || !currentSessionId) {
        console.error('Delete validation failed:', {
          hasMessageId: !!messageToDelete?._id,
          hasSessionId: !!currentSessionId,
          messageToDelete
        });
        throw new Error('Invalid message or session');
      }

      const loadingToast = toast.loading('Deleting message...');

      console.log('🗑️ Attempting to delete message:', {
        messageId: messageToDelete._id.substring(0, 8) + '...',
        sessionId: currentSessionId.substring(0, 8) + '...',
        messageType: messageToDelete.isBot ? 'bot' : 'user'
      });

      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          sessionId: currentSessionId,
          messageId: messageToDelete._id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to delete message: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Message deleted successfully:', result);

      // Remove the message(s) from UI but DO NOT rollback counters
      if (!messageToDelete.isBot && index + 1 < messages.length) {
        // User message with following bot response - remove both
        setMessages(prev => prev.filter((_, i) => i !== index && i !== index + 1));
      } else if (messageToDelete.isBot && index > 0) {
        // Bot message with preceding user message - remove both
        setMessages(prev => prev.filter((_, i) => i !== index && i !== index - 1));
      } else {
        // Single message - remove only this one
        setMessages(prev => prev.filter((_, i) => i !== index));
      }

      // CRITICAL SECURITY: Do NOT rollback token usage or prompt counters when deleting messages
      // This prevents exploitation of the prompt limit system by deleting messages
      // The counters should remain as they were to maintain usage integrity
      // Users cannot bypass limits by deleting previously submitted prompts
      
      console.log('🔒 SECURITY: Message deleted but counters preserved', {
        deletedMessageType: messageToDelete.isBot ? 'bot' : 'user',
        tokensRemainAt: totalTokenUsage,
        promptsRemainAt: totalPrompts,
        sessionId: currentSessionId?.substring(0, 8) + '...',
        securityNote: 'Counters intentionally NOT decremented to prevent limit bypass'
      });

      toast.dismiss(loadingToast);
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('💥 Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  }, [messages, currentSessionId, setMessages, userId]);

  return {
    handleNewMessage,
    handleDelete,
    handleMessageUpdate,
    totalTokenUsage,
    totalPrompts
  };
};

// Helper function to find mentioned documents in the message
const findMentionedDocument = (message, materials) => {
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return null;
  }
  
  // Convert message to lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();
  
  // Common action words that might indicate document operations
  const actionWords = [
    'summarize', 'analyze', 'read', 'process', 'explain', 'extract', 
    'review', 'check', 'examine', 'interpret', 'look at', 'open', 'show'
  ];
  
  // More specific document-related phrases
  const documentPhrases = [
    'the document', 'this document', 'the file', 'this file', 
    'the pdf', 'the docx', 'the text', 'the content'
  ];
  
  // Check if any document is mentioned by name
  for (const material of materials) {
    if (!material.title) continue;
    
    const documentName = material.title.toLowerCase();
    const fileExtension = documentName.split('.').pop();
    
    // Direct mention of document name or filename without extension
    const nameWithoutExtension = documentName.replace(`.${fileExtension}`, '');
    
    if (lowerMessage.includes(documentName) || 
        lowerMessage.includes(nameWithoutExtension)) {
      return material;
    }
    
    // Check for action words followed by document name
    for (const action of actionWords) {
      if (lowerMessage.includes(`${action} ${documentName}`) || 
          lowerMessage.includes(`${action} the ${fileExtension} file`) ||
          lowerMessage.includes(`${action} ${nameWithoutExtension}`)) {
        return material;
      }
    }
  }
  
  // If there's only one document and user mentions generic document terms
  if (materials.length === 1) {
    for (const phrase of documentPhrases) {
      if (lowerMessage.includes(phrase)) {
        return materials[0];
      }
    }
  }
  
  return null;
};