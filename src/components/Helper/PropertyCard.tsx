import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  const imageSrc = imgError ? '/placeholder.svg' : images[currentImageIndex];

  const formatListingDate = (dateString?: string) => {
    if (!dateString) return 'TODAY';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'YESTERDAY';
    if (diffDays < 7) return `${diffDays}D AGO`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

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
    <div className="group cursor-pointer w-full">
      <div className='bg-card rounded-3xl overflow-hidden transition-all duration-500 border border-border/50' style={{ boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.05)' }}>
        {/* Image Section */}
        <div className='relative h-62 w-full overflow-hidden'>
          <img 
            src={imageSrc} 
            alt={`${property.details.propertyType} in ${property.address.city || 'Unknown City'}`}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 p-2 rounded-3xl'
            onError={() => setImgError(true)}
          />
          
          {/* Gradient overlay */}
          {/* <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20' /> */}
          
          {/* Top badges row */}
          <div className='absolute top-5 left-5 flex items-center gap-2'>
            <Badge className="bg-brand-smoky-gray backdrop-blur-sm text-white hover:bg-brand-smoky-gray border-0 rounded-full px-4 py-1.5 text-xs font-light">
              {property.details.propertyType}
            </Badge>
          </div>
          
          {/* Date badge - top right */}
          <div className='absolute top-5 right-5 flex items-center gap-2'>
            <Badge variant="secondary" className="bg-card/95 backdrop-blur-sm hover:bg-card border-0 text-dark rounded-full px-4 py-1.5 text-xs font-medium">
              {formatListingDate(property.listedDate)}
            </Badge>
          </div>
          
          {/* FOR SALE badge - bottom left */}
          <div className='absolute bottom-5 left-5'>
            <Badge className="bg-[#22C06A] text-white border-0 rounded-md px-2 py-1 text-xs font-medium shadow-lg">
              {property.status || 'FOR SALE'}
            </Badge>
          </div>
          
          {/* Like Button - moved to bottom right, outside image carousel controls */}
          <button
            onClick={toggleLike}
            className='absolute bottom-5 right-5 p-2 rounded-full bg-card/95 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-lg'
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-all duration-200",
                isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )} 
            />
          </button>
          
          {/* Carousel Controls */}
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImage}
                className='absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 z-10'
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={nextImage}
                className='absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 z-10'
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
              
              {/* Image Counter */}
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                <span className='bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium'>
                  {currentImageIndex + 1}/{totalImages}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Content Section */}
        <div className='p-4'>
          {/* Price */}
          <div className='mb-3 flex items-center justify-between'>
            <div className="flex items-center gap-2">
              <h3 className='text-xl font-bold text-foreground'>{priceDisplay}</h3>
              {isRental && (
                <Badge variant="secondary" className="text-xs">
                  For Rent
                </Badge>
              )}
            </div>
            {!isRental && (
              <p className='text-xs bg-brand-celestial/20 py-1 px-2 rounded-md mt-0.5'>
                ${Math.round(property.listPrice / 12).toLocaleString()}/month*
              </p>
            )}
          </div>
          
          {/* Property Title/Name - placeholder, you can add this to the interface */}
          <h4 className='text-sm font-body font-medium text-foreground mb-2 line-clamp-1'>
            Premium {property.details.propertyType}
          </h4>
          
          {/* Location */}
          <div className='flex items-start mb-4'>
            <MapPin className='mr-1 text-muted-foreground flex-shrink-0 mt-0.5' size={12} />
            <p className='text-xs font-light text-foreground line-clamp-1'>{property.address.location}</p>
          </div>
          
          {/* Property Details */}
          <div className='flex items-center gap-4'>
            {property.details.numBedrooms > 0 && (
              <div className='flex items-center gap-2 text-foreground'>
                <Bed className='text-muted-foreground' size={12} />
                <span className='text-xs font-light'>{property.details.numBedrooms}+{Math.max(0, property.details.numBedrooms - 2)} Bed</span>
              </div>
            )}
            
            {property.details.numBathrooms > 0 && (
              <div className='flex items-center gap-2 text-foreground'>
                <Bath className='text-muted-foreground' size={12} />
                <span className='text-xs font-light'>{property.details.numBathrooms} Bath</span>
              </div>
            )}
            
            <div className='flex items-center gap-2 text-foreground'>
              <Maximize2 className='text-muted-foreground' size={12} />
              <span className='text-xs font-light'>
                {typeof property.details.sqft === 'number' 
                  ? property.details.sqft.toLocaleString() 
                  : property.details.sqft} sqft
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;