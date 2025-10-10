import Image from 'next/image';
import React, { useState } from 'react';
import { FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';
import Link from 'next/link';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts

interface PropertyCardProps {
  property: PropertyListing;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [imgError, setImgError] = useState(false);
  
  // Format price with commas and handle currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.listPrice);

  // Use a fallback image if the URL is invalid or on error
  const imageSrc = imgError ? '/images/p1.jpg' : property.images.imageUrl;

  // Create a property name from property type and location
  const propertyName = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;

  return (
    <Link href={`/property/${property.mlsNumber}`} className="block">
      <div className='bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer'>
        <div className='relative h-64 w-full'>
          <Image 
            src={imageSrc} 
            alt={propertyName}
            fill
            className='object-cover'
            onError={() => setImgError(true)}
            unoptimized={!property.images.imageUrl.startsWith('/')}
          />
          <div className='absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-md'>
            {property.details.propertyType}
          </div>
          <div className='absolute bottom-4 right-4 bg-white text-primary px-3 py-1 rounded-md font-bold'>
            {formattedPrice}
          </div>
        </div>
        <div className='p-4'>
          <h3 className='text-xl mb-2 truncate'>{propertyName}</h3>
          <p className='text-gray-600 mb-4 truncate'>{property.address.location}</p>
          <div className='flex justify-between text-gray-700'>
            <div className='flex items-center'>
              <FaBed className='mr-2' />
              <span>{property.details.numBedrooms} Beds</span>
            </div>
            <div className='flex items-center'>
              <FaBath className='mr-2' />
              <span>{property.details.numBathrooms} Baths</span>
            </div>
            <div className='flex items-center'>
              <FaRulerCombined className='mr-2' />
              <span>{property.details.sqft} sqft</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;