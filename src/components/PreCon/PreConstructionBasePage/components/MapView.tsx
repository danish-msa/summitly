import React from 'react';
import type { PropertyListing } from '@/lib/types';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import StaticPropertyMap from '@/features/map-search-v2/components/StaticPropertyMap';

type ViewMode = 'list' | 'mixed' | 'map';

interface MapViewProps {
  viewMode: ViewMode;
  mapProperties: PropertyListing[];
  selectedProperty: PropertyListing | null;
  selectedProject: PreConstructionProperty | null;
  onPropertySelect: (property: PropertyListing | null) => void;
  preConProjects: PreConstructionProperty[];
  onProjectSelect: (project: PreConstructionProperty) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  viewMode,
  mapProperties,
  selectedProperty,
  selectedProject: _selectedProject,
  onPropertySelect,
  preConProjects,
  onProjectSelect,
}) => {
  if (viewMode === 'list') return null;

  return (
    <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} 
         style={{ height: viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh' }}>
      <StaticPropertyMap
        properties={mapProperties}
        selectedProperty={selectedProperty}
        onPropertySelect={(property) => {
          if (property) {
            const project = preConProjects.find((p) => p.id === property.mlsNumber);
            if (project) onProjectSelect(project);
            onPropertySelect(property);
          } else {
            onPropertySelect(null);
          }
        }}
        initialZoom={12}
      />
    </div>
  );
};

