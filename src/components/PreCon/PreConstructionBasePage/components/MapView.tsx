import React from 'react';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import { PreConMap } from './PreConMap';

type ViewMode = 'list' | 'mixed' | 'map';

interface MapViewProps {
  viewMode: ViewMode;
  /** Not used: pre-con page uses PreConMap with preConProjects only. Kept for type compatibility. */
  mapProperties?: unknown[];
  selectedProperty?: unknown;
  selectedProject: PreConstructionProperty | null;
  onPropertySelect?: (property: unknown) => void;
  preConProjects: PreConstructionProperty[];
  onProjectSelect: (project: PreConstructionProperty) => void;
}

/**
 * Map for pre-construction page. Uses a dedicated PreConMap (no clusters, no MapService)
 * so the Repliers properties map setup is not affected.
 */
export const MapView: React.FC<MapViewProps> = ({
  viewMode,
  selectedProject,
  preConProjects,
  onProjectSelect,
}) => {
  if (viewMode === 'list') return null;

  const isFullMap = viewMode === 'map';
  return (
    <div
      className={`bg-gray-100 rounded-lg overflow-hidden ${
        isFullMap ? 'w-full flex-1 min-w-0 min-h-0' : viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'
      }`}
      style={{
        height: isFullMap ? 'calc(100vh - 200px)' : viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh',
      }}
    >
      <PreConMap
        projects={preConProjects}
        selectedProject={selectedProject}
        onProjectSelect={onProjectSelect}
        initialZoom={10}
        className="w-full h-full"
      />
    </div>
  );
};

