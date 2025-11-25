import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, MoreVertical, Share2, EyeOff, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PreConstructionPropertyCardProps } from './types';

const PreConstructionPropertyCard = ({ property, onHide, className }: PreConstructionPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Get images from property - handle both PropertyListing format and PreConstructionProperty format
  const images = (property as any).images?.allImages || 
                 (property as any).images || 
                 ((property as any).preCon?.images && Array.isArray((property as any).preCon.images) ? (property as any).preCon.images : []) ||
                 [(property as any).images?.imageUrl || '/images/p1.jpg'];
  const totalImages = images.length;

  // Get starting price - handle both formats
  const startingPrice = (property as any).preCon?.startingPrice || 
                        (property as any).startingPrice || 
                        (property as any).listPrice || 
                        0;

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
    const propertyId = (property as any).mlsNumber || (property as any).id;
    const projectName = (property as any).preCon?.projectName || (property as any).projectName;
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
    const projectName = (property as any).preCon?.projectName || (property as any).projectName;
    console.log('Register interest for:', projectName);
    // Add your registration logic here
  };

  // Get status from property - handle both formats
  const status = (property as any).preCon?.status || (property as any).status || 'selling';
  
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
        const propertyId = (property as any).mlsNumber || (property as any).id;
        window.location.href = `/pre-construction/${propertyId}`;
      }}
    >
      <div className="flex flex-col h-full">
        {/* Image Section - Top */}
        <div className="relative overflow-hidden bg-muted">
          <div className="relative h-48">
            <img 
              src={imageSrc}
              alt={`${(property as any).preCon?.projectName || (property as any).projectName} - ${(property as any).preCon?.developer || (property as any).developer}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgError(true)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-card/95 backdrop-blur-sm text-card-foreground border-0 shadow-lg text-xs">
                {(property as any).preCon?.details?.propertyType || (property as any).details?.propertyType || (property as any).details?.propertyType || 'Pre-Construction'}
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
                {(property as any).preCon?.projectName || (property as any).projectName}
              </h3>

              {/* Developer */}
              <p className="text-xs text-muted-foreground mb-2">
                by {(property as any).preCon?.developer || (property as any).developer}
              </p>

              {/* Location */}
              <div className="flex items-start mb-3">
                <MapPin className="mr-1 text-muted-foreground flex-shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-foreground line-clamp-1">
                  {(() => {
                    const address = (property as any).address;
                    if (address) {
                      const street = address.street || 
                                   `${address.streetNumber || ''} ${address.streetName || ''}`.trim() ||
                                   address.location?.split(',')[0] || '';
                      const city = address.city || '';
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
                {(property as any).preCon?.details?.bedroomRange || (property as any).details?.bedroomRange || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="text-muted-foreground" size={14} />
              <span className="text-xs text-foreground">
                {(property as any).preCon?.details?.bathroomRange || (property as any).details?.bathroomRange || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="text-muted-foreground" size={14} />
              <span className="text-xs text-foreground">
                {(property as any).preCon?.details?.sqftRange || (property as any).details?.sqftRange || 'N/A'} sqft
              </span>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-start gap-1.5 p-2 bg-muted/50 rounded-lg">
              <Calendar className="text-primary flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-xs font-semibold text-foreground">
                  {(property as any).preCon?.completion?.date || (property as any).completion?.date || 'TBD'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 p-2 bg-muted/50 rounded-lg">
              <TrendingUp className="text-accent flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xs font-semibold text-foreground">
                  {(property as any).preCon?.details?.availableUnits || (property as any).details?.availableUnits || 0}/
                  {(property as any).preCon?.details?.totalUnits || (property as any).details?.totalUnits || 0}
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

