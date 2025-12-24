"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { FeaturedPropertyCard } from '../PropertyCards';
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

const FeaturedProjects: React.FC = () => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/pre-con-projects?featured=true&limit=2');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching featured projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Convert featured projects (already filtered by API)
  const featuredProperties = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            heading="Our Top Picks"
            subheading="Featured Projects"
            description="Discover our handpicked selection of premium pre-construction properties"
            position="center"
          />
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-sm sm:text-base text-muted-foreground">Loading featured projects...</div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Our Top Picks"
          subheading="Featured Projects"
          description="Discover our handpicked selection of premium pre-construction properties"
          position="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-12">
          {featuredProperties.map((property) => (
            <FeaturedPropertyCard
              key={property.id}
              property={property}
              onHide={() => {}}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;

