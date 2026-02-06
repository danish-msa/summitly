"use client";

import { MapPin, Building2, Bed, Bath, Maximize2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';
import { useEffect, useState, useRef } from 'react';

const PreConstructionPropertyCardV3 = ({ 
  property,
  className 
}: PreConstructionPropertyCardProps) => {
  const image = property.images[0] || '/placeholder.svg';
  const hasPrice = property.startingPrice && property.startingPrice > 0;
  const formattedPrice = hasPrice 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(property.startingPrice || 0)
    : 'Coming Soon';

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
        const cachedData = cached.data as { average?: number; total?: number };
        setRatingData({
          average: cachedData.average || 0,
          total: cachedData.total || 0
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

  const getStatusBadge = () => {
    switch (property.status) {
      case 'selling':
        return <Badge className="bg-[#22C06A] text-white border-0 text-xs">Now Selling</Badge>;
      case 'coming-soon':
        return <Badge className="bg-blue-500 text-white border-0 text-xs">Coming Soon</Badge>;
      case 'sold-out':
        return <Badge variant="secondary" className="text-xs">Sold Out</Badge>;
    }
  };

  const getOccupancyYear = () => {
    // Use occupancyYear if available, otherwise extract from completion.date
    if (property.occupancyYear) {
      return property.occupancyYear;
    }
    // Extract year from completion.date (e.g., "Q4 2025" -> 2025)
    if (!property.completion.date) return null;
    const yearMatch = property.completion.date.match(/\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  };

  return (
    <Link 
      ref={cardRef}
      href={`/pre-con/${property.id}`} 
      className="h-full flex"
    >
      <Card 
        className={cn(
          "group p-0 hover:shadow-lg transition-all duration-300 overflow-hidden border-border cursor-pointer h-full w-full flex flex-col",
          className
        )}
      >
        <div className="aspect-video relative overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={image} 
            alt={property.projectName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-10">
            {getStatusBadge()}
          </div>
          {/* Rating Display - Top Left */}
          {ratingData.total > 0 && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= Math.round(ratingData.average);
                  return (
                    <Star
                      key={star}
                      className={cn(
                        "h-3 w-3",
                        isActive
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {ratingData.average.toFixed(1)}
              </span>
            </div>
          )}
          {/* Move in Year Badge */}
          {getOccupancyYear() && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-primary/95 backdrop-blur-sm text-white border-0 text-xs font-medium">
                Move in {getOccupancyYear()}
              </Badge>
            </div>
          )}
          {/* Location Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 z-10">
            <div className="flex items-center gap-1.5">
              <MapPin className="text-white flex-shrink-0" size={10} />
              <p className="text-xs text-white font-medium line-clamp-1">
                {property.address.city}, {property.address.province}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4 p-4 pb-0 mb-3 flex-1">
            <div className="flex-1 w-[65%]">
              <h4 className="font-semibold text-base leading-tight text-foreground mb-1 line-clamp-2">
                {property.projectName}
              </h4>
              {property.developer && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{property.developer}</span>
                </div>
              )}
            </div>
            <div className="text-right w-[35%]">
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className={`${hasPrice ? 'text-lg' : 'text-sm'} font-bold text-foreground ${hasPrice ? 'whitespace-nowrap' : 'break-words'}`}>{formattedPrice}</p>
            </div>
          </div>
          {/* Property details at bottom - always visible */}
          {(property.details.bedroomRange || property.details.bathroomRange || property.details.sqftRange) && (
            <div className="flex items-center gap-4 px-4 py-2 border-t border-border/50">
              {property.details.bedroomRange && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bed className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>{property.details.bedroomRange}</span>
                </div>
              )}
              {property.details.bathroomRange && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bath className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>{property.details.bathroomRange}</span>
                </div>
              )}
              {property.details.sqftRange && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Maximize2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>{property.details.sqftRange}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default PreConstructionPropertyCardV3;

