"use client";

import { MapPin, Building2, Bed, Bath, Maximize2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';
import { useEffect, useState } from 'react';

const PreConstructionPropertyCardV3 = ({ 
  property,
  className 
}: PreConstructionPropertyCardProps) => {
  const image = property.images[0] || '/placeholder.svg';
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.startingPrice);

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
    const yearMatch = property.completion.date.match(/\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  };

  return (
    <Link href={`/pre-construction/${property.id}`}>
      <Card className={cn(
        "group hover:shadow-lg transition-all duration-300 overflow-hidden border-border cursor-pointer",
        className
      )}>
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={property.projectName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>
          {/* Move in Year Badge */}
          {getOccupancyYear() && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary/95 backdrop-blur-sm text-white border-0 text-xs font-medium">
                Move in {getOccupancyYear()}
              </Badge>
            </div>
          )}
          {/* Location Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="text-white flex-shrink-0" size={10} />
              <p className="text-xs text-white font-medium line-clamp-1">
                {property.address.city}, {property.address.province}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4 p-4 pb-0 mb-3">
            <div className="flex-1 w-[70%]">
              <h4 className="font-semibold text-base leading-tight text-foreground mb-1 line-clamp-2">
                {property.projectName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{property.developer}</span>
              </div>
              {/* Rating Display */}
              {ratingData.total > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
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
                  <span className="text-xs font-medium text-foreground">
                    {ratingData.average.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({ratingData.total})
                  </span>
                </div>
              )}
            </div>
            <div className="text-right w-[30%]">
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="text-lg font-bold text-foreground whitespace-nowrap">{formattedPrice}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 px-4 py-2">
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              <span>{property.details.bedroomRange}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              <span>{property.details.bathroomRange}</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              <span>{property.details.sqftRange}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PreConstructionPropertyCardV3;

