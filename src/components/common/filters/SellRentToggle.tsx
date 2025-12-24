"use client";

import React from 'react';

interface SellRentToggleProps {
  listingType: 'sell' | 'rent';
  onListingTypeChange: (type: 'sell' | 'rent') => void;
}

const SellRentToggle: React.FC<SellRentToggleProps> = ({ 
  listingType, 
  onListingTypeChange 
}) => {
  return (
    <div className="flex items-center gap-1 rounded-lg p-1">
      <button
        onClick={() => onListingTypeChange('sell')}
        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-none text-sm sm:text-base font-medium transition-all duration-200 ${
          listingType === 'sell'
            ? 'bg-white text-gray-900 shadow-sm border-b-2 border-primary'
            : 'text-gray-600 hover:text-gray-900 hover:bg-muted/20'
        }`}
      >
        For Sale
      </button>
      <button
        onClick={() => onListingTypeChange('rent')}
        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-none text-sm sm:text-base font-medium transition-all duration-200 ${
          listingType === 'rent'
            ? 'bg-white text-gray-900 shadow-sm border-b-2 border-primary'
            : 'text-gray-600 hover:text-gray-900 hover:bg-muted/20'
        }`}
      >
        For Rent
      </button>
    </div>
  );
};

export default SellRentToggle;
