import React, { useState } from 'react';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaClock, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

// Mock data type based on your original interface
interface PropertyListing {
  mlsNumber: string;
  listPrice: number;
  type: string; // "Lease" for rentals, "Sale" for sales
  images: {
    imageUrl: string;
    imageUrls?: string[];
  };
  details: {
    propertyType: string;
    numBedrooms: number;
    numBathrooms: number;
    sqft: number | string;
  };
  address: {
    city: string | null;
    location: string;
  };
  listedDate?: string;
  status?: string;
}

interface PropertyCardProps {
  property: PropertyListing;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Mock multiple images for carousel
  const images = property.images.imageUrls || [property.images.imageUrl];
  const totalImages = images.length;
  
  // Format price based on property type
  const isRental = property.type === 'Lease' || property.type?.toLowerCase().includes('lease');
  
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.listPrice);
  
  const priceDisplay = isRental 
    ? `${formattedPrice}/month` 
    : formattedPrice;

  // Use fallback image if error
  const imageSrc = imgError ? '/placeholder.svg' : images[currentImageIndex];

  // Format listing date
  const formatListingDate = (dateString?: string) => {
    if (!dateString) return 'Recently listed';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Navigate carousel
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div className="group cursor-pointer">
      <div className='bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-gray-200'>
        {/* Image Section with Carousel */}
        <div className='relative h-64 w-full overflow-hidden p-2'>
          <img 
            src={imageSrc} 
            alt={`${property.details.propertyType} in ${property.address.city || 'Unknown City'}`}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 rounded-2xl'
            onError={() => setImgError(true)}
          />
          
          {/* Gradient overlay */}
          {/* <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20' /> */}
          
          {/* Status Badge */}
          <div className='absolute top-4 left-4'>
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white shadow-lg">
              {property.status || 'For Sale'}
            </Badge>
          </div>
          
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className='absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg'
          >
            <FaHeart className={`w-4 h-4 ${isLiked ? 'text-red-500' : 'text-gray-400'}`} />
          </button>
          
          {/* Carousel Controls */}
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImage}
                className='absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100'
              >
                <FaChevronLeft className="w-3 h-3 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100'
              >
                <FaChevronRight className="w-3 h-3 text-gray-700" />
              </button>
              
              {/* Image Counter */}
              <div className='absolute bottom-4 left-4 z-10'>
                <span className='bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium'>
                  {currentImageIndex + 1}/{totalImages}
                </span>
              </div>
            </>
          )}
          
          {/* Price Badge */}
          <div className='absolute bottom-4 right-4 flex flex-col items-end gap-1'>
            <span className='bg-black/60 text-primary-foreground px-4 py-1 rounded-md font-bold text-base shadow-lg backdrop-blur-sm'>
              {priceDisplay}
            </span>
            {isRental && (
              <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary border-secondary/30">
                For Rent
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content Section */}
        <div className='px-5 py-3'>
          {/* Property Type and Date */}
          <div className='flex items-center justify-between mb-3'>
            <Badge variant="outline" className="text-primary border-primary/20">
              {property.details.propertyType}
            </Badge>
            <div className='flex items-center text-gray-500 text-xs'>
              <FaClock className='mr-1.5 w-3 h-3' />
              <span>{formatListingDate(property.listedDate)}</span>
            </div>
          </div>
          
          {/* Location */}
          <div className='flex items-start mb-2'>
            <FaMapMarkerAlt className='mr-2 text-primary flex-shrink-0 mt-0.5' size={12} />
            <p className='text-gray-700 text-xs leading-relaxed truncate'>{property.address.location}</p>
          </div>
          
          {/* Property Details */}
          <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
            {property.details.numBedrooms > 0 && (
              <div className='flex items-center space-x-1 text-gray-700'>
                <FaBed className='text-primary' size={12} />
                <span className='text-xs font-medium ml-1'>{property.details.numBedrooms}</span>
                <span className='text-xs text-gray-500'>bed{property.details.numBedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {property.details.numBathrooms > 0 && (
              <div className='flex items-center space-x-1 text-gray-700'>
                <FaBath className='text-primary' size={12} />
                <span className='text-xs font-medium ml-1'>{property.details.numBathrooms}</span>
                <span className='text-xs text-gray-500'>bath{property.details.numBathrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className='flex items-center space-x-1 text-gray-700'>
              <FaRulerCombined className='text-primary' size={12} />
              <span className='text-xs font-medium ml-1'>
                {typeof property.details.sqft === 'number' 
                  ? property.details.sqft.toLocaleString() 
                  : property.details.sqft}
              </span>
              <span className='text-xs text-gray-500'>sqft</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className='flex gap-2 pt-4'>
            <Button variant="default" className="flex-1 h-8">
              <span className='text-primary'>View Details</span>
              <ArrowUpRight className='w-3.5 h-3.5 text-primary' />
            </Button>
            <Button variant="outline" className="h-8 px-4">
              <span className='text-primary'>Contact</span>
              <ArrowUpRight className='w-3.5 h-3.5 text-primary' />
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;