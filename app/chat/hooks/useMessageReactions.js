import { useState, useEffect } from 'react';

export const useMessageReactions = (userId, sessionId, studentId = null) => {
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingReactions, setPendingReactions] = useState(new Set()); // Track pending API calls

  // Fetch reactions when component mounts or when userId/sessionId change
  useEffect(() => {
    const fetchReactions = async () => {
      if (!userId || !sessionId) return;
      
      setLoading(true);
      try {
        let url = `/api/message-reactions?userId=${userId}&sessionId=${sessionId}`;
        if (studentId) {
          url += `&studentId=${studentId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reactions');
        }
        
        const data = await response.json();
        setReactions(data.reactions || {});
      } catch (err) {
        console.error('Error fetching reactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();
  }, [userId, sessionId, studentId]);

  // Toggle like for a message with optimistic updates
  const toggleLike = async (messageId) => {
    if (!userId || !sessionId || !messageId) return;
    
    // Prevent multiple clicks on the same message
    if (pendingReactions.has(messageId)) return;
    
    // Add to pending reactions
    setPendingReactions(prev => new Set(prev).add(messageId));
    
    // Optimistic update - immediately update UI
    const currentReaction = reactions[messageId];
    const newReaction = currentReaction === 'like' ? null : 'like';
    
    setReactions(prevReactions => {
      const newReactions = { ...prevReactions };
      if (newReaction === null) {
        delete newReactions[messageId];
      } else {
        newReactions[messageId] = newReaction;
      }
      return newReactions;
    });
    
    try {
      const payload = {
        userId,
        sessionId,
        messageId,
        reactionType: 'like'
      };
      
      // Include studentId if available
      if (studentId) {
        payload.studentId = studentId;
      }
      
      const response = await fetch('/api/message-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }
      
      const data = await response.json();
      
      // Sync with server response (in case server state differs)
      setReactions(prevReactions => {
        const newReactions = { ...prevReactions };
        
        if (data.action === 'removed') {
          delete newReactions[messageId];
        } else {
          newReactions[messageId] = 'like';
        }
        
        return newReactions;
      });
      
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err.message);
      
      // Revert optimistic update on error
      setReactions(prevReactions => {
        const newReactions = { ...prevReactions };
        if (currentReaction === null) {
          delete newReactions[messageId];
        } else {
          newReactions[messageId] = currentReaction;
        }
        return newReactions;
      });
    } finally {
      // Remove from pending reactions
      setPendingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  // Toggle dislike for a message with optimistic updates
  const toggleDislike = async (messageId) => {
    if (!userId || !sessionId || !messageId) return;
    
    // Prevent multiple clicks on the same message
    if (pendingReactions.has(messageId)) return;
    
    // Add to pending reactions
    setPendingReactions(prev => new Set(prev).add(messageId));
    
    // Optimistic update - immediately update UI
    const currentReaction = reactions[messageId];
    const newReaction = currentReaction === 'dislike' ? null : 'dislike';
    
    setReactions(prevReactions => {
      const newReactions = { ...prevReactions };
      if (newReaction === null) {
        delete newReactions[messageId];
      } else {
        newReactions[messageId] = newReaction;
      }
      return newReactions;
    });
    
    try {
      const payload = {
        userId,
        sessionId,
        messageId,
        reactionType: 'dislike'
      };
      
      // Include studentId if available
      if (studentId) {
        payload.studentId = studentId;
      }
      
      const response = await fetch('/api/message-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }
      
      const data = await response.json();
      
      // Sync with server response (in case server state differs)
      setReactions(prevReactions => {
        const newReactions = { ...prevReactions };
        
        if (data.action === 'removed') {
          delete newReactions[messageId];
        } else {
          newReactions[messageId] = 'dislike';
        }
        
        return newReactions;
      });
      
    } catch (err) {
      console.error('Error toggling dislike:', err);
      setError(err.message);
      
      // Revert optimistic update on error
      setReactions(prevReactions => {
        const newReactions = { ...prevReactions };
        if (currentReaction === null) {
          delete newReactions[messageId];
        } else {
          newReactions[messageId] = currentReaction;
        }
        return newReactions;
      });
    } finally {
      // Remove from pending reactions
      setPendingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  return {
    reactions,
    loading,
    error,
    toggleLike,
    toggleDislike,
    isPending: (messageId) => pendingReactions.has(messageId) // Helper to check if reaction is pending
  };
};