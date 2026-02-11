"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import Image from 'next/image';

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

interface PreConCityCardProps {
  city: PreConCity;
}

// Helper function to convert city name to URL-friendly slug - unused but kept for potential future use
const _slugifyCityName = (cityName: string): string => {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const PreConCityCard = ({ city }: PreConCityCardProps) => {
  // Use the city.id which is already in slug format (e.g., 'toronto', 'richmond-hill')
  const citySlug = city.id;
  const [imageError, setImageError] = useState(false);
  
  return (
    <Link href={`/pre-con/${citySlug}`}>
      <div className='relative rounded-3xl overflow-hidden m-2 group cursor-pointer shadow-lg hover:shadow-xl transition-shadow'>
        {/* Background Image */}
        {imageError ? (
          <div className='w-full h-[300px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'>
            <span className='text-gray-400 text-sm'>{city.name}</span>
          </div>
        ) : (
          <div className='relative w-full h-[380px]'>
            <Image
              src={city.image}
              alt={city.name}
              fill
              className='object-cover'
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}
        
        {/* Dark Gradient Overlay (darker at bottom) */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20' />
        
        {/* Top-Left Badge */}
        <div className='absolute top-4 left-4 z-10'>
          <div className='bg-secondary rounded-full px-3 py-1.5 flex items-center gap-2 shadow-md'>
            <Building2 className='w-4 h-4 text-white' />
            <span className='text-white text-sm font-semibold'>
              {city.numberOfProjects || 0} Projects
            </span>
          </div>
        </div>
        
        {/* Bottom-Left Content */}
        <div className='absolute bottom-4 left-4 z-10'>
          <h4 className='text-2xl md:text-3xl font-bold text-white mb-2'>
            {city.name}
          </h4>
          <div className='flex items-center gap-1.5 text-secondary hover:text-secondary/80 transition-colors'>
            <span className='text-sm font-medium'>View Projects</span>
            <ArrowRight className='w-4 h-4' />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PreConCityCard;

