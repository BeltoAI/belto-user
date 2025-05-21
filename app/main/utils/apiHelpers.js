// API handling utilities

export const sendUserMessage = async (userId, sessionId, messagePayload) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      userId,
      sessionId,
      message: messagePayload
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }
  
  return response.json();
};

export const sendBotMessage = async (userId, sessionId, messagePayload) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      userId,
      sessionId,
      message: messagePayload
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send bot message');
  }
  
  return response.json();
};

export const checkAndApplySessionSettings = async (sessionId, userId, setCurrentLecture, setIsCopyPasteAllowed, userSettings) => {
  if (!sessionId || !userId) return;
  
  try {
    // First check if this session is related to a lecture
    const lectureResponse = await fetch(`/api/sessions/check-lecture?sessionId=${sessionId}`);
    
    if (!lectureResponse.ok) return;
    
    const lectureData = await lectureResponse.json();
    
    if (lectureData?.isLectureSession) {
      setCurrentLecture(lectureData.lecture);
      
      // Get class information for this lecture
      const classResponse = await fetch(`/api/classes/${lectureData.lecture.classId}`);
      
      if (classResponse.ok) {
        const classData = await classResponse.json();
        
        // Check if user is professor for this class
        const isProfessor = classData.professorId === userId;
        
        // Apply copy/paste settings based on user role and settings
        if (isProfessor) {
          // Professors can always copy/paste
          setIsCopyPasteAllowed(true);
        } else if (userSettings) {
          // For students, check professor's settings and any overrides
          const baseRestriction = classData.aiSettings?.copyPasteRestriction || false;
          const hasLectureOverride = userSettings.copyPasteLectureOverride;
          
          // If base restriction is false, copying is allowed
          // If base restriction is true but there's an override, check user's allowCopyPaste setting
          setIsCopyPasteAllowed(!baseRestriction || (hasLectureOverride && userSettings.allowCopyPaste));
        }
      }
    }
  } catch (error) {
    console.error('Error checking session type:', error);
  }
};