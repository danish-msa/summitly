"use client"

import React, { useState, useMemo } from 'react'
import { PropertyListing } from '@/lib/types'
import { UnitListing } from '@/lib/types/units'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Maximize2, Eye } from 'lucide-react'
import Link from 'next/link'
import ForSaleSoldOutToggle from './ForSaleSoldOutToggle'
import PriceFilter from '@/components/common/filters/PriceFilter'
import BedroomFilter from '@/components/common/filters/BedroomFilter'
import SquareFeetFilter from '@/components/common/filters/SquareFeetFilter'
import { FilterChangeEvent } from '@/lib/types/filters'
import { getPreConUnits } from '@/data/mockPreConData'

interface AvailableUnitsProps {
  property: PropertyListing;
}

type TabType = "for-sale" | "sold-out";
type SortOption = "price-low" | "price-high" | "beds-low" | "beds-high";

const AvailableUnits: React.FC<AvailableUnitsProps> = ({ property }) => {
  const preCon = property.preCon;
  const propertyId = property.mlsNumber || 'featured-1';
  
  const [activeTab, setActiveTab] = useState<TabType>("for-sale");
  const [sortBy] = useState<SortOption>("price-low");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [minSquareFeet, setMinSquareFeet] = useState<number | undefined>(undefined);
  const [maxSquareFeet, setMaxSquareFeet] = useState<number | undefined>(undefined);

  // Use real units from property data if available, otherwise fall back to mock
  const realUnits = (property.preCon as any)?.units || []
  const mockUnits = getPreConUnits(propertyId)
  const units = realUnits.length > 0 ? realUnits.map((unit: any) => ({
    id: unit.id,
    name: unit.name || unit.unitName,
    beds: unit.beds,
    baths: unit.baths,
    sqft: unit.sqft,
    price: unit.price,
    maintenanceFee: unit.maintenanceFee || 0,
    status: unit.status === 'for-sale' ? 'for-sale' : unit.status === 'sold-out' ? 'sold-out' : 'reserved',
    floorplanImage: unit.floorplanImage || '/images/floorplan-placeholder.jpg',
    description: unit.description,
    features: unit.features || [],
    amenities: unit.amenities || [],
  })) : mockUnits

  const filteredAndSortedUnits = useMemo(() => {
    let filtered = units.filter((unit: any) => unit.status === activeTab);

    // Apply bedroom filter
    if (bedrooms > 0) {
      if (bedrooms === 5) {
        // 5+ means 5 or more bedrooms
        filtered = filtered.filter(unit => unit.beds >= 5);
      } else {
        filtered = filtered.filter(unit => unit.beds === bedrooms);
      }
    }

    // Apply price filter
    if (activeTab === "for-sale") {
      filtered = filtered.filter(unit => {
        if (!unit.price) return false;
        return unit.price >= minPrice && unit.price <= maxPrice;
      });
    }

    // Apply square feet filter
    if (minSquareFeet !== undefined || maxSquareFeet !== undefined) {
      filtered = filtered.filter(unit => {
        if (!unit.sqft) return false;
        if (minSquareFeet !== undefined && unit.sqft < minSquareFeet) return false;
        if (maxSquareFeet !== undefined && unit.sqft > maxSquareFeet) return false;
        return true;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "beds-low":
          return a.beds - b.beds;
        case "beds-high":
          return b.beds - a.beds;
        default:
          return 0;
      }
    });

    return sorted;
  }, [activeTab, sortBy, bedrooms, minPrice, maxPrice, minSquareFeet, maxSquareFeet, units]);

  // Handle price filter change
  const handlePriceFilterChange = (e: FilterChangeEvent) => {
    if (e.target.name === 'minPrice') {
      setMinPrice(e.target.value as number);
    } else if (e.target.name === 'maxPrice') {
      setMaxPrice(e.target.value as number);
    }
  };

  // Handle bedroom filter change
  const handleBedroomFilterChange = (e: FilterChangeEvent) => {
    if (e.target.name === 'bedrooms') {
      setBedrooms(parseInt(e.target.value as string));
    }
  };

  // Handle square feet filter change
  const handleSquareFeetFilterChange = (e: FilterChangeEvent) => {
    if (e.target.name === 'minSquareFeet') {
      setMinSquareFeet(e.target.value as number | undefined);
    } else if (e.target.name === 'maxSquareFeet') {
      setMaxSquareFeet(e.target.value as number | undefined);
    }
  };

  // Create filter state for filter components
  const filterState = {
    minPrice,
    maxPrice,
    bedrooms,
    minSquareFeet,
    maxSquareFeet,
    location: 'all',
    locationArea: 'all',
    propertyType: 'all',
    community: 'all',
    bathrooms: 0,
    listingType: 'all',
  };

  const forSaleCount = units.filter((u: any) => u.status === "for-sale").length;
  const soldOutCount = units.filter((u: any) => u.status === "sold-out").length;

  if (!preCon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Available units not available
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {preCon.projectName || 'Pre-Construction'} Available Units
        </h2>
        <p className="text-muted-foreground">
          Learn about units available at {preCon.projectName || 'this development'}
        </p>
      </div>

      {/* Tabs and Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Toggle */}
          <ForSaleSoldOutToggle
            activeTab={activeTab}
            onTabChange={setActiveTab}
            forSaleCount={forSaleCount}
            soldOutCount={soldOutCount}
          />

          

          {/* Price Filter */}
          <PriceFilter
            filters={filterState}
            handleFilterChange={handlePriceFilterChange}
            communities={[]}
          />

          {/* Bedroom Filter */}
          <BedroomFilter
            filters={filterState}
            handleFilterChange={handleBedroomFilterChange}
            communities={[]}
          />

          {/* Square Feet Filter */}
          <SquareFeetFilter
            filters={filterState}
            handleFilterChange={handleSquareFeetFilterChange}
            communities={[]}
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="space-y-4">
        {filteredAndSortedUnits.length > 0 ? (
          filteredAndSortedUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} propertyId={propertyId} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No units found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface UnitCardProps {
  unit: UnitListing;
  propertyId: string;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, propertyId }) => {
  return (
    <Link href={`/pre-construction/${propertyId}/${unit.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4">
          {/* Floorplan Image */}
          <div className="flex-shrink-0">
            <img
              src={unit.floorplanImage}
              alt={`${unit.name} floorplan`}
              className="w-20 h-20 object-contain bg-muted rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/floorplan-placeholder.jpg';
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Unit {unit.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    <span>{unit.beds === 2 && unit.name.includes("+") ? "2+1" : unit.beds} bed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{unit.baths} bath</span>
                  </div>
                  {unit.sqft ? (
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>{unit.sqft} sqft</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>- sqft</span>
                    </div>
                  )}
                </div>
                <div className="text-sm mt-2">
                  <span className="text-muted-foreground">Maint Fees: </span>
                  <span className="font-medium">${unit.maintenanceFee || 0}/mo</span>
                </div>
                {unit.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{unit.description}</p>
                )}
                {unit.features && unit.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {unit.features.slice(0, 3).map((feature: string, idx: number) => (
                      <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {feature}
                      </span>
                    ))}
                    {unit.features.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{unit.features.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {unit.status === "sold-out" && (
                <Badge variant="secondary" className="bg-muted">
                  Sold Out
                </Badge>
              )}
              <div className="flex flex-col items-center gap-3">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle contact for pricing action
                    }}
                  >
                    Contact for pricing
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/pre-construction/${propertyId}/${unit.id}`;
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Floorplan
                  </Button>
                </div>
            </div>

            
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default AvailableUnits;

