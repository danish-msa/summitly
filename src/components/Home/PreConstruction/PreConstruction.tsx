"use client";

import React, { useMemo } from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import Link from 'next/link';
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

const PreConstruction: React.FC = () => {
  // Get all pre-construction projects from centralized mock data
  const preConstructionProjects = useMemo(() => {
    const allProjects = getAllPreConProjects();
    return allProjects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null)
      .slice(0, 4); // Limit to 4 projects for the home page
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Pre-Construction Projects"
          subheading="Coming Soon"
          description="Discover exciting pre-construction opportunities across Canada"
          position="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {preConstructionProjects.map((project) => (
            <PreConstructionPropertyCardV3
              key={project.id}
              property={project}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/pre-construction"
            className="inline-flex items-center px-6 py-3 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
          >
            View All Pre-Construction Projects
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PreConstruction;

