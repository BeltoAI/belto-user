// store/chatStore.js
import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  messages: [],
  flaggedContent: [],
  isLoading: true,
  isGenerating: false,
  currentInput: '',
  currentAttachment: null, // Changed from currentAttachments array
  likedMessages: {},
  dislikedMessages: {},
  userId: '',
  currentSessionId: null,
  initialMessageProcessed: false,
  processedMessageIds: new Set(),
  processingQueue: new Set(),
  isMessageSending: false,
  isNavigating: false,
  processingMessage: false,
  sessionCache: {}, // Add session cache for performance

  // Add these new state properties
  tokenUsage: {
    sessionTotalTokens: 0,
    lastMessageUsage: null,
    promptCount: 0
  },

  // Setters
  setMessages: (newMessages) => set(state => {
    if (typeof newMessages === 'function') {
      // Handle function updates
      const updatedMessages = newMessages(state.messages || []);
      return { messages: updatedMessages };
    }
    
    // Handle direct array updates
    if (Array.isArray(newMessages)) {
      return { messages: newMessages };
    }
    
    return { messages: [] };
  }),
  setFlaggedContent: (flaggedContent) => set({ flaggedContent }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setCurrentInput: (currentInput) => set({ currentInput }),
  setCurrentAttachment: (attachment) => set({ currentAttachment: attachment }), // Changed from setCurrentAttachments
  setLikedMessages: (likedMessages) => set({ likedMessages }),
  setDislikedMessages: (dislikedMessages) => set({ dislikedMessages }),
  setUserId: (userId) => set({ userId }),
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  setInitialMessageProcessed: (initialMessageProcessed) => set({ initialMessageProcessed }),
  setMessageSending: (isMessageSending) => set({ isMessageSending }),
  setNavigating: (isNavigating) => set({ isNavigating }),
  setProcessingMessage: (processingMessage) => set({ processingMessage }),

  // Actions
  addMessage: (message) => set(state => {
    const currentMessages = Array.isArray(state.messages) ? state.messages : [];
    if (Array.isArray(message)) {
      return { messages: [...message] };
    }
    return { messages: [...currentMessages, message] };
  }),

  removeMessage: (index) => set(state => {
    const messages = [...state.messages];
    const messageToDelete = messages[index];

    if (!messageToDelete.isBot && index + 1 < messages.length) {
      // Remove user message and AI response
      messages.splice(index, 2);
    } else if (messageToDelete.isBot && index > 0) {
      // Remove AI response and user message
      messages.splice(index - 1, 2);
    } else {
      // Remove single message
      messages.splice(index, 1);
    }

    return { messages };
  }),

  toggleLike: (index) => {
    const { likedMessages, dislikedMessages } = get();
    set({
      likedMessages: { ...likedMessages, [index]: !likedMessages[index] },
      dislikedMessages: { ...dislikedMessages, [index]: false },
    });
  },

  toggleDislike: (index) => {
    const { likedMessages, dislikedMessages } = get();
    set({
      dislikedMessages: { ...dislikedMessages, [index]: !dislikedMessages[index] },
      likedMessages: { ...likedMessages, [index]: false },
    });
  },

  clearInputs: () => {
    set({
      currentInput: '',
      currentAttachment: null,
    });
  },

  resetChat: () => {
    set({
      messages: [],
      currentInput: '',
      currentAttachment: null,
      initialMessageProcessed: false,
      processedMessageIds: new Set(),
      processingQueue: new Set()
    });
  },

  // Clear session cache for performance
  clearSessionCache: () => {
    set({ sessionCache: {} });
  },

  // Clear specific session from cache
  clearSessionFromCache: (sessionId) => {
    set(state => {
      const newCache = { ...state.sessionCache };
      delete newCache[sessionId];
      return { sessionCache: newCache };
    });
  },

  // Chat session management
  createNewSession: async (userId) => {
    try {
      const response = await fetch('/api/chats/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const session = await response.json();
      console.log('Created session:', session);
      
      set({ currentSessionId: session._id });
      return session;
    } catch (error) {
      console.error('Failed to create new session:', error);
      return null;
    }
  },

  // Fetch chat history with performance optimizations
  fetchChatHistory: async () => {
    const userId = get().userId;
    const sessionId = get().currentSessionId;

    if (!userId || !sessionId) {
      console.error('Missing userId or sessionId');
      return [];
    }

    try {
      // Check if we already have cached data for this session
      const cachedMessages = get().sessionCache?.[sessionId];
      if (cachedMessages && cachedMessages.length > 0) {
        console.log('Using cached chat history for session:', sessionId);
        set({ messages: cachedMessages });
        return cachedMessages;
      }

      const response = await fetch(`/api/chat?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }

      const data = await response.json();
      const messages = data.messages || [];
      
      console.log('Loaded chat history:', messages); // Debug log
      
      // Cache the messages for this session
      set(state => ({
        messages,
        sessionCache: {
          ...state.sessionCache,
          [sessionId]: messages
        }
      }));
      
      return messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      set({ messages: [] });
      return [];
    }
  },

  loadSession: async (sessionId) => {
    const userId = get().userId;
    
    if (!userId) {
      try {
        const response = await fetch('/api/auth/user', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const userData = await response.json();
        set({ userId: userData._id }); // Set the userId in the store
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw new Error('No userId available');
      }
    }

    try {
      set({ 
        currentSessionId: sessionId,
        isLoading: true,
        messages: []
      });
      
      await get().fetchChatHistory();
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Failed to load session:', error);
      set({ isLoading: false });
      return false;
    }
  },

  // Save message to database
  saveMessage: async (message) => {
    const { userId, currentSessionId } = get();
    if (!userId || !currentSessionId) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          sessionId: currentSessionId,
          message,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  },

  // Delete message from database
  deleteMessage: async (messageId) => {
    const { userId, currentSessionId } = get();
    if (!userId || !currentSessionId) return;

    try {
      const response = await fetch(`/api/chat`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          sessionId: currentSessionId,
          messageId,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  },

  addToProcessedMessages: (messageId) => {
    const processedMessageIds = get().processedMessageIds;
    processedMessageIds.add(messageId);
    set({ processedMessageIds });
  },

  isMessageProcessed: (messageId) => {
    return get().processedMessageIds.has(messageId);
  },

  addToProcessingQueue: (messageId) => {
    const processingQueue = get().processingQueue;
    processingQueue.add(messageId);
    set({ processingQueue });
  },

  removeFromProcessingQueue: (messageId) => {
    const processingQueue = get().processingQueue;
    processingQueue.delete(messageId);
    set({ processingQueue });
  },

  // Add these new actions
  updateTokenUsage: (usage) => set(state => ({
    tokenUsage: {
      sessionTotalTokens: state.tokenUsage.sessionTotalTokens + usage.total_tokens,
      lastMessageUsage: usage,
      promptCount: state.tokenUsage.promptCount + 1
    }
  })),

  resetTokenUsage: () => set({
    tokenUsage: {
      sessionTotalTokens: 0,
      lastMessageUsage: null,
      promptCount: 0
    }
  }),

  // Add these new actions
  removeAttachment: (index) => set((state) => ({
    currentAttachments: state.currentAttachments.filter((_, i) => i !== index)
  })),

  // Add new actions for session management
  checkExistingSessions: async (userId) => {
    try {
      const response = await fetch(`/api/chats/sessions?userId=${userId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Failed to check existing sessions:', error);
      return [];
    }
  },

  createLectureSession: async (userId, lectureId) => {
    try {
      const response = await fetch('/api/chats/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lectureId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Failed to create lecture session:', error);
      return null;
    }
  },

  // Update action to check for a session matching a lecture by filtering the fetched sessions:
  checkSessionForLecture: async (userId, lectureId) => {
    try {
      const response = await fetch(`/api/chats/sessions?userId=${userId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      // Filter sessions to find one with a matching lectureId property
      const session = data.sessions.find(s => s.lectureId === lectureId);
      return session || null;
    } catch (error) {
      console.error(`Failed to check session for lecture ${lectureId}:`, error);
      return null;
    }
  },

  // New actions for handling sessions
  createSessionForLecture: async (userId, lectureId, title) => {
    try {
      const response = await fetch('/api/chats/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          lectureId,
          title,
          type: 'lecture' // Add type to differentiate lecture sessions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create session' }));
        throw new Error(errorData.message || 'Failed to create session');
      }
      
      const data = await response.json();
      return data.session || data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  fetchUserSessions: async (userId) => {
    try {
      const response = await fetch(`/api/chats/sessions?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch sessions' }));
        throw new Error(errorData.message || 'Failed to fetch sessions');
      }
      
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  },
}));

export default useChatStore;