"use client";

import React, { useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import type { PreConstructionProperty } from '../PropertyCards/types';
import { usePreConProjects } from './hooks/usePreConProjects';
import ProjectList from './components/ProjectList';
import PropertyTypeToggle from './components/PropertyTypeToggle';

const PreConstructionProjects = () => {
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  
  // Use custom hook for project management
  const {
    filteredProjects: visibleProjects,
    filters,
    handleFilterChange,
    allProjects,
    loading
  } = usePreConProjects();

  // Handle project click
  const handleProjectClick = (project: PreConstructionProperty) => {
    setSelectedProject(project);
  };

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

        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : visibleProjects.length > 0 ? (
          <ProjectList
            projects={visibleProjects}
            selectedProject={selectedProject}
            onProjectClick={handleProjectClick}
          />
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

