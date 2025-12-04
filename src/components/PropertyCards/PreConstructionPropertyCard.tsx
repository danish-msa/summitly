import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, MoreVertical, Share2, EyeOff, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PreConstructionPropertyCardProps, PreConstructionPropertyInput } from './types';

// Type for property with preCon
type PropertyWithPreCon = Extract<PreConstructionPropertyInput, { preCon?: unknown }>;

// Type guard to check if property has preCon
const hasPreCon = (property: PreConstructionPropertyInput): property is PropertyWithPreCon & { preCon: NonNullable<PropertyWithPreCon['preCon']> } => {
  return 'preCon' in property && property.preCon !== null && property.preCon !== undefined;
};

// Helper function to get images from property
const getImages = (property: PreConstructionPropertyInput): string[] => {
  if (Array.isArray(property.images)) {
    return property.images;
  }
  if (property.images && typeof property.images === 'object' && 'allImages' in property.images) {
    return property.images.allImages || [];
  }
  if (hasPreCon(property) && property.preCon.images && Array.isArray(property.preCon.images)) {
    return property.preCon.images;
  }
  if (property.images && typeof property.images === 'object' && 'imageUrl' in property.images) {
    return property.images.imageUrl ? [property.images.imageUrl] : [];
  }
  return ['/images/p1.jpg'];
};

// Helper function to get starting price
const getStartingPrice = (property: PreConstructionPropertyInput): number => {
  if (hasPreCon(property) && property.preCon.startingPrice != null && property.preCon.startingPrice > 0) {
    return property.preCon.startingPrice;
  }
  if ('startingPrice' in property && property.startingPrice != null && property.startingPrice > 0) {
    return property.startingPrice;
  }
  if ('listPrice' in property && property.listPrice) {
    return property.listPrice;
  }
  return 0;
};

// Helper function to get property ID
const getPropertyId = (property: PreConstructionPropertyInput): string => {
  return ('mlsNumber' in property ? property.mlsNumber : undefined) || 
         ('id' in property ? property.id : undefined) || 
         '';
};

// Helper function to get project name
const getProjectName = (property: PreConstructionPropertyInput): string => {
  if (hasPreCon(property) && property.preCon.projectName) {
    return property.preCon.projectName;
  }
  if ('projectName' in property && property.projectName) {
    return property.projectName;
  }
  return '';
};

// Helper function to get developer
const getDeveloper = (property: PreConstructionPropertyInput): string => {
  if (hasPreCon(property) && property.preCon.developer) {
    return property.preCon.developer;
  }
  if ('developer' in property && property.developer) {
    return property.developer;
  }
  return '';
};

// Helper function to get status
const getStatus = (property: PreConstructionPropertyInput): string => {
  if (hasPreCon(property) && property.preCon.status) {
    return property.preCon.status;
  }
  if ('status' in property && property.status) {
    return property.status;
  }
  return 'selling';
};

const PreConstructionPropertyCard = ({ property, onHide, className }: PreConstructionPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const images = getImages(property);
  const totalImages = images.length;
  const startingPrice = getStartingPrice(property);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(startingPrice);

  const imageSrc = imgError ? '/placeholder.svg' : images[currentImageIndex];

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

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const propertyId = getPropertyId(property);
    const projectName = getProjectName(property);
    const shareUrl = `${window.location.origin}/pre-construction/${propertyId}`;
    const shareText = `Check out ${projectName} - Pre-construction starting from ${formattedPrice}`;
    
    if (navigator.share) {
      navigator.share({
        title: projectName,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} - ${shareUrl}`).then(() => {
        console.log('Link copied to clipboard');
      }).catch(console.error);
    }
  };

  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onHide) {
      onHide();
    }
  };

  const handleRegisterInterest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const projectName = getProjectName(property);
    console.log('Register interest for:', projectName);
    // Add your registration logic here
  };

  const status = getStatus(property);
  
  const getStatusBadge = () => {
    switch (status) {
      case 'selling':
      case 'now-selling':
      case 'assignments':
      case 'platinum-access':
        return <Badge className="bg-[#22C06A] text-white border-0">Now Selling</Badge>;
      case 'coming-soon':
      case 'new-release-coming-soon':
        return <Badge className="bg-blue-500 text-white border-0">Coming Soon</Badge>;
      case 'sold-out':
        return <Badge variant="secondary">Sold Out</Badge>;
      default:
        return <Badge className="bg-[#22C06A] text-white border-0">Now Selling</Badge>;
    }
  };

  return (
    <div 
      className={cn(
        "group bg-card rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-hover)] cursor-pointer",
        className
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
      onClick={() => {
        const propertyId = getPropertyId(property);
        window.location.href = `/pre-construction/${propertyId}`;
      }}
    >
      <div className="flex flex-col h-full">
        {/* Image Section - Top */}
        <div className="relative overflow-hidden bg-muted">
          <div className="relative h-48">
            <img 
              src={imageSrc}
              alt={`${getProjectName(property)} - ${getDeveloper(property)}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgError(true)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-card/95 backdrop-blur-sm text-card-foreground border-0 shadow-lg text-xs">
                {(hasPreCon(property) && property.preCon.details?.propertyType) || 
                 ('details' in property ? property.details?.propertyType : undefined) || 
                 'Pre-Construction'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={toggleLike}
                className="p-1.5 rounded-full bg-card/95 backdrop-blur-sm hover:bg-card transition-colors duration-200"
              >
                <Heart 
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )} 
                />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 bg-card/95 backdrop-blur-sm hover:bg-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHide} className="cursor-pointer">
                    <EyeOff className="mr-2 h-4 w-4" />
                    <span>Hide</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1}/{totalImages}
              </div>
            </div>

            {/* Carousel Controls */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Section - Bottom */}
        <div className="p-4 flex flex-col flex-1">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {getStatusBadge()}
            <Badge variant="outline" className="text-xs">
              Pre-Construction
            </Badge>
          </div>

          <div className="flex flex-row gap-2">
            <div className="flex-1">
              {/* Project Name */}
              <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">
                {getProjectName(property)}
              </h3>

              {/* Developer */}
              <p className="text-xs text-muted-foreground mb-2">
                by {getDeveloper(property)}
              </p>

              {/* Location */}
              <div className="flex items-start mb-3">
                <MapPin className="mr-1 text-muted-foreground flex-shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-foreground line-clamp-1">
                  {(() => {
                    const address = 'address' in property ? property.address : undefined;
                    if (address) {
                      const street = ('street' in address ? address.street : undefined) || 
                                   (('streetNumber' in address || 'streetName' in address) 
                                     ? `${address.streetNumber || ''} ${address.streetName || ''}`.trim() 
                                     : undefined) ||
                                   ('location' in address ? address.location?.split(',')[0] : undefined) || '';
                      const city = 'city' in address ? address.city : '';
                      return street ? `${street}, ${city}` : city;
                    }
                    return 'Location not available';
                  })()}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {/* Price */}
              <div className="">
                <p className="text-xs text-muted-foreground">Starting from</p>
                <p className="text-xl font-bold text-foreground">{formattedPrice}</p>
              </div>
            </div>
          </div>
          

          

          {/* Property Details */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Bed className="text-muted-foreground" size={14} />
              <span className="text-xs text-foreground">
                {(hasPreCon(property) && property.preCon.details?.bedroomRange) || 
                 ('details' in property ? property.details?.bedroomRange : undefined) || 
                 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="text-muted-foreground" size={14} />
              <span className="text-xs text-foreground">
                {(hasPreCon(property) && property.preCon.details?.bathroomRange) || 
                 ('details' in property ? property.details?.bathroomRange : undefined) || 
                 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="text-muted-foreground" size={14} />
              <span className="text-xs text-foreground">
                {(hasPreCon(property) && property.preCon.details?.sqftRange) || 
                 ('details' in property ? property.details?.sqftRange : undefined) || 
                 'N/A'} sqft
              </span>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-start gap-1.5 p-2 bg-muted/50 rounded-lg">
              <Calendar className="text-primary flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="text-xs font-semibold text-foreground">
                  {(hasPreCon(property) && property.preCon.completion?.date) || 
                   ('completion' in property ? property.completion?.date : undefined) || 
                   'TBD'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 p-2 bg-muted/50 rounded-lg">
              <TrendingUp className="text-accent flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xs font-semibold text-foreground">
                  {(hasPreCon(property) && property.preCon.details?.availableUnits) || 
                   ('details' in property ? property.details?.availableUnits : undefined) || 
                   0}/
                  {(hasPreCon(property) && property.preCon.details?.totalUnits) || 
                   ('details' in property ? property.details?.totalUnits : undefined) || 
                   0}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleRegisterInterest}
            className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm mt-auto"
          >
            Register Interest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreConstructionPropertyCard;

