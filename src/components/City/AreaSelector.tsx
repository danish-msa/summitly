"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PropertyListing } from "@/lib/types";

interface Neighborhood {
  name: string;
  count?: number;
}

interface Area {
  name: string;
  neighborhoods: Neighborhood[];
}

interface AreaSelectorProps {
  properties?: PropertyListing[];
  cityName: string;
  onAreaSelect?: (areaName: string | null) => void;
  onNeighborhoodSelect?: (neighborhoodName: string | null) => void;
  selectedArea?: string | null;
  selectedNeighborhood?: string | null;
}

// Mock areas data (similar to lovable.dev example)
const mockAreasData: Area[] = [
  {
    name: "Downtown",
    neighborhoods: [
      { name: "King West", count: 344 },
      { name: "Entertainment District", count: 189 },
      { name: "Financial District", count: 156 },
      { name: "CityPlace", count: 234 },
      { name: "Harbourfront", count: 167 },
      { name: "Waterfront Communities", count: 298 },
      { name: "Church-Wellesley", count: 123 },
      { name: "Garden District", count: 98 },
      { name: "St. Lawrence", count: 145 },
      { name: "Corktown", count: 87 },
    ],
  },
  {
    name: "East End",
    neighborhoods: [
      { name: "Leslieville", count: 201 },
      { name: "The Beaches", count: 178 },
      { name: "Riverdale", count: 145 },
      { name: "East York", count: 167 },
      { name: "The Danforth", count: 189 },
    ],
  },
  {
    name: "East York",
    neighborhoods: [
      { name: "Thorncliffe Park", count: 123 },
      { name: "Flemingdon Park", count: 98 },
      { name: "Leaside", count: 145 },
    ],
  },
  {
    name: "Etobicoke",
    neighborhoods: [
      { name: "Mimico", count: 156 },
      { name: "Long Branch", count: 134 },
      { name: "Islington", count: 167 },
    ],
  },
  {
    name: "Midtown | Central",
    neighborhoods: [
      { name: "Yonge & Eglinton", count: 245 },
      { name: "Davisville Village", count: 189 },
      { name: "Forest Hill", count: 167 },
    ],
  },
  {
    name: "North York",
    neighborhoods: [
      { name: "Willowdale", count: 234 },
      { name: "North York Centre", count: 198 },
      { name: "Bayview Village", count: 145 },
    ],
  },
  {
    name: "Scarborough",
    neighborhoods: [
      { name: "Scarborough City Centre", count: 178 },
      { name: "Agincourt", count: 156 },
      { name: "West Hill", count: 134 },
    ],
  },
  {
    name: "West End",
    neighborhoods: [
      { name: "Liberty Village", count: 267 },
      { name: "Parkdale", count: 198 },
      { name: "High Park", count: 156 },
      { name: "Roncesvalles", count: 145 },
    ],
  },
  {
    name: "York Crosstown",
    neighborhoods: [
      { name: "The Junction", count: 178 },
      { name: "Weston", count: 134 },
      { name: "Mount Dennis", count: 112 },
    ],
  },
];

export const AreaSelector: React.FC<AreaSelectorProps> = ({ 
  cityName, 
  properties = [],
  onAreaSelect,
  onNeighborhoodSelect,
  selectedArea: externalSelectedArea,
  selectedNeighborhood: externalSelectedNeighborhood
}) => {
  const [showAll, setShowAll] = useState(false);
  const [internalSelectedArea, setInternalSelectedArea] = useState<string | null>(null);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState(true);

  // Use external selected area if provided, otherwise use internal state
  const selectedArea = externalSelectedArea !== undefined ? externalSelectedArea : internalSelectedArea;
  const selectedNeighborhood = externalSelectedNeighborhood || null;

  // Extract areas and neighborhoods from properties
  const extractAreasFromProperties = (): Area[] => {
    if (!properties || properties.length === 0) {
      return mockAreasData; // Fallback to mock data
    }

    // Group properties by area and neighborhood
    const areaMap = new Map<string, Map<string, number>>();

    properties.forEach(property => {
      const areaName = property.address?.area;
      const neighborhoodName = property.address?.neighborhood;
      
      if (areaName && neighborhoodName) {
        if (!areaMap.has(areaName)) {
          areaMap.set(areaName, new Map());
        }
        const neighborhoodMap = areaMap.get(areaName)!;
        const currentCount = neighborhoodMap.get(neighborhoodName) || 0;
        neighborhoodMap.set(neighborhoodName, currentCount + 1);
      }
    });

    // Convert to Area[] format
    const areasData: Area[] = Array.from(areaMap.entries()).map(([areaName, neighborhoodMap]) => {
      const neighborhoods: Neighborhood[] = Array.from(neighborhoodMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => (b.count || 0) - (a.count || 0));

      return {
        name: areaName,
        neighborhoods
      };
    }).sort((a, b) => b.neighborhoods.length - a.neighborhoods.length);

    return areasData.length > 0 ? areasData : mockAreasData; // Fallback if no data
  };

  const areasData = extractAreasFromProperties();

  const selectedAreaData = areasData.find((area) => area.name === selectedArea || (selectedArea === null && areasData.length > 0));

  // Set default selected area on first render
  useEffect(() => {
    if (areasData.length > 0 && !selectedArea) {
      const defaultArea = areasData[0].name;
      if (externalSelectedArea === undefined) {
        setInternalSelectedArea(defaultArea);
      }
      if (onAreaSelect) {
        onAreaSelect(defaultArea);
      }
    }
  }, [selectedArea, areasData, externalSelectedArea, onAreaSelect]);

  // Handle area selection
  const handleAreaSelect = (areaName: string) => {
    if (externalSelectedArea === undefined) {
      setInternalSelectedArea(areaName);
    }
    if (onAreaSelect) {
      onAreaSelect(areaName);
    }
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(null); // Reset neighborhood when area changes
    }
    setExpandedNeighborhoods(true);
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhoodName: string) => {
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(neighborhoodName);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Areas in {cityName}
        </h2>
        {areasData.length > 1 && (
          <Button
            variant="link"
            className="text-primary font-medium"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "Show All"}
          </Button>
        )}
      </div>

      {!showAll && areasData.length > 1 ? (
        <div className="flex gap-3 flex-wrap">
          {areasData.map((area) => (
            <Button
              key={area.name}
              variant={selectedArea === area.name ? "default" : "outline"}
              onClick={() => handleAreaSelect(area.name)}
              className="relative"
            >
              {area.name}
              {selectedArea === area.name && (
                <Badge variant="secondary" className="ml-2">
                  {area.neighborhoods.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      ) : areasData.length > 1 ? (
        <Tabs value={selectedArea || areasData[0]?.name || ""} onValueChange={handleAreaSelect} className="w-full">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-2 bg-brand-glacier p-2">
            {areasData.map((area) => (
              <TabsTrigger
                key={area.name}
                value={area.name}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {selectedAreaData && (
        <div className="bg-brand-icy-blue rounded-lg p-4 space-y-3">
          <button
            onClick={() => setExpandedNeighborhoods(!expandedNeighborhoods)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {selectedAreaData.name}
              </span>
              <Badge variant="secondary">
                {selectedAreaData.neighborhoods.length} Neighbourhoods
              </Badge>
            </div>
            {expandedNeighborhoods ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandedNeighborhoods && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
              {selectedAreaData.neighborhoods.map((neighborhood) => (
                <Button
                  key={neighborhood.name}
                  variant={selectedNeighborhood === neighborhood.name ? "default" : "ghost"}
                  className="w-full justify-start hover:bg-background/80"
                  onClick={() => handleNeighborhoodSelect(neighborhood.name)}
                >
                  {neighborhood.name}
                  {neighborhood.count && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {neighborhood.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

