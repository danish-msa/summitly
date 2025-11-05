"use client";

import { MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import type { PreConstructionPropertyCardProps } from './types';

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
          {/* Location Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="text-white flex-shrink-0" size={14} />
              <p className="text-sm text-white font-medium line-clamp-1">
                {property.address.city}, {property.address.province}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">
                {property.projectName}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">{property.developer}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Starting from</p>
              <p className="text-lg font-bold text-foreground whitespace-nowrap">{formattedPrice}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PreConstructionPropertyCardV3;

