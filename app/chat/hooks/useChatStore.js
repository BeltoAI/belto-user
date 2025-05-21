"use client";
import { useState, useEffect } from 'react';

export const useLectureContext = (lectureId, currentSessionId) => {
  const [lectureMaterials, setLectureMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    const fetchLectureMaterials = async () => {
      if (!lectureId || !currentSessionId) return;
      
      try {
        setIsLoadingMaterials(true);
        
        const response = await fetch(`/api/lectures/${lectureId}`);
        
        if (!response.ok) throw new Error('Failed to fetch lecture materials');
        
        const data = await response.json();
        
        if (data.materials && Array.isArray(data.materials)) {
          setLectureMaterials(data.materials);
          console.log('Lecture materials loaded:', data.materials.length);
        }
      } catch (error) {
        console.error('Error fetching lecture materials:', error);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchLectureMaterials();
  }, [lectureId, currentSessionId]);

  return { lectureMaterials, isLoadingMaterials };
};