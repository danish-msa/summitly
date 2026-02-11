import React from 'react';
import { LayoutGrid, MapPin } from 'lucide-react';

type ViewMode = 'list' | 'mixed' | 'map';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  propertyCount: number;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ 
  viewMode, 
  setViewMode, 
  propertyCount 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-4">
        <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">
          Properties {propertyCount}
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Sort by Date (Newest)
        </div>
        <div className="flex">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-l-lg ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white text-gray-700 hover:bg-brand-tide'
            }`}
            title="List View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs font-medium">List</span>
          </button>
          <button
            onClick={() => setViewMode('mixed')}
            className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all ${
              viewMode === 'mixed'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white text-gray-700 hover:bg-brand-tide'
            }`}
            title="Mixed View"
          >
            <div className="flex gap-0.5 items-center">
              <LayoutGrid className="w-3 h-3" />
              <MapPin className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium">Mixed</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-r-lg ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white text-gray-700 hover:bg-brand-tide'
            }`}
            title="Map View"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

