"use client";

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PreConCity, PreConLaunch } from './types';

export type { PreConCity, PreConLaunch };

export interface PreConSuggestionsProps {
  cities: PreConCity[];
  launches: PreConLaunch[];
  onCitySelect: (city: PreConCity) => void;
  onLaunchSelect: (launch: PreConLaunch) => void;
  isOpen: boolean;
  className?: string;
}

const PreConSuggestions: React.FC<PreConSuggestionsProps> = ({
  cities,
  launches,
  onCitySelect,
  onLaunchSelect,
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

        {/* New Pre construction Launches Section */}
        {launches.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">New Pre construction Launches</h3>
            <div className="grid grid-cols-4 gap-1">
              {launches.map((launch) => (
                <div
                  key={launch.id}
                  onClick={() => onLaunchSelect(launch)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">
                      {launch.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreConSuggestions;

