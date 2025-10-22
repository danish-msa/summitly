"use client";

import React from 'react';

interface GoogleMapsLoadingProps {
  message?: string;
}

const GoogleMapsLoading: React.FC<GoogleMapsLoadingProps> = ({ 
  message = 'Loading Google Maps...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
      {/* Modern Google Maps themed loading */}
      <div className="relative mb-6">
        {/* Map-like grid background */}
        <div className="absolute inset-0 w-20 h-20 opacity-5 animate-map-grid">
          <div className="grid grid-cols-4 grid-rows-4 h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* Main spinner with enhanced animations */}
        <div className="relative w-20 h-20">
          {/* Outer ring - represents map boundaries */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full animate-spin-slow"></div>
          
          {/* Middle ring - represents zoom levels */}
          <div className="absolute inset-2 border-3 border-gray-300 rounded-full animate-spin-reverse"></div>
          
          {/* Inner ring - represents location pin */}
          <div className="absolute inset-4 border-2 border-secondary rounded-full animate-spin animate-pulse-glow"></div>
          
          {/* Center pin with enhanced animation */}
          <div className="absolute top-1/2 left-1/2 animate-location-pin">
            <div className="w-4 h-4 bg-secondary rounded-full shadow-lg animate-pulse-glow"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Loading text with modern styling */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 animate-fade-in">
          {message}
        </h3>
        <p className="text-sm text-gray-600 mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Preparing location services...
        </p>
        
        {/* Enhanced progress indicator */}
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-secondary via-blue-500 to-secondary rounded-full animate-progress-fill"></div>
        </div>
        
        {/* Animated features list with staggered animation */}
        <div className="mt-4 space-y-2 text-xs text-gray-500">
          <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
            <span className="font-medium">Location detection</span>
          </div>
          <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Map rendering</span>
          </div>
          <div className="flex items-center justify-center space-x-2 animate-fade-in" style={{ animationDelay: '1.5s' }}>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Search integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsLoading;
