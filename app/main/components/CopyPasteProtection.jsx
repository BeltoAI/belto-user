import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CopyPasteProtection = ({ lectureId, children }) => {
  const [copyPasteAllowed, setCopyPasteAllowed] = useState(true);

  useEffect(() => {
    if (!lectureId) {
      setCopyPasteAllowed(true);
      return;
    }

    const fetchCopyPasteStatus = async () => {
      try {
        const response = await axios.get(`/api/settings/copy-paste-status?lectureId=${lectureId}`);
        setCopyPasteAllowed(response.data.isCopyPasteAllowed);
      } catch (error) {
        console.error('Error fetching copy/paste settings:', error);
        setCopyPasteAllowed(true);
      }
    };

    fetchCopyPasteStatus();
  }, [lectureId]);

  useEffect(() => {
    if (copyPasteAllowed) return;

    const handleCopyPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners for the entire document
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    // Clean up
    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [copyPasteAllowed]);

  return <>{children}</>;
};

export default CopyPasteProtection;