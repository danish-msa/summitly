"use client";

import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from '../PropertyCards';
import SectionHeading from '@/components/Helper/SectionHeading';
import { platinumVIPProjects } from './platinumVIPProjectsData';

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

const PlatinumAccessVIP: React.FC = () => {
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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Platinum Access VIP Condos"
          subheading="Platinum Access VIP"
          description="Exclusive VIP access to the most prestigious pre-construction condominium projects with premium amenities and luxury living"
          position="center"
        />

        <div className="mt-12 relative">
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
            {platinumVIPProjects.map((property) => (
              <div key={property.id} className="px-2">
                <PreConstructionPropertyCardV3
                  property={property}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default PlatinumAccessVIP;

