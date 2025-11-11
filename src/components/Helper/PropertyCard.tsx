import React, { useState, useMemo } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, MoreVertical, Share2, EyeOff, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/Auth/AuthModal';

// Mock data type based on your original interface
interface PropertyListing {
  mlsNumber: string;
  listPrice: number;
  type: string; // "Lease" for rentals, "Sale" for sales
  images: {
    imageUrl: string;
    allImages: string[];
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
  onHide?: () => void;
}

const PropertyCard = ({ property, onHide }: PropertyCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { data: session } = useSession();
  const { checkIsSaved, saveProperty, unsaveProperty, isSaving, isUnsaving } = useSavedProperties();
  const isSaved = checkIsSaved(property.mlsNumber);
  
  // Get images array with proper fallbacks
  const images = useMemo(() => {
    const allImages = property.images?.allImages || [];
    const imageUrl = property.images?.imageUrl || '';
    
    // Combine all images and filter out empty/invalid URLs
    const validImages = [
      ...allImages,
      ...(imageUrl && !allImages.includes(imageUrl) ? [imageUrl] : [])
    ].filter(url => url && typeof url === 'string' && url.trim() !== '');
    
    // If no valid images, use fallback images
    if (validImages.length === 0) {
      return [
        '/images/p1.jpg',
        '/images/p2.jpg',
        '/images/p3.jpg',
        '/images/p4.jpg',
        '/images/p5.jpg',
      ];
    }
    
    return validImages;
  }, [property.images]);
  
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

  // Get current image with fallback
  const imageSrc = useMemo(() => {
    if (imgError || !images[currentImageIndex]) {
      // Try fallback images
      const fallbackIndex = currentImageIndex % 5;
      return `/images/p${fallbackIndex + 1}.jpg`;
    }
    return images[currentImageIndex];
  }, [images, currentImageIndex, imgError]);

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
    setImgError(false); // Reset error when changing images
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgError(false); // Reset error when changing images
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, show auth modal
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (isSaved) {
        await unsaveProperty(property.mlsNumber);
        toast({
          title: "Property Removed",
          description: "Property has been removed from your saved list.",
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
        });
      } else {
        await saveProperty({ mlsNumber: property.mlsNumber });
        toast({
          title: "Property Saved",
          description: "Property has been added to your saved list.",
          variant: "success",
          icon: <Heart className="h-5 w-5 text-green-600 fill-green-600" />,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save property. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create share URL
    const shareUrl = `${window.location.origin}/property/${property.mlsNumber}`;
    const shareText = `Check out this ${property.details.propertyType} for ${priceDisplay} in ${property.address.city}`;
    
    // Use Web Share API if available, otherwise fallback to clipboard
    if (navigator.share) {
      navigator.share({
        title: `${property.details.propertyType} - ${priceDisplay}`,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareText} - ${shareUrl}`).then(() => {
        // You could add a toast notification here
        console.log('Property link copied to clipboard');
      }).catch(console.error);
    }
  };

  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onHide) {
      onHide();
    }
    // You could add additional logic here like API calls to hide the property
    console.log('Property hidden:', property.mlsNumber);
  };

  return (
    <>
      <Link 
        href={`/property/${property.mlsNumber}`} 
        className="group cursor-pointer w-full block transition-transform duration-300"
        aria-label={`View details for ${property.details.propertyType} at ${property.address.city}`}
      >
        <div className='bg-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl' style={{ boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.05)' }}>
        {/* Image Section */}
        <div className='relative h-62 w-full overflow-hidden'>
          <img 
            src={imageSrc} 
            alt={`${property.details.propertyType} in ${property.address.city || 'Unknown City'}`}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 p-2 rounded-3xl'
            onError={(e) => {
              // Only set error if it's not already a fallback image
              if (!imageSrc.includes('/images/p')) {
                setImgError(true);
                // Try to load fallback immediately
                const fallbackIndex = currentImageIndex % 5;
                (e.target as HTMLImageElement).src = `/images/p${fallbackIndex + 1}.jpg`;
              }
            }}
            onLoad={() => {
              // Reset error if image loads successfully
              if (imgError) {
                setImgError(false);
              }
            }}
          />
          
          
          {/* Top badges row */}
          <div className='absolute top-5 left-5 flex items-center gap-2'>
            <Badge className="bg-brand-smoky-gray backdrop-blur-sm text-white hover:bg-brand-smoky-gray border-0 rounded-full px-4 py-1.5 text-xs font-light">
              {property.details.propertyType}
            </Badge>
          </div>
          
          {/* Date badge and Menu - top right */}
          <div className='absolute top-5 right-5 flex items-center gap-2'>
            <Badge variant="secondary" className="bg-card/95 backdrop-blur-sm hover:bg-card border-0 text-dark rounded-full px-4 py-1.5 text-xs font-medium">
              {formatListingDate(property.listedDate)}
            </Badge>
            
            {/* 3-dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-card/95 backdrop-blur-sm hover:bg-card/90 border-0 rounded-full shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-foreground" />
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
          
          {/* FOR SALE badge - bottom left */}
          <div className='absolute bottom-5 left-5'>
            <Badge className="bg-[#22C06A] text-white border-0 rounded-md px-2 py-1 text-xs font-medium shadow-lg">
              {property.status || 'FOR SALE'}
            </Badge>
          </div>
          
          {/* Save Button - moved to bottom right, outside image carousel controls */}
          <button
            onClick={handleSave}
            disabled={isSaving || isUnsaving}
            className={cn(
              'absolute bottom-5 right-5 p-2 rounded-full bg-card/95 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
              isSaved && 'bg-red-50/95 hover:bg-red-50'
            )}
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-all duration-200",
                isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
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
            <div className="flex items-center justify-between gap-2">
              <h3 className='text-xl font-bold text-foreground'>{priceDisplay}</h3>
              {isRental ? (
                <Badge variant="outline" className="text-xs bg-brand-celestial/20 text-black border-brand-icy-blue">
                  For Rent
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                  For Sale
                </Badge>
              )}
            </div>
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
      </Link>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default PropertyCard;