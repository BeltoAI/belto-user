"use client";

import { useCallback, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAIResponse } from './useAIResponse';

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
  const [username, setUsername] = useState('User');
  const [userAvatar, setUserAvatar] = useState('/user.png');
  const { generateAIResponse } = useAIResponse();

  // Track total token usage for the session
  const [totalTokenUsage, setTotalTokenUsage] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);

  // Add useEffect to fetch username and profile image when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const userData = await response.json();
        setUsername(userData.username || 'User');
        setUserAvatar(userData.profileImage || '/user.png');
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to defaults if fetch fails
        setUsername('User');
        setUserAvatar('/user.png');
      }
    };

    fetchUserData();
  }, []);

  // Calculate initial values when component mounts
  useEffect(() => {
    // Sum up token usage from existing messages
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
  }, [messages]);

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

    // Increment prompt count for the new user message
    setTotalPrompts(prevCount => prevCount + 1);
    
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
          if (!userRes.ok) throw new Error('Failed to save user message');
          return userRes.json();
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
      } else {
        console.error('Failed to save user message:', savedUserMessage.reason);
      }

      // Handle AI response result
      let aiResponse, messageTokenUsage;
      if (aiResult.status === 'fulfilled') {
        aiResponse = aiResult.value.response;
        messageTokenUsage = aiResult.value.tokenUsage;
        
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
        // Add bot message and update total token usage
        setTotalTokenUsage(newTotalTokens);
        updateTokenUsage(messageTokenUsage);
        handleMessageUpdate([...messages, userMessage, botMessage]);

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

        if (!botRes.ok) throw new Error('Failed to save bot message');

        const savedBotMessage = await botRes.json();
        setMessages(prev => prev.map(msg => 
          msg.id === botMessage.id ? { ...msg, _id: savedBotMessage._id } : msg
        ));
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
    aiPreferences, // Add to dependencies
    totalTokenUsage,
    totalPrompts,
    lectureMaterials // Add this dependency
  ]);

  const handleDelete = useCallback(async (index) => {
    try {
      const messageToDelete = messages[index];
      if (!messageToDelete?._id || !currentSessionId) {
        throw new Error('Invalid message or session');
      }

      const loadingToast = toast.loading('Deleting message...');

      const response = await fetch(
        `/api/chat/${messageToDelete._id}?sessionId=${currentSessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete message');

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

      // SECURITY FIX: Do NOT rollback token usage or prompt counters
      // This prevents exploitation of the prompt limit system by deleting messages
      // The counters should remain as they were to maintain usage integrity
      // Users cannot bypass limits by deleting previously submitted prompts

      toast.dismiss(loadingToast);
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  }, [messages, currentSessionId, setMessages]);

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