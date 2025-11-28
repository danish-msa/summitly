import React from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';

type ViewMode = 'list' | 'mixed' | 'map';

interface ProjectListingsProps {
  projects: PreConstructionProperty[];
  viewMode: ViewMode;
  selectedProject: PreConstructionProperty | null;
  onProjectSelect: (project: PreConstructionProperty) => void;
  displayTitle: string;
  pageType: string;
}

export const ProjectListings: React.FC<ProjectListingsProps> = ({
  projects,
  viewMode,
  selectedProject,
  onProjectSelect,
  displayTitle,
  pageType,
}) => {
  if (viewMode === 'map') return null;

  return (
    <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} 
         style={{ maxHeight: viewMode === 'mixed' ? 'calc(100vh - 200px)' : 'auto' }}>
      {projects.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'mixed' 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {projects.map((project) => (
            <div
              key={project.id}
              className={`cursor-pointer transition-all ${
                selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onProjectSelect(project)}
            >
              <PreConstructionPropertyCardV3 property={project} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground">
            No pre-construction projects found{pageType === 'by-location' ? ` in ${displayTitle}` : ''}
          </p>
        </div>
      )}
    </div>
  );
};

