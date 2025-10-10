import Image from 'next/image';
import React, { useState } from 'react';
import { FaBed, FaBath, FaRulerCombined, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Link from 'next/link';
import { PropertyListing } from '@/data/types';

interface PropertyCardProps {
  property: PropertyListing;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Format price with commas and handle currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.listPrice);

  // Get all images or use fallback
  const images = imgError || !property.images.allImages || property.images.allImages.length === 0 
    ? ['/images/p1.jpg', '/images/p2.jpg', '/images/p3.jpg'] 
    : property.images.allImages;

  // Current image to display
  const currentImage = images[currentImageIndex];

  // Create a property name from property type and location
  const propertyName = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;

  // Calculate how long ago the listing was posted
  const getTimeAgo = () => {
    // Use listDate if available, otherwise fall back to updatedOn
    const dateString = property.listDate || property.updatedOn;
    if (!dateString) return '';
    
    const listDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - listDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Handle image navigation
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <Link href={`/property/${property.mlsNumber}`} className="block">
      <div className='bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer'>
        <div className='relative h-64 w-full'>
          <Image 
            src={currentImage} 
            alt={propertyName}
            fill
            className='object-cover'
            onError={() => setImgError(true)}
            unoptimized={!currentImage.startsWith('/')}
          />
          
          {/* Image navigation controls */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <button 
              onClick={prevImage} 
              className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
              aria-label="Previous image"
            >
              <FaChevronLeft />
            </button>
            <button 
              onClick={nextImage} 
              className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
              aria-label="Next image"
            >
              <FaChevronRight />
            </button>
          </div>
          
          {/* Image counter */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1}/{images.length}
          </div>
          
          <div className='absolute top-4 left-4 bg-white text-primary text-sm px-2 py-1 rounded-md'>
            {property.details.propertyType}
          </div>
        </div>
        <div className=''>
          <div className="flex justify-between items-center mb-2 p-4 pb-0">
            <h3 className='text-xl truncate'>{formattedPrice}</h3>
            <div className="flex items-center text-xs text-gray-500">
              <FaClock className="mr-1" />
              <span>{getTimeAgo()}</span>
            </div>
          </div>
          <p className='text-gray-600 mb-4 truncate text-sm flex items-center px-4'>
            <FaMapMarkerAlt className="mr-1 text-primary" />
            {property.address.streetNumber} {property.address.streetName}, {property.address.city}, {property.address.state}
          </p>
          <div className='flex justify-between gap-2 text-gray-700 text-sm border-t-2 p-4 pt-2'>
            <span className='text-sm'>{property.class.replace('Property', '')}</span>
            <div className='flex gap-2'>
              <div className='flex items-center'>
                <FaBed className='mr-1' />
                <span>{property.details.numBedrooms}</span>
              </div>
              <div className='flex items-center'>
                <FaBath className='mr-1' />
                <span>{property.details.numBathrooms}</span>
              </div>
              <div className='flex items-center'>
                <FaRulerCombined className='mr-1' />
                <span>{property.details.sqft} sqft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;