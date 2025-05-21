import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const CollaborativeDocumentStatus = ({ documentId }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [userColors, setUserColors] = useState({});

  // Generate a random color for each user
  const generateRandomColor = () => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
      '#33A8FF', '#A833FF', '#FF8C33', '#8CFF33'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Assign a color to a user if they don't already have one
  const getColorForUser = (email) => {
    if (!userColors[email]) {
      const newColors = {...userColors};
      newColors[email] = generateRandomColor();
      setUserColors(newColors);
      return newColors[email];
    }
    return userColors[email];
  };

  useEffect(() => {
    // Initial colors will be set when activeUsers are updated from SSE events
  }, []);

  // activeUsers will be updated via the parent component that receives SSE messages
  useEffect(() => {
    // This effect runs when activeUsers prop changes
    const newColors = {...userColors};
    activeUsers.forEach(user => {
      if (!newColors[user.email]) {
        newColors[user.email] = generateRandomColor();
      }
    });
    setUserColors(newColors);
  }, [activeUsers]);

  if (!documentId || activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#262626] p-3 rounded-lg shadow-md z-50">
      <h3 className="text-white text-sm font-semibold mb-2">Active Users</h3>
      <div className="flex flex-col space-y-2 max-h-32 overflow-y-auto">
        {activeUsers.map(user => (
          <div key={user.email} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getColorForUser(user.email) }}
            ></div>
            <span className="text-xs text-gray-300">{user.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborativeDocumentStatus;