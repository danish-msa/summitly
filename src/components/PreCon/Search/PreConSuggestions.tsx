"use client";

import React from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PreConCity, PreConSellingStatus } from './types';

export type { PreConCity, PreConSellingStatus };

export interface PreConSuggestionsProps {
  cities: PreConCity[];
  sellingStatuses: PreConSellingStatus[];
  onCitySelect: (city: PreConCity) => void;
  onStatusSelect: (status: PreConSellingStatus) => void;
  isOpen: boolean;
  className?: string;
}

const PreConSuggestions: React.FC<PreConSuggestionsProps> = ({
  cities,
  sellingStatuses,
  onCitySelect,
  onStatusSelect,
  isOpen,
  className,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden max-h-[80vh] sm:max-h-[600px] overflow-y-auto", className)}>
      <div className="p-2 sm:p-4">
        {/* Pre construction Cities Section */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-bold text-primary mb-2 sm:mb-3 px-1">Pre construction Cities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/pre-con/${city.id}`}
                onClick={() => onCitySelect(city)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {city.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    {city.numberOfProjects ? `${city.numberOfProjects} Projects` : 'Pre construction'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Selling Status Section */}
        {sellingStatuses.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 px-1">Selling Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
              {sellingStatuses.map((status) => (
                <Link
                  key={status.id}
                  href={`/pre-con/${status.id}`}
                  onClick={() => onStatusSelect(status)}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                    <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs text-gray-900 truncate">
                      {status.name}
                    </p>
                    {status.numberOfProjects !== undefined && (
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {status.numberOfProjects} Projects
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreConSuggestions;

