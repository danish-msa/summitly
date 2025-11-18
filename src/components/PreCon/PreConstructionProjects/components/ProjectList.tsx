import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from '../../PropertyCards';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ViewMode = 'list' | 'split' | 'map';

interface ProjectListProps {
  projects: PreConstructionProperty[];
  selectedProject: PreConstructionProperty | null;
  viewMode: ViewMode;
  onProjectClick: (project: PreConstructionProperty) => void;
}

// Custom Arrow Components
const CustomLeftArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
    aria-label="Previous slide"
  >
    <ChevronLeft className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
  </button>
);

const CustomRightArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
    aria-label="Next slide"
  >
    <ChevronRight className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
  </button>
);

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  viewMode,
  onProjectClick
}) => {
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1536 },
      items: 4,
      slidesToSlide: 1
    },
    desktop: {
      breakpoint: { max: 1536, min: 1024 },
      items: 4,
      slidesToSlide: 1
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 2,
      slidesToSlide: 1
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
      slidesToSlide: 1
    }
  };

  return (
    <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'split' ? 'calc(100vh - 300px)' : 'auto' }}>
      {/* Results Count */}
      {/* <div className="hidden sm:flex items-center mb-2">
        <span className="text-gray-700 font-medium text-sm">
          {projects.length} results
        </span>
      </div> */}
      
      {/* Projects Display */}
      {viewMode === 'list' ? (
        <div className="relative">
          <Carousel
            responsive={responsive}
            infinite={true}
            autoPlay={false}
            keyBoardControl={true}
            customTransition="all .5s"
            transitionDuration={500}
            containerClass="carousel-container"
            removeArrowOnDeviceType={[]}
            dotListClass="custom-dot-list-style"
            itemClass="carousel-item-padding-40-px"
            slidesToSlide={1}
            customLeftArrow={<CustomLeftArrow />}
            customRightArrow={<CustomRightArrow />}
            arrows={true}
          >
            {projects.map((project) => (
              <div 
                key={project.id}
                className={`px-2 cursor-pointer transition-all ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
                onClick={() => onProjectClick(project)}
              >
                <PreConstructionPropertyCardV3
                  property={project}
                />
              </div>
            ))}
          </Carousel>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-4'} gap-6 md:gap-4`}>
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`cursor-pointer transition-all ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
              onClick={() => onProjectClick(project)}
            >
              <PreConstructionPropertyCardV3
                property={project}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* View All Projects Button - Only show in list view */}
      {viewMode === 'list' && (
        <div className="flex justify-center mt-12">
          <Link href="/pre-construction">
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

