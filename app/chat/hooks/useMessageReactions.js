import { useState, useEffect } from 'react';

export const useMessageReactions = (userId, sessionId, studentId = null) => {
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Toggle like for a message
  const toggleLike = async (messageId) => {
    if (!userId || !sessionId || !messageId) return;
    
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
      
      // Update local state based on server response
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
    }
  };

  // Toggle dislike for a message
  const toggleDislike = async (messageId) => {
    if (!userId || !sessionId || !messageId) return;
    
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
      
      // Update local state based on server response
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
    }
  };

  return {
    reactions,
    loading,
    error,
    toggleLike,
    toggleDislike
  };
};