import React from 'react';
import Link from 'next/link';
import { BsArrowRightCircle } from 'react-icons/bs';
import BlurImage from '../../Helper/BlurImage';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

interface CityCardProps {
  city: City;
}

// Helper function to convert city name to URL-friendly slug
const slugifyCityName = (cityName: string): string => {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const CityCard = ({ city }: CityCardProps) => {
  const citySlug = slugifyCityName(city.cityName);
  
  return (
    <Link href={`/city/${citySlug}`}>
      <div className='relative rounded-lg overflow-hidden m-2 group cursor-pointer'>
          <BlurImage src={city.image} alt={city.cityName} width={700} height={700} className='rounded-2xl w-full h-[250px] object-cover'/>
          <div className='absolute bottom-2 left-2 right-2 rounded-xl px-4 pt-4 pb-4 bg-white text-black flex justify-between items-center'>
            <div className='flex flex-col'>
              <p className='text-sm'>{city.numberOfProperties} Properties</p>
              <h4 className='text-base font-medium'>{city.cityName}</h4>
            </div>
            <BsArrowRightCircle className='text-3xl text-gray-400 group-hover:text-black transition-colors' />
          </div>
      </div>
    </Link>
  );
};

export default CityCard