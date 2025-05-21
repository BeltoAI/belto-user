import React, { useState, useEffect } from 'react';

const CursorOverlay = ({ editorRef, cursors, userColors }) => {
  const [cursorElements, setCursorElements] = useState([]);

  useEffect(() => {
    if (!editorRef?.current || !cursors || Object.keys(cursors).length === 0) return;
    
    const editor = editorRef.current.editor;
    if (!editor) return;

    // Clear existing cursor elements
    const existingCursors = document.querySelectorAll('.remote-cursor');
    existingCursors.forEach(el => el.remove());

    // Add new cursor elements
    const editorRect = editor.getBoundingClientRect();
    const newCursors = [];

    Object.entries(cursors).forEach(([userEmail, position]) => {
      if (!position) return;
      
      // Create cursor element
      const cursorEl = document.createElement('div');
      cursorEl.className = 'remote-cursor';
      cursorEl.style.position = 'absolute';
      cursorEl.style.pointerEvents = 'none';
      cursorEl.style.zIndex = '1000';
      cursorEl.style.width = '2px';
      cursorEl.style.height = '16px';
      cursorEl.style.backgroundColor = userColors[userEmail] || '#FF5733';
      
      // Add flag with user email
      const flag = document.createElement('div');
      flag.className = 'cursor-flag';
      flag.style.position = 'absolute';
      flag.style.top = '-16px';
      flag.style.left = '0';
      flag.style.backgroundColor = userColors[userEmail] || '#FF5733';
      flag.style.color = '#fff';
      flag.style.padding = '2px 4px';
      flag.style.borderRadius = '2px';
      flag.style.fontSize = '10px';
      flag.style.whiteSpace = 'nowrap';
      flag.textContent = userEmail;
      
      cursorEl.appendChild(flag);
      
      // Position cursor based on provided coordinates
      cursorEl.style.left = `${position.x}px`;
      cursorEl.style.top = `${position.y}px`;
      
      // Append to editor
      editor.parentNode.appendChild(cursorEl);
      newCursors.push(cursorEl);
    });

    setCursorElements(newCursors);

    // Cleanup on unmount
    return () => {
      newCursors.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [editorRef, cursors, userColors]);

  return null; // This component doesn't render any visible React elements
};

export default CursorOverlay;