"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { PropertyListing } from "@/lib/types";

interface Neighborhood {
  name: string;
  count: number;
}

interface AreaSelectorProps {
  properties?: PropertyListing[];
  cityName: string;
  onNeighborhoodSelect?: (neighborhoodName: string | null) => void;
  selectedNeighborhood?: string | null;
}

export const AreaSelector: React.FC<AreaSelectorProps> = ({ 
  cityName, 
  properties = [],
  onNeighborhoodSelect,
  selectedNeighborhood: externalSelectedNeighborhood
}) => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedNeighborhood = externalSelectedNeighborhood || null;

  // Extract neighborhoods from properties
  useEffect(() => {
    if (!properties || properties.length === 0) {
      setNeighborhoods([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Count properties per neighborhood
      const neighborhoodMap = new Map<string, number>();

      properties.forEach(property => {
        const neighborhoodName = property.address?.neighborhood;
        
        if (neighborhoodName) {
          const currentCount = neighborhoodMap.get(neighborhoodName) || 0;
          neighborhoodMap.set(neighborhoodName, currentCount + 1);
        }
      });

      // Convert to array and sort by count
      const neighborhoodsList: Neighborhood[] = Array.from(neighborhoodMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setNeighborhoods(neighborhoodsList);
    } catch (error) {
      console.error('Error extracting neighborhoods:', error);
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  }, [properties]);

  // Filter neighborhoods based on search query
  const filteredNeighborhoods = useMemo(() => {
    if (!searchQuery.trim()) {
      return neighborhoods;
    }
    const query = searchQuery.toLowerCase().trim();
    return neighborhoods.filter(neighborhood =>
      neighborhood.name.toLowerCase().includes(query)
    );
  }, [neighborhoods, searchQuery]);

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhoodName: string | null) => {
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(neighborhoodName);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading neighborhoods...</span>
        </div>
      </div>
    );
  }

  const displayedNeighborhoods = showAll 
    ? filteredNeighborhoods 
    : filteredNeighborhoods.slice(0, 12);

  return (
    <div className="bg-white p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Neighbourhoods in {cityName}
        </h2>
        {filteredNeighborhoods.length > 12 && (
          <Button
            variant="link"
            className="text-primary font-medium"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : `Show All (${filteredNeighborhoods.length})`}
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search neighbourhoods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {neighborhoods.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No neighborhoods found with properties. {properties?.length || 0} properties loaded.
        </div>
      ) : filteredNeighborhoods.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No neighborhoods found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {displayedNeighborhoods.map((neighborhood) => (
            <Button
              key={neighborhood.name}
              variant={selectedNeighborhood === neighborhood.name ? "default" : "ghost"}
              className="w-full justify-start hover:bg-background/80"
              onClick={() => handleNeighborhoodSelect(
                selectedNeighborhood === neighborhood.name ? null : neighborhood.name
              )}
            >
              {neighborhood.name}
              <Badge variant="secondary" className="ml-auto">
                {neighborhood.count}
              </Badge>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
