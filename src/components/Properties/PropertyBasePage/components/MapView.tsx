import React from 'react';
import dynamic from 'next/dynamic';
import type { PropertyListing } from '@/lib/types';

type ViewMode = 'list' | 'mixed' | 'map';

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

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
      <GooglePropertyMap
        properties={mapProperties}
        selectedProperty={selectedProperty}
        onPropertySelect={onPropertySelect}
        onBoundsChange={() => {}}
      />
    </div>
  );
};

