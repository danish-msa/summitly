"use client";

import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';

const FeaturedPropertyCard = ({ property, onHide, className }: PreConstructionPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const images = property.images;
  const totalImages = images.length;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.startingPrice);

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
              alt={`${property.projectName} - ${property.developer}`}
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
            </div>

            {/* Image Counter */}
            {totalImages > 1 && (
              <div className="absolute bottom-16 right-3">
                <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                  {currentImageIndex + 1}/{totalImages}
                </div>
              </div>
            )}

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
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="text-muted-foreground" size={16} />
              <p className="text-sm text-muted-foreground">
                {property.developer}
              </p>
            </div>

            {/* Property Details */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <Bed className="text-muted-foreground" size={16} />
                <span className="text-sm text-foreground font-medium">{property.details.bedroomRange}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="text-muted-foreground" size={16} />
                <span className="text-sm text-foreground font-medium">{property.details.bathroomRange}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize2 className="text-muted-foreground" size={16} />
                <span className="text-sm text-foreground font-medium">{property.details.sqftRange} sqft</span>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-between">
            {/* Price */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Starting from</p>
              <p className="text-2xl font-bold text-foreground">{formattedPrice}</p>
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
  );
};

export default FeaturedPropertyCard;

