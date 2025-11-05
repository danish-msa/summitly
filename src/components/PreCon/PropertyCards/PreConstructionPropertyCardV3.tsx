"use client";

import { Calendar, MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PreConstructionPropertyCardProps } from './types';

const PreConstructionPropertyCardV3 = ({ 
  property,
  onHide,
  className 
}: PreConstructionPropertyCardProps) => {
  const location = `${property.address.street}, ${property.address.city}, ${property.address.province}`;
  const image = property.images[0] || '/placeholder.svg';
  const priceRange = `Starting from ${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.startingPrice)}`;

  // Determine status based on property status
  const getStatus = (): "upcoming" | "this-week" | "today" => {
    if (property.status === 'selling') return 'today';
    if (property.status === 'coming-soon') return 'this-week';
    return 'upcoming';
  };

  const status = getStatus();

  const getStatusColor = () => {
    switch (status) {
      case "today":
        return "bg-primary text-primary-foreground";
      case "this-week":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 ${className || ''}`}>
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={property.projectName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor()}>
            {status === "today" ? "Launching Today" : status === "this-week" ? "This Week" : "Upcoming"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {property.projectName}
          </h3>
          <p className="text-sm text-muted-foreground">{property.developer}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{property.completion.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{property.details.totalUnits} Units</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <p className="text-sm font-medium text-foreground">{priceRange}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreConstructionPropertyCardV3;

