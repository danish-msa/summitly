import React from 'react';
import PropertyCard from '@/components/Helper/PropertyCard';
import type { PropertyListing } from '@/lib/types';

interface PropertyListingsProps {
  properties: PropertyListing[];
  displayTitle: string;
  pageType: string;
}

export const PropertyListings: React.FC<PropertyListingsProps> = ({
  properties,
  displayTitle,
  pageType,
}) => {
  return (
    <div className="w-full">
      {properties.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <div key={property.mlsNumber}>
              <PropertyCard
                property={property}
                onHide={() => {}}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground">
            No properties found{pageType === 'by-location' ? ` in ${displayTitle}` : ''}
          </p>
        </div>
      )}
    </div>
  );
};

