import React, { useState, useEffect } from 'react';
import { connectionService } from '../../services/connectionService';

const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(connectionService.online);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = connectionService.onStatusChange((online) => {
      setIsOnline(online);
      setShowStatus(true);
      
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    });

    return unsubscribe;
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300' : 'bg-red-300'}`} />
        <span className="text-sm font-medium">
          {isOnline ? 'Back online' : 'Working offline'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;