"use client";

import React from 'react';

export const BackgroundEffects: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div 
        className="absolute bottom-1/4 -right-32 w-80 h-80 bg-magenta/20 rounded-full blur-[100px] animate-pulse-slow" 
        style={{ animationDelay: '2s' }} 
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] animate-pulse-slow" 
        style={{ animationDelay: '1s' }} 
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles with brand colors */}
      <div 
        className="absolute top-20 left-[20%] w-2 h-2 bg-cyan/60 rounded-full animate-float" 
        style={{ animationDelay: '0s' }} 
      />
      <div 
        className="absolute top-40 right-[30%] w-1.5 h-1.5 bg-magenta/50 rounded-full animate-float" 
        style={{ animationDelay: '1s' }} 
      />
      <div 
        className="absolute bottom-32 left-[40%] w-2.5 h-2.5 bg-accent/50 rounded-full animate-float" 
        style={{ animationDelay: '2s' }} 
      />
      <div 
        className="absolute top-60 right-[15%] w-1 h-1 bg-cyan/70 rounded-full animate-float" 
        style={{ animationDelay: '0.5s' }} 
      />
      <div 
        className="absolute bottom-48 right-[25%] w-2 h-2 bg-magenta/45 rounded-full animate-float" 
        style={{ animationDelay: '1.5s' }} 
      />
    </div>
  );
};

