import React from 'react';
import dynamic from 'next/dynamic';
import { PropertyListing } from '@/lib/types';
import type { PreConstructionProperty } from '../../PropertyCards/types';

// Dynamically import the map component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

type ViewMode = 'list' | 'split' | 'map';

interface ProjectMapViewProps {
  mapProperties: PropertyListing[];
  selectedPropertyForMap: PropertyListing | null;
  visibleProjects: PreConstructionProperty[];
  viewMode: ViewMode;
  onProjectClick: (project: PreConstructionProperty) => void;
  onBoundsChange: (bounds: {north: number; south: number; east: number; west: number}) => void;
}

const ProjectMapView: React.FC<ProjectMapViewProps> = ({
  mapProperties,
  selectedPropertyForMap,
  visibleProjects,
  viewMode,
  onProjectClick,
  onBoundsChange
}) => {
  return (
    <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'split' ? 'calc(100vh - 300px)' : '70vh' }}>
      <GooglePropertyMap 
        properties={mapProperties}
        selectedProperty={selectedPropertyForMap}
        onPropertySelect={(property) => {
          const project = visibleProjects.find(p => p.id === property.mlsNumber);
          if (project) {
            onProjectClick(project);
          }
        }}
        onBoundsChange={onBoundsChange}
      />
    </div>
  );
};

export default ProjectMapView;

