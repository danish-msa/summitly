import React, { useState } from 'react';
import Link from 'next/link';
import { BsArrowRightCircle } from 'react-icons/bs';

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

interface PreConCityCardProps {
  city: PreConCity;
}

// Helper function to convert city name to URL-friendly slug
const slugifyCityName = (cityName: string): string => {
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
    <Link href={`/pre-construction/${citySlug}`}>
      <div className='relative rounded-lg overflow-hidden m-2 group cursor-pointer'>
          {imageError ? (
            <div className='w-full h-[250px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center'>
              <span className='text-gray-400 text-sm'>{city.name}</span>
            </div>
          ) : (
            <img
              src={city.image}
              alt={city.name}
              className='rounded-2xl w-full h-[250px] object-cover'
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          <div className='absolute bottom-2 left-2 right-2 rounded-xl px-4 pt-4 pb-4 bg-white text-black flex justify-between items-center'>
            <div className='flex flex-col'>
              <p className='text-sm'>{city.numberOfProjects || 0} Projects</p>
              <h4 className='text-medium font-medium'>{city.name}</h4>
            </div>
            <BsArrowRightCircle className='text-3xl text-gray-400 group-hover:text-black transition-colors' />
          </div>
      </div>
    </Link>
  );
};

export default PreConCityCard;

