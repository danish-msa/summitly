"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from '../PropertyCards';
import type { PreConstructionProperty } from '../PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import { PropertyListing } from '@/lib/types';

// Convert PropertyListing to PreConstructionProperty format
const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || preCon.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: typeof preCon.completion.progress === 'string' ? 0 : (preCon.completion.progress || 0),
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

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
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/pre-con-projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching VIP projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get VIP projects (filter for condos)
  const platinumVIPProjects = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null)
      .filter(project => 
        // Filter for condominiums
        project.details.propertyType.toLowerCase().includes('condo') || 
        project.details.propertyType.toLowerCase().includes('condominium')
      );
  }, [projects]);

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

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            heading="Platinum Access VIP Condos"
            subheading="Platinum Access VIP"
            description="Exclusive VIP access to the most prestigious pre-construction condominium projects with premium amenities and luxury living"
            position="center"
          />
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading VIP projects...</div>
          </div>
        </div>
      </section>
    );
  }

  if (platinumVIPProjects.length === 0) {
    return null;
  }

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

