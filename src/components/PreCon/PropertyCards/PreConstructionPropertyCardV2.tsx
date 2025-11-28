"use client";

import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, ChevronLeft, ChevronRight, MoreVertical, Share2, EyeOff, Calendar, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';

const PreConstructionPropertyCardV2 = ({ property, onHide, className }: PreConstructionPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const images = property.images;
  const totalImages = images.length;

  const hasPrice = property.startingPrice != null && property.startingPrice > 0;
  const priceValue = property.startingPrice ?? 0;
  const formattedPrice = hasPrice 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
        notation: 'compact'
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

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/pre-construction/${property.id}`;
    const shareText = `Check out ${property.projectName} - Pre-construction starting from ${formattedPrice}`;
    
    if (navigator.share) {
      navigator.share({
        title: property.projectName,
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

  const getStatusBadge = () => {
    switch (property.status) {
      case 'selling':
        return <Badge className="bg-green-600 text-white border-0 text-xs px-2 py-0.5">Now Selling</Badge>;
      case 'coming-soon':
        return <Badge className="bg-blue-600 text-white border-0 text-xs px-2 py-0.5">Coming Soon</Badge>;
      case 'sold-out':
        return <Badge className="bg-gray-600 text-white border-0 text-xs px-2 py-0.5">Sold Out</Badge>;
    }
  };

  return (
    <Link href={`/pre-construction/${property.id}`}>
      <div 
        className={cn(
          "group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer border border-gray-100",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Image Section */}
          <div className="relative overflow-hidden bg-gray-100">
            <div className="relative h-64">
              <img 
                src={imageSrc}
                alt={`${property.projectName}${property.developer ? ` - ${property.developer}` : ''}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Status Badge - Top Left */}
              <div className="absolute top-4 left-4 z-10">
                {getStatusBadge()}
              </div>

              {/* Actions - Top Right */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={toggleLike}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4 transition-all",
                      isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
                    )} 
                  />
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
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

              {/* Project Name Overlay - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
                  {property.projectName}
                </h3>
                <p className="text-sm text-white/90 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.address.city}, {property.address.province}
                </p>
              </div>

              {/* Image Counter */}
              {totalImages > 1 && (
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {currentImageIndex + 1}/{totalImages}
                  </div>
                </div>
              )}

              {/* Carousel Controls */}
              {totalImages > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-5 flex flex-col flex-1 bg-white">
            {/* Two Column Layout */}
            <div className="flex items-start justify-between gap-4 pb-4">
              {/* Left Side - Developer Info & Property Details */}
              <div className="flex flex-col gap-3 flex-1">
                {/* Developer Info */}
                {property.developer && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600 font-medium">
                      {property.developer}
                    </p>
                  </div>
                )}

                {/* Property Details */}
                <div className="flex flex-wrap gap-4">
                  {property.details.bedroomRange && (
                    <div className="flex items-center gap-2">
                      <Bed className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-700 font-medium">{property.details.bedroomRange}</span>
                    </div>
                  )}
                  {property.details.bathroomRange && (
                    <div className="flex items-center gap-2">
                      <Bath className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-700 font-medium">{property.details.bathroomRange}</span>
                    </div>
                  )}
                  {property.details.sqftRange && (
                    <div className="flex items-center gap-2">
                      <Maximize2 className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-700 font-medium">{property.details.sqftRange}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Price */}
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Starting from</p>
                <p className={`${hasPrice ? 'text-2xl' : 'text-sm'} font-bold text-gray-900 ${hasPrice ? 'whitespace-nowrap' : 'break-words'}`}>{formattedPrice}</p>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {property.completion.date && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Calendar className="text-primary flex-shrink-0" size={16} />
                  <div>
                    <p className="text-xs text-gray-500">Completion</p>
                    <p className="text-sm font-semibold text-gray-900">{property.completion.date}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Users className="text-accent flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-semibold text-gray-900">{property.details.availableUnits} units</p>
                </div>
              </div>
            </div>

            {/* Construction Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">Construction Progress</p>
                <p className="text-xs font-bold text-gray-900">{property.completion.progress}%</p>
              </div>
              <Progress value={property.completion.progress} className="h-2" />
            </div>

            {/* CTA Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PreConstructionPropertyCardV2;

