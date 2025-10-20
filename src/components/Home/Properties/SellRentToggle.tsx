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
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {/* Sell Radio Button */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="listingType"
            value="sell"
            checked={listingType === 'sell'}
            onChange={(e) => onListingTypeChange(e.target.value as 'sell' | 'rent')}
            className="w-4 h-4 text-secondary focus:ring-secondary focus:ring-2"
          />
          <span className={`text-sm font-medium transition-colors ${
            listingType === 'sell' ? 'text-secondary' : 'text-gray-600'
          }`}>
            Sell
          </span>
        </label>

        {/* Rent Radio Button */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="listingType"
            value="rent"
            checked={listingType === 'rent'}
            onChange={(e) => onListingTypeChange(e.target.value as 'sell' | 'rent')}
            className="w-4 h-4 text-secondary focus:ring-secondary focus:ring-2"
          />
          <span className={`text-sm font-medium transition-colors ${
            listingType === 'rent' ? 'text-secondary' : 'text-gray-600'
          }`}>
            Rent
          </span>
        </label>
      </div>
    </div>
  );
};

export default SellRentToggle;
