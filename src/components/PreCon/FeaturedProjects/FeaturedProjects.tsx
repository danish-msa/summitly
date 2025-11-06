"use client";

import React from 'react';
import { FeaturedPropertyCard } from '../PropertyCards';
import type { PreConstructionProperty } from '../PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';

// Featured properties data - top picks
const featuredProperties: PreConstructionProperty[] = [
  {
    id: 'featured-1',
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
    occupancyYear: 2026,
    features: ['Rooftop Terrace', 'Gym', 'Pool', 'Concierge'],
    depositStructure: '5% on signing, 10% within 6 months',
    status: 'selling',
  },
  {
    id: 'featured-2',
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
    occupancyYear: 2027,
    features: ['Waterfront Views', 'Marina Access', 'Spa', 'Restaurant'],
    depositStructure: '10% on signing, 5% every 6 months',
    status: 'selling',
  },
];

const FeaturedProjects: React.FC = () => {
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

