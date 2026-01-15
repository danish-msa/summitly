"use client"

import React, { useEffect, useRef, useCallback } from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import { Loader2 } from 'lucide-react';

type ViewMode = 'list' | 'mixed' | 'map';

interface ProjectListingsProps {
  projects: PreConstructionProperty[];
  viewMode: ViewMode;
  selectedProject: PreConstructionProperty | null;
  onProjectSelect: (project: PreConstructionProperty) => void;
  displayTitle: string;
  pageType: string;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const ProjectListings: React.FC<ProjectListingsProps> = ({
  projects,
  viewMode,
  selectedProject,
  onProjectSelect,
  displayTitle,
  pageType,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (viewMode === 'map' || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Trigger 100px before the element comes into view
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [viewMode, hasMore, loadingMore, onLoadMore]);

  if (viewMode === 'map') return null;

  return (
    <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} 
         style={{ maxHeight: viewMode === 'mixed' ? 'calc(100vh - 200px)' : 'auto' }}>
      {projects.length > 0 ? (
        <>
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
          
          {/* Load More Trigger */}
          {hasMore && (
            <div 
              ref={observerTarget} 
              className="flex justify-center items-center py-8 min-h-[100px]"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more projects...</span>
                </div>
              )}
            </div>
          )}
        </>
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

