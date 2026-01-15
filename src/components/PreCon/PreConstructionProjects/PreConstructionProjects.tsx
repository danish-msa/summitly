"use client";

import React, { useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import type { PreConstructionProperty } from '../PropertyCards/types';
import { usePreConProjects } from './hooks/usePreConProjects';
import ProjectList from './components/ProjectList';
import PropertyTypeToggle from './components/PropertyTypeToggle';
import { PreConstructionCardSkeleton } from '@/components/skeletons';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

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
    <section className="py-16 bg-white">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="All Pre-Construction Projects"
          subheading="All Pre-Construction Projects"
          description="Discover the best pre-construction homes across Canada"
          position="center"
        />

        {/* Global Filters with View Toggle */}
        <div className="mt-8 mb-4">
          {/* Property Type Toggle */}
          <PropertyTypeToggle
            filters={filters}
            handleFilterChange={handleFilterChange}
            projects={allProjects}
          />
        </div>

        {loading ? (
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                breakpoints: {
                  "(max-width: 768px)": {
                    dragFree: true,
                  },
                },
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {[...Array(8)].map((_, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
                  >
                    <PreConstructionCardSkeleton />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
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

