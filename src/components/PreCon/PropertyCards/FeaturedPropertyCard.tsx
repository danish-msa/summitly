"use client";

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const { getProjectRating } = await import('@/lib/api/project-ratings');
        const data = await getProjectRating(property.id);
        setRatingData({
          average: data.average || 0,
          total: data.total || 0
        });
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    };

    loadRatings();
  }, [property.id]);
  
  const images = property.images;
  const totalImages = images.length;

  const hasPrice = property.startingPrice !== null && property.startingPrice !== undefined && property.startingPrice > 0;
  const formattedPrice = hasPrice && property.startingPrice !== null
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(property.startingPrice)
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
    <Link href={`/pre-construction/${property.id}`}>
      <div 
        className={cn(
          "group bg-card rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-hover)] cursor-pointer flex flex-row h-full",
          className
        )}
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Image Section - Left */}
        <div className="relative overflow-hidden bg-muted flex-shrink-0 w-2/5">
          <div className="relative h-full">
            <img 
              src={imageSrc}
              alt={`${property.projectName}${property.developer ? ` - ${property.developer}` : ''}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgError(true)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-card/95 backdrop-blur-sm text-card-foreground border-0 shadow-lg text-xs">
                {property.details.propertyType}
              </Badge>
            </div>

            {/* Featured Badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary/95 backdrop-blur-sm text-white border-0 shadow-lg text-xs font-semibold">
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
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
              <div className="flex items-start">
                <MapPin className="mr-2 text-white flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-white line-clamp-2">
                  {property.address.street}, {property.address.city}, {property.address.province}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Right */}
        <div className="p-6 flex flex-col flex-1">
          {/* Top Section */}
          <div className="flex-1">
            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {getStatusBadge()}
            </div>

            {/* Project Name */}
            <h3 className="text-2xl font-bold text-foreground mb-2 line-clamp-2">
              {property.projectName}
            </h3>

            {/* Developer */}
            {property.developer && (
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="text-muted-foreground" size={16} />
                <p className="text-sm text-muted-foreground">
                  {property.developer}
                </p>
              </div>
            )}

            {/* Rating Display */}
            {ratingData.total > 0 && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= Math.round(ratingData.average);
                    return (
                      <Star
                        key={star}
                        className={cn(
                          "h-3 w-3",
                          isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        )}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-foreground">{ratingData.average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs text-muted-foreground">5</span>
                <span className="text-xs text-muted-foreground">
                  ({ratingData.total} {ratingData.total === 1 ? 'vote' : 'votes'})
                </span>
              </div>
            )}

            {/* Property Details */}
            <div className="flex flex-wrap gap-4 mb-4">
              {property.details.bedroomRange && (
                <div className="flex items-center gap-1.5">
                  <Bed className="text-muted-foreground" size={16} />
                  <span className="text-sm text-foreground font-medium">{property.details.bedroomRange}</span>
                </div>
              )}
              {property.details.bathroomRange && (
                <div className="flex items-center gap-1.5">
                  <Bath className="text-muted-foreground" size={16} />
                  <span className="text-sm text-foreground font-medium">{property.details.bathroomRange}</span>
                </div>
              )}
              {property.details.sqftRange && (
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="text-muted-foreground" size={16} />
                  <span className="text-sm text-foreground font-medium">{property.details.sqftRange} sqft</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-between gap-4">
            {/* Price */}
            <div className="flex-shrink-0 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Starting from</p>
              <p className={`${hasPrice ? 'text-2xl' : 'text-lg'} font-bold text-foreground ${hasPrice ? 'whitespace-nowrap' : 'break-words'}`}>{formattedPrice}</p>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={handleRegisterInterest}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Register Interest
            </Button>
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

export default FeaturedPropertyCard;

