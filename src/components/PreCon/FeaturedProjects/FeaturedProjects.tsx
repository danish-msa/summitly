"use client";

import React, { useMemo } from 'react';
import { FeaturedPropertyCard } from '../PropertyCards';
import type { PreConstructionProperty } from '../PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import { getAllPreConProjects } from '@/data/mockPreConData';
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
      propertyType: property.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: preCon.completion.progress,
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

const FeaturedProjects: React.FC = () => {
  // Get featured projects from centralized mock data (top 2 projects)
  const featuredProperties = useMemo(() => {
    const allPropertyListings = getAllPreConProjects();
    return allPropertyListings
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null)
      .slice(0, 2); // Get top 2 for featured section
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Our Top Picks"
          subheading="Featured Projects"
          description="Discover our handpicked selection of premium pre-construction properties"
          position="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-12">
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

