import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from '../../PropertyCards';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface ProjectListProps {
  projects: PreConstructionProperty[];
  selectedProject: PreConstructionProperty | null;
  onProjectClick: (project: PreConstructionProperty) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  onProjectClick
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Navigation Buttons - Positioned above the carousel */}
        <div className="absolute -top-10 right-0 flex gap-1 justify-between items-center z-10 pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="h-8 w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
            aria-label="Previous slide"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            className="h-8 w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
            aria-label="Next slide"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>

        <Carousel
          setApi={setCarouselApi}
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
            {projects.map((project) => (
              <CarouselItem
                key={project.id}
                className={`pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4 cursor-pointer transition-all ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
                onClick={() => onProjectClick(project)}
              >
                <PreConstructionPropertyCardV3
                  property={project}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      
      {/* View All Projects Button */}
      <div className="flex justify-center mt-12">
        <Link href="/pre-con/projects">
          <Button variant="default" size="lg" className="px-8">
            View All Projects
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectList;

