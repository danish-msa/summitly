"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from './PropertyCards';
import type { PreConstructionProperty } from './PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import { PropertyListing } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

type FilterType = 
  | { type: 'high-rise-condos' }
  | { type: 'low-rise-condos' }
  | { type: 'closing-this-year'; year: string }
  | { type: 'recently-added' };

interface PreConSectionProps {
  heading: string;
  subheading: string;
  description: string;
  filter: FilterType;
  viewAllLink?: string;
  limit?: number;
}

const PreConSection: React.FC<PreConSectionProps> = ({
  heading,
  subheading,
  description,
  filter,
  viewAllLink,
  limit = 10,
}) => {
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
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter and convert projects based on filter type
  const filteredProjects = useMemo(() => {
    let filtered: PropertyListing[] = [];

    if (filter.type === 'high-rise-condos') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const propertyType = project.preCon.details?.propertyType || project.details?.propertyType || '';
        const subPropertyType = project.preCon.details?.subPropertyType || '';
        return (
          (propertyType.toLowerCase().includes('condo') || propertyType.toLowerCase().includes('condominium')) &&
          subPropertyType.toLowerCase() === 'high-rise'
        );
      });
    } else if (filter.type === 'low-rise-condos') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const propertyType = project.preCon.details?.propertyType || project.details?.propertyType || '';
        const subPropertyType = project.preCon.details?.subPropertyType || '';
        return (
          (propertyType.toLowerCase().includes('condo') || propertyType.toLowerCase().includes('condominium')) &&
          subPropertyType.toLowerCase() === 'low-rise'
        );
      });
    } else if (filter.type === 'closing-this-year') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const completionDate = project.preCon.completion?.date || '';
        return completionDate.includes(filter.year);
      });
    } else if (filter.type === 'recently-added') {
      filtered = [...projects].sort((a, b) => {
        const dateA = new Date(a.listDate || a.updatedOn || '1970-01-01').getTime();
        const dateB = new Date(b.listDate || b.updatedOn || '1970-01-01').getTime();
        return dateB - dateA; // Newest first
      });
    }

    return filtered
      .slice(0, limit)
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects, filter, limit]);

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
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold mb-2 text-primary">{heading}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {viewAllLink && (
              <Link href={viewAllLink} className="whitespace-nowrap pt-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        </div>
      </section>
    );
  }

  if (filteredProjects.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 text-primary">{heading}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} className="whitespace-nowrap pt-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

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
            {filteredProjects.map((property) => (
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

export default PreConSection;

