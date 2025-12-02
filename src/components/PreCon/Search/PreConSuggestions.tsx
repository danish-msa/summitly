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
    <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden", className)}>
      <div className="p-4">
        {/* Pre construction Cities Section */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-primary mb-3">Pre construction Cities</h3>
          <div className="grid grid-cols-3 gap-1">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/pre-construction/${city.id}`}
                onClick={() => onCitySelect(city)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {city.name}
                  </p>
                  <p className="text-xs text-gray-500">
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
            <h3 className="text-sm font-bold text-gray-900 mb-3">Selling Status</h3>
            <div className="grid grid-cols-4 gap-1">
              {sellingStatuses.map((status) => (
                <Link
                  key={status.id}
                  href={`/pre-construction/${status.id}`}
                  onClick={() => onStatusSelect(status)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                    <Tag className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">
                      {status.name}
                    </p>
                    {status.numberOfProjects !== undefined && (
                      <p className="text-xs text-gray-500">
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

