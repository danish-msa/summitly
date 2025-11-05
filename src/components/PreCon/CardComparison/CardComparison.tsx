"use client";

import React from 'react';
import { 
  PreConstructionPropertyCard, 
  PreConstructionPropertyCardV2, 
  PreConstructionPropertyCardV3 
} from '../PropertyCards';
import type { PreConstructionProperty } from '../PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';

// Use a sample property for comparison
const sampleProperty: PreConstructionProperty = {
  id: 'comparison-1',
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
};

const CardComparison: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeading
          heading="Card Design Comparison"
          subheading="Pre-Construction Cards"
          description="Compare all three pre-construction property card designs side by side"
          position="center"
        />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-12">
          {/* Card V1 */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Card Design V1</h3>
              <p className="text-sm text-muted-foreground">Full-featured card with image gallery and detailed information</p>
            </div>
            <div className="flex-1">
              <PreConstructionPropertyCard
                property={sampleProperty}
                onHide={() => {}}
              />
            </div>
          </div>

          {/* Card V2 */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Card Design V2</h3>
              <p className="text-sm text-muted-foreground">Alternative layout with enhanced visual appeal</p>
            </div>
            <div className="flex-1">
              <PreConstructionPropertyCardV2
                property={sampleProperty}
                onHide={() => {}}
              />
            </div>
          </div>

          {/* Card V3 */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Card Design V3</h3>
              <p className="text-sm text-muted-foreground">Compact launch card with status badges</p>
            </div>
            <div className="flex-1">
              <PreConstructionPropertyCardV3
                property={sampleProperty}
                onHide={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardComparison;

