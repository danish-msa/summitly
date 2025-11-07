import React from 'react';
import { Bed, Bath, Maximize2 } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';

interface PropertyStatsProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
}

const PropertyStats: React.FC<PropertyStatsProps> = ({ property, isPreCon = false }) => {
  // Get pre-con specific data if available
  const preConData = property.preCon;
  // Format square footage
  const formatSqft = (sqft: number | string | null | undefined) => {
    if (!sqft) return 'N/A';
    const num = typeof sqft === 'string' ? parseInt(sqft) : sqft;
    if (isNaN(num)) return 'N/A';
    
    // Format as range if needed (e.g., 800-899)
    if (num >= 800 && num < 900) return '800-899 sqft';
    if (num >= 900 && num < 1000) return '900-999 sqft';
    return `${num} sqft`;
  };

  const stats = [
    {
      icon: Bed,
      label: 'Bedrooms',
      value: isPreCon && preConData?.details?.bedroomRange 
        ? preConData.details.bedroomRange 
        : `${property.details.numBedrooms} Bed${property.details.numBedrooms !== 1 ? 's' : ''}`,
    },
    {
      icon: Bath,
      label: 'Bathrooms',
      value: isPreCon && preConData?.details?.bathroomRange 
        ? preConData.details.bathroomRange 
        : `${property.details.numBathrooms} Bath${property.details.numBathrooms !== 1 ? 's' : ''}`,
    },
    {
      icon: Maximize2,
      label: 'Size',
      value: isPreCon && preConData?.details?.sqftRange 
        ? preConData.details.sqftRange 
        : formatSqft(property.details.sqft),
    }
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="flex flex-row items-center gap-3 p-3 bg-white rounded-lg transition-colors flex-1 min-w-[200px]"
          >
            {/* Icon Container */}
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-gray-800 stroke-2" />
            </div>
            
            <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
              {/* Label */}
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {stat.label}
              </span>
              
              {/* Value */}
              <span className="text-base font-bold text-gray-900 whitespace-nowrap">
                {stat.value}
              </span>
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

export default PropertyStats;

