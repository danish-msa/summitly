"use client";

import React from 'react';

interface CompactLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showMessage?: boolean;
}

const CompactLoading: React.FC<CompactLoadingProps> = ({ 
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
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-3">
        {/* Compact spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full animate-spin-slow`}></div>
          
          {/* Inner ring with brand color */}
          <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-2 border-transparent border-t-secondary rounded-full animate-spin`} 
               style={{ animationDuration: '1s' }}></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-secondary rounded-full animate-pulse"></div>
        </div>
        
        {/* Compact message */}
        {showMessage && (
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 animate-fade-in">
              {message}
            </p>
            {/* Animated dots */}
            <div className="flex justify-center mt-1 space-x-1">
              <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactLoading;
