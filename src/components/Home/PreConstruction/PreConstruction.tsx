"use client";

import React from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import Link from 'next/link';

// Mock data for pre-construction projects
const preConstructionProjects: PreConstructionProperty[] = [
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
      latitude: 43.6532,
      longitude: -79.3832,
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
      latitude: 49.2827,
      longitude: -123.1207,
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
      latitude: 45.5017,
      longitude: -73.5673,
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
    status: 'coming-soon',
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
      latitude: 51.0447,
      longitude: -114.0719,
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

const PreConstruction: React.FC = () => {
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
            href="/pre-con"
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

