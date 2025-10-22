"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showMessage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...', 
  showMessage = true 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Modern Spinner with Real Estate Theme */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}></div>
        
        {/* Inner ring with brand color */}
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-secondary rounded-full animate-spin`} 
             style={{ animationDuration: '1s' }}></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
      </div>
      
      {/* Loading message with modern typography */}
      {showMessage && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            {message}
          </p>
          {/* Animated dots */}
          <div className="flex justify-center mt-2 space-x-1">
            <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
