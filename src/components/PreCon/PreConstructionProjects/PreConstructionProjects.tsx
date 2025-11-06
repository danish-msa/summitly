"use client";

import React, { useState, useMemo } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import type { PreConstructionProperty } from '../PropertyCards/types';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import { usePreConProjects } from './hooks/usePreConProjects';
import ViewToggle from './components/ViewToggle';
import ProjectList from './components/ProjectList';
import ProjectMapView from './components/ProjectMapView';
import PropertyTypeToggle from './components/PropertyTypeToggle';

const PreConstructionProjects = () => {
  const [viewMode, setViewMode] = useState<'list' | 'split' | 'map'>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  
  // Use custom hook for project management
  const {
    filteredProjects: visibleProjects,
    mapProperties,
    communities,
    filters,
    handleFilterChange,
    resetFilters,
    allProjects
  } = usePreConProjects();

  // Handle project click for map
  const handleProjectClick = (project: PreConstructionProperty) => {
    setSelectedProject(project);
  };

  // Handle map bounds change (currently unused, but required by map component)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMapBoundsChange = (_bounds: {north: number; south: number; east: number; west: number}) => {
    // Map bounds are tracked but not currently used for filtering
    // This can be implemented in the future if needed
  };

  // Find selected property for map
  const selectedPropertyForMap = useMemo(() => {
    if (!selectedProject) return null;
    return mapProperties.find(p => p.mlsNumber === selectedProject.id) || null;
  }, [selectedProject, mapProperties]);

  return (
    <section className="py-16 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="All Pre-Construction Projects"
          subheading="All Pre-Construction Projects"
          description="Discover the best pre-construction homes across Canada"
          position="center"
        />

        {/* Global Filters with View Toggle */}
        <div className="mt-8 mb-4">
          <div className="flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center gap-4">
            {/* <GlobalFilters
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              communities={communities}
              locations={LOCATIONS}
              isPreCon={true}
              showLocation={true}
              showPropertyType={false}
              showCommunity={false}
              showPrice={true}
              showBedrooms={true}
              showBathrooms={true}
              showAdvanced={false}
              layout="horizontal"
              className="w-full md:w-auto"
            /> */}
            {/* <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} /> */}
          </div>
          
          {/* Property Type Toggle */}
          <PropertyTypeToggle
            filters={filters}
            handleFilterChange={handleFilterChange}
            projects={allProjects}
          />
        </div>

        {visibleProjects.length > 0 ? (
          <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
            {/* Project Listings */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <ProjectList
                projects={visibleProjects}
                selectedProject={selectedProject}
                viewMode={viewMode}
                onProjectClick={handleProjectClick}
              />
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <ProjectMapView
                mapProperties={mapProperties}
                selectedPropertyForMap={selectedPropertyForMap}
                visibleProjects={visibleProjects}
                viewMode={viewMode}
                onProjectClick={handleProjectClick}
                onBoundsChange={handleMapBoundsChange}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No pre-construction projects available at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PreConstructionProjects;

