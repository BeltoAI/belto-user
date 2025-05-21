import { useState, useEffect } from 'react';

export const useLectureContext = (lectureId, sessionId) => {
  const [lectureMaterials, setLectureMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLectureMaterials = async () => {
      if (!lectureId) return;
      
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
    };

    fetchLectureMaterials();
  }, [lectureId]);

  return {
    lectureMaterials,
    isLoadingMaterials,
    error
  };
};