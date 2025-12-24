"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, Building2, Star, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/Auth/AuthModal';

const FeaturedPropertyCard = ({ property, className }: PreConstructionPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { data: session } = useSession();
  const { checkIsSaved, saveProperty, unsaveProperty, isSaving, isUnsaving } = useSavedProperties();
  const isSaved = checkIsSaved(property.id);
  
  // Load rating data from database
  const [ratingData, setRatingData] = useState<{
    average: number;
    total: number;
  }>({
    average: 0,
    total: 0
  });
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Lazy load ratings only when card is visible (using Intersection Observer)
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    // Check in-memory cache to avoid duplicate requests
    const cacheKey = `rating_${property.id}_pre-construction`;
    const cached = (window as Window & { __ratingCache?: Record<string, { data: unknown; timestamp: number }> }).__ratingCache?.[cacheKey];
    
    if (cached && cached.data) {
      // Check if cache is still valid (5 minutes)
      if (cached.timestamp && Date.now() - cached.timestamp < 300000) {
        setRatingData({
          average: cached.data.average || 0,
          total: cached.data.total || 0
        });
        return;
      }
    }

    // Only fetch when card is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Card is visible, fetch ratings
    const loadRatings = async () => {
      try {
        const { getProjectRating } = await import('@/lib/api/project-ratings');
        const data = await getProjectRating(property.id);
        setRatingData({
          average: data.average || 0,
          total: data.total || 0
        });
                // Cache is handled in the API function
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    };

    loadRatings();
            // Stop observing after first load
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before card is visible
        threshold: 0.1
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.disconnect();
    };
  }, [property.id]);
  
  const images = property.images;
  const totalImages = images.length;

  const hasPrice = property.startingPrice !== null && property.startingPrice !== undefined && property.startingPrice > 0;
  const priceValue = property.startingPrice ?? 0;
  const formattedPrice = hasPrice
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(priceValue)
    : 'Coming Soon';

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
        await unsaveProperty(property.id);
        toast({
          title: "Project Removed",
          description: "Project has been removed from your saved list.",
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
        });
      } else {
        await saveProperty({ mlsNumber: property.id });
        toast({
          title: "Project Saved",
          description: "Project has been added to your saved list.",
          variant: "success",
          icon: <Heart className="h-5 w-5 text-green-600 fill-green-600" />,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save project. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      });
    }
  };


  const handleRegisterInterest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Register interest for:', property.projectName);
    // Add your registration logic here
  };

  const getStatusBadge = () => {
    switch (property.status) {
      case 'selling':
        return <Badge className="bg-[#22C06A] text-white border-0">Now Selling</Badge>;
      case 'coming-soon':
        return <Badge className="bg-blue-500 text-white border-0">Coming Soon</Badge>;
      case 'sold-out':
        return <Badge variant="secondary">Sold Out</Badge>;
    }
  };

  return (
    <>
    <Link 
      ref={cardRef}
      href={`/pre-con/${property.id}`}
    >
      <div 
        className={cn(
          "group bg-card rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-hover)] cursor-pointer flex flex-col md:flex-row h-full",
          className
        )}
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Image Section - Left */}
        <div className="relative overflow-hidden bg-muted flex-shrink-0 w-full md:w-2/5 h-48 sm:h-56 md:h-full">
          <div className="relative h-full">
            <img 
              src={imageSrc}
              alt={`${property.projectName}${property.developer ? ` - ${property.developer}` : ''}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgError(true)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <Badge className="bg-card/95 backdrop-blur-sm text-card-foreground border-0 shadow-lg text-[10px] sm:text-xs">
                {property.details.propertyType}
              </Badge>
            </div>

            {/* Featured Badge */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <Badge className="bg-primary/95 backdrop-blur-sm text-white border-0 shadow-lg text-[10px] sm:text-xs font-semibold">
                Featured
              </Badge>
            </div>

            {/* Actions */}
            <div className="absolute top-12 right-3 flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || isUnsaving}
                className={cn(
                  "p-1.5 rounded-full bg-card/95 backdrop-blur-sm hover:bg-card transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  isSaved && "bg-red-50/95 hover:bg-red-50"
                )}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )} 
                />
              </button>
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

            {/* Address at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
              <div className="flex items-start">
                <MapPin className="mr-1.5 sm:mr-2 text-white flex-shrink-0 mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <p className="text-xs sm:text-sm text-white line-clamp-2">
                  {property.address.street}, {property.address.city}, {property.address.province}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Right */}
        <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1">
          {/* Top Section */}
          <div className="flex-1">
            {/* Status Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
              {getStatusBadge()}
            </div>

            {/* Project Name and Price Row - Mobile */}
            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2 md:hidden">
              <h3 className="text-lg font-bold text-foreground line-clamp-2 flex-1">
                {property.projectName}
              </h3>
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-muted-foreground mb-0.5">Starting from</p>
                <p className={`${hasPrice ? 'text-base' : 'text-sm'} font-bold text-foreground ${hasPrice ? 'whitespace-nowrap' : 'break-words'}`}>{formattedPrice}</p>
              </div>
            </div>

            {/* Project Name - Desktop */}
            <h3 className="hidden md:block text-xl md:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">
              {property.projectName}
            </h3>

            {/* Developer */}
            {property.developer && (
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Building2 className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {property.developer}
                </p>
              </div>
            )}

            {/* Rating Display */}
            {ratingData.total > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= Math.round(ratingData.average);
                    return (
                      <Star
                        key={star}
                        className={cn(
                          "h-2.5 w-2.5 sm:h-3 sm:w-3",
                          isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        )}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-foreground">{ratingData.average.toFixed(1)}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">/</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">5</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  ({ratingData.total} {ratingData.total === 1 ? 'vote' : 'votes'})
                </span>
              </div>
            )}

            {/* Property Details */}
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
              {property.details.bedroomRange && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Bed className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm text-foreground font-medium">{property.details.bedroomRange}</span>
                </div>
              )}
              {property.details.bathroomRange && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Bath className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm text-foreground font-medium">{property.details.bathroomRange}</span>
                </div>
              )}
              {property.details.sqftRange && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Maximize2 className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm text-foreground font-medium">{property.details.sqftRange} sqft</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section - Desktop Only */}
          <div className="hidden md:flex items-end justify-between gap-4">
            {/* Price */}
            <div className="flex-shrink-0 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Starting from</p>
              <p className={`${hasPrice ? 'text-xl md:text-2xl' : 'text-lg'} font-bold text-foreground ${hasPrice ? 'whitespace-nowrap' : 'break-words'}`}>{formattedPrice}</p>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={handleRegisterInterest}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Register Interest
            </Button>
          </div>

          {/* CTA Button - Mobile Only */}
          <Button 
            onClick={handleRegisterInterest}
            size="sm"
            className="md:hidden bg-secondary hover:bg-secondary/90 text-white font-semibold px-4 py-1.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-xs w-full"
          >
            Register Interest
          </Button>
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

export default FeaturedPropertyCard;

