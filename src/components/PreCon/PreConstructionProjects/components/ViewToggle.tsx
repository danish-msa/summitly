import React from 'react';
import { FaMapMarkerAlt, FaList } from 'react-icons/fa';

type ViewMode = 'list' | 'split' | 'map';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex border rounded-md overflow-hidden">
      <button 
        onClick={() => onViewModeChange('list')}
        className={`px-3 py-2 ${viewMode === 'list' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
        aria-label="List view"
      >
        <FaList />
      </button>
      <button 
        onClick={() => onViewModeChange('split')}
        className={`px-3 py-2 ${viewMode === 'split' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
        aria-label="Split view"
      >
        <div className="flex gap-1">
          <FaList className="w-3" />
          <FaMapMarkerAlt className="w-3" />
        </div>
      </button>
      <button 
        onClick={() => onViewModeChange('map')}
        className={`px-3 py-2 ${viewMode === 'map' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
        aria-label="Map view"
      >
        <FaMapMarkerAlt />
      </button>
    </div>
  );
};

export default ViewToggle;

