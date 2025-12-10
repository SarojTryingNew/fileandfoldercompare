import React, { useState, useEffect } from 'react';
import './LoadingTimer.css';

function LoadingTimer({ isLoading, message = 'Loading' }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isLoading) return null;

  return (
    <div className="loading-timer-overlay">
      <div className="loading-timer-container">
        <div className="loading-spinner"></div>
        <div className="loading-message">{message}</div>
        <div className="digital-clock">
          <div className="clock-display">{formatTime(elapsedTime)}</div>
          <div className="clock-label">Elapsed Time</div>
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default LoadingTimer;
