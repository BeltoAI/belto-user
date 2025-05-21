import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export function useAIPreferences(lectureId) {
  const [aiPreferences, setAiPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAIPreferences = async () => {
      if (!lectureId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/lectures/${lectureId}/preferences`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch AI preferences');
        }
        
        const data = await response.json();
        setAiPreferences(data);
      } catch (err) {
        console.error('Error fetching AI preferences:', err);
        setError(err.message);
        toast.error('Failed to load AI settings for this lecture');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIPreferences();
  }, [lectureId]);

  return { aiPreferences, isLoading, error };
}