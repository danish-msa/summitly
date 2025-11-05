import React from 'react';
import { PreConstructionPropertyCard } from '../../PropertyCards';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ViewMode = 'list' | 'split' | 'map';

interface ProjectListProps {
  projects: PreConstructionProperty[];
  selectedProject: PreConstructionProperty | null;
  viewMode: ViewMode;
  onProjectClick: (project: PreConstructionProperty) => void;
  onHide: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  viewMode,
  onProjectClick,
  onHide
}) => {
  return (
    <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'split' ? 'calc(100vh - 300px)' : 'auto' }}>
      {/* Results Count */}
      <div className="hidden sm:flex items-center mb-2">
        <span className="text-gray-700 font-medium text-sm">
          {projects.length} results
        </span>
      </div>
      
      {/* Projects Grid */}
      <div className={`grid ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-4'} gap-6 md:gap-4`}>
        {projects.map((project) => (
          <div 
            key={project.id}
            className={`cursor-pointer transition-all ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
            onClick={() => onProjectClick(project)}
          >
            <PreConstructionPropertyCard
              property={project}
              onHide={() => onHide(project.id)}
            />
          </div>
        ))}
      </div>
      
      {/* View All Projects Button - Only show in list view */}
      {viewMode === 'list' && (
        <div className="flex justify-center mt-12">
          <Link href="/pre-con">
            <Button variant="outline" size="lg" className="px-8">
              View All Projects
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectList;

