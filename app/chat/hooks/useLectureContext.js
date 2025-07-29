import { useState, useEffect, useRef } from 'react';

export const useLectureContext = (lectureId, sessionId) => {
  const [lectureMaterials, setLectureMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchLectureMaterials = async () => {
      if (!lectureId) return;
      
      // Clear any existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set a new debounce timer
      debounceRef.current = setTimeout(async () => {
        try {
          setIsLoadingMaterials(true);
          setError(null);
          
          const response = await fetch(`/api/chats/lecture-materials?lectureId=${lectureId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch lecture materials: ${response.status}`);
          }
          
          const data = await response.json();
          setLectureMaterials(data.materials || []);
        } catch (err) {
          console.error('Error fetching lecture materials:', err);
          setError(err.message);
        } finally {
          setIsLoadingMaterials(false);
        }
      }, 300); // 300ms debounce delay
    };

    fetchLectureMaterials();
    
    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [lectureId]);

  return {
    lectureMaterials,
    isLoadingMaterials,
    error
  };
};