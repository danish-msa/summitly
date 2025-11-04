import React from 'react';
import { Bed, Bath, Maximize2, Car, Compass, Receipt } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';

interface PropertyStatsProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const PropertyStats: React.FC<PropertyStatsProps> = ({ property, rawProperty }) => {
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

  // Get parking spaces from raw property or use default
  const getParkingSpaces = () => {
    if (rawProperty?.details?.numGarageSpaces) {
      const garage = rawProperty.details.numGarageSpaces;
      const total = rawProperty.details.numParkingSpaces || garage;
      return `${total} (${garage} Garage)`;
    }
    if (rawProperty?.details?.numParkingSpaces) {
      return `${rawProperty.details.numParkingSpaces} (${rawProperty.details.numParkingSpaces} Garage)`;
    }
    return '1 (1 Garage)'; // Default
  };

  // Get view from raw property
  const getView = () => {
    return rawProperty?.details?.viewType || 'North-East';
  };

  // Get maintenance fees from raw property (condo fees)
  const getMaintenanceFees = () => {
    const hoaFee = rawProperty?.details?.HOAFee;
    const condoFee = rawProperty?.condominium?.fees?.maintenance;
    
    if (hoaFee) {
      const amount = typeof hoaFee === 'string' ? parseFloat(hoaFee) : hoaFee;
      if (!isNaN(amount)) {
        return `$${amount.toFixed(1)}`;
      }
    }
    
    if (condoFee) {
      return `$${condoFee.toFixed(1)}`;
    }
    
    return '$602.9'; // Default
  };

  const stats = [
    {
      icon: Bed,
      label: 'Bedrooms',
      value: `${property.details.numBedrooms} Bed${property.details.numBedrooms !== 1 ? 's' : ''}`,
    },
    {
      icon: Bath,
      label: 'Bathrooms',
      value: `${property.details.numBathrooms} Bath${property.details.numBathrooms !== 1 ? 's' : ''}`,
    },
    {
      icon: Maximize2,
      label: 'Size',
      value: formatSqft(property.details.sqft),
    },
    {
      icon: Car,
      label: 'Total Parking Spaces',
      value: getParkingSpaces(),
    },
    {
      icon: Compass,
      label: 'View',
      value: getView(),
    },
    {
      icon: Receipt,
      label: 'Maintenance Fees',
      value: getMaintenanceFees(),
    },
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

