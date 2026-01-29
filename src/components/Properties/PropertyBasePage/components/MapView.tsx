import React from 'react';
import type { PropertyListing } from '@/lib/types';
import StaticPropertyMap from '@/features/map-search-v2/components/StaticPropertyMap';

type ViewMode = 'list' | 'mixed' | 'map';

interface MapViewProps {
  viewMode: ViewMode;
  mapProperties: PropertyListing[];
  selectedProperty: PropertyListing | null;
  onPropertySelect: (property: PropertyListing | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  viewMode,
  mapProperties,
  selectedProperty,
  onPropertySelect,
}) => {
  if (viewMode === 'list') return null;

  return (
    <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} 
         style={{ height: viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh' }}>
      <StaticPropertyMap
        properties={mapProperties}
        selectedProperty={selectedProperty}
        onPropertySelect={onPropertySelect}
        initialZoom={12}
      />
    </div>
  );
};

