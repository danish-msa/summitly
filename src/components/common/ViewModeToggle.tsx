import React from 'react';
import { LayoutGrid, List, Map } from 'lucide-react';

export type ViewMode = 'list' | 'mixed' | 'map';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ 
  viewMode, 
  setViewMode,
  className = ''
}) => {
  return (
    <div className={`flex items-end justify-end ${className}`}>
      <div className="flex items-center gap-0 border border-gray-300 rounded-lg bg-white p-1">
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'list'
              ? 'bg-secondary text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Grid View"
          aria-label="Grid View"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('mixed')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'mixed'
              ? 'bg-secondary text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="List View"
          aria-label="List View"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`p-2 rounded-md transition-all ${
            viewMode === 'map'
              ? 'bg-secondary text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Map View"
          aria-label="Map View"
        >
          <Map className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
