"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  currentView: 'public' | 'owner';
  onViewChange: (view: 'public' | 'owner') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center gap-2 mb-6 bg-white rounded-full p-1 shadow-sm">
      <button
        onClick={() => onViewChange('public')}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
          currentView === 'public'
            ? "bg-secondary text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        )}
      >
        Public view
      </button>
      <button
        onClick={() => onViewChange('owner')}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
          currentView === 'owner'
            ? "bg-secondary text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        )}
      >
        Owner View
      </button>
    </div>
  );
};

export default ViewToggle;
