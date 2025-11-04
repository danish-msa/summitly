"use client";

import React, { useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import { PreConstructionPropertyCard } from '@/components/PropertyCards';
import type { PreConstructionProperty } from '@/components/PropertyCards/types';

// Mock data for pre-construction projects
// In a real app, this would come from an API or data service
const mockPreConProjects: PreConstructionProperty[] = [
  {
    id: '1',
    projectName: 'Luxury Heights Condominiums',
    developer: 'Premium Developments Inc.',
    startingPrice: 450000,
    images: [
      '/images/p1.jpg',
      '/images/p2.jpg',
      '/images/p3.jpg',
    ],
    address: {
      street: '123 Main Street',
      city: 'Toronto',
      province: 'Ontario',
    },
    details: {
      propertyType: 'Condominium',
      bedroomRange: '1-3',
      bathroomRange: '1-2',
      sqftRange: '650-1,200',
      totalUnits: 150,
      availableUnits: 45,
    },
    completion: {
      date: 'Q4 2025',
      progress: 35,
    },
    features: ['Rooftop Terrace', 'Gym', 'Pool', 'Concierge'],
    depositStructure: '5% on signing, 10% within 6 months',
    status: 'selling',
  },
  {
    id: '2',
    projectName: 'Waterfront Residences',
    developer: 'Ocean View Developments',
    startingPrice: 680000,
    images: [
      '/images/p2.jpg',
      '/images/p3.jpg',
      '/images/p4.jpg',
    ],
    address: {
      street: '456 Harbor Drive',
      city: 'Vancouver',
      province: 'British Columbia',
    },
    details: {
      propertyType: 'Condominium',
      bedroomRange: '2-4',
      bathroomRange: '2-3',
      sqftRange: '1,000-1,800',
      totalUnits: 200,
      availableUnits: 120,
    },
    completion: {
      date: 'Q2 2026',
      progress: 15,
    },
    features: ['Waterfront Views', 'Marina Access', 'Spa', 'Restaurant'],
    depositStructure: '10% on signing, 5% every 6 months',
    status: 'selling',
  },
  {
    id: '3',
    projectName: 'Urban Loft District',
    developer: 'Metro Builders',
    startingPrice: 320000,
    images: [
      '/images/p3.jpg',
      '/images/p4.jpg',
      '/images/p5.jpg',
    ],
    address: {
      street: '789 Downtown Ave',
      city: 'Montreal',
      province: 'Quebec',
    },
    details: {
      propertyType: 'Loft',
      bedroomRange: '1-2',
      bathroomRange: '1-2',
      sqftRange: '550-950',
      totalUnits: 80,
      availableUnits: 25,
    },
    completion: {
      date: 'Q3 2025',
      progress: 60,
    },
    features: ['Exposed Brick', 'High Ceilings', 'Rooftop Garden'],
    depositStructure: '5% on signing',
    status: 'selling',
  },
  {
    id: '4',
    projectName: 'Mountain View Estates',
    developer: 'Alpine Homes',
    startingPrice: 850000,
    images: [
      '/images/p4.jpg',
      '/images/p5.jpg',
      '/images/p6.jpg',
    ],
    address: {
      street: '321 Mountain Road',
      city: 'Calgary',
      province: 'Alberta',
    },
    details: {
      propertyType: 'Townhouse',
      bedroomRange: '3-5',
      bathroomRange: '2.5-4',
      sqftRange: '1,500-2,500',
      totalUnits: 50,
      availableUnits: 12,
    },
    completion: {
      date: 'Q1 2026',
      progress: 25,
    },
    features: ['Mountain Views', 'Garage', 'Backyard', 'Fireplace'],
    depositStructure: '10% on signing, 5% at closing',
    status: 'coming-soon',
  },
];

const PreConstructionProjects = () => {
  const [projects] = useState<PreConstructionProperty[]>(mockPreConProjects);
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());

  const handleHide = (projectId: string) => {
    setHiddenProjects((prev) => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });
  };

  const visibleProjects = projects.filter(
    (project) => !hiddenProjects.has(project.id)
  );

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Featured Pre-Construction Projects"
          subheading="Pre-Construction"
          description="Discover the best pre-construction homes across Canada"
          position="center"
        />

        {visibleProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-4 mt-12">
            {visibleProjects.map((project) => (
              <PreConstructionPropertyCard
                key={project.id}
                property={project}
                onHide={() => handleHide(project.id)}
              />
            ))}
          </div>
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

