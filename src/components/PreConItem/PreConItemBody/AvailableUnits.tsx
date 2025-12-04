"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { PropertyListing } from '@/lib/types'
import { UnitListing } from '@/lib/types/units'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import ForSaleSoldOutToggle from './ForSaleSoldOutToggle'
import PriceFilter from '@/components/common/filters/PriceFilter'
import BedroomFilter from '@/components/common/filters/BedroomFilter'
import SquareFeetFilter from '@/components/common/filters/SquareFeetFilter'
import { FilterChangeEvent } from '@/lib/types/filters'
import { slugify } from '@/lib/utils/propertyUrl'
interface AvailableUnitsProps {
  property: PropertyListing;
}

type TabType = "for-sale" | "sold-out";
type SortOption = "price-low" | "price-high" | "beds-low" | "beds-high";

const AvailableUnits: React.FC<AvailableUnitsProps> = ({ property }) => {
  const preCon = property.preCon;
  const propertyId = property.mlsNumber || '';
  
  const [activeTab, setActiveTab] = useState<TabType>("for-sale");
  const [sortBy] = useState<SortOption>("price-low");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [minSquareFeet, setMinSquareFeet] = useState<number | undefined>(undefined);
  const [maxSquareFeet, setMaxSquareFeet] = useState<number | undefined>(undefined);
  const [showAllUnits, setShowAllUnits] = useState(false);

  // Get units from backend data - the API already formats them as UnitListing[]
  // Units are stored in property.preCon.units
  const units: UnitListing[] = useMemo(() => {
    if (!preCon?.units || !Array.isArray(preCon.units) || preCon.units.length === 0) {
      return [];
    }
    return preCon.units.map((unit: UnitListing) => {
        // Normalize status - handle various status values from database
        // The form allows: "for-sale", "sold-out", "reserved"
        // We map "reserved" to "for-sale" for display purposes
        let normalizedStatus: 'for-sale' | 'sold-out' = 'for-sale';
        if (unit.status) {
          const statusLower = String(unit.status).toLowerCase().trim();
          if (statusLower === 'sold-out' || statusLower === 'soldout' || statusLower === 'sold') {
            normalizedStatus = 'sold-out';
          } else {
            // "for-sale", "reserved", or any other status -> show as "for-sale"
            normalizedStatus = 'for-sale';
          }
        }

        return {
          id: unit.id,
          name: unit.name || '',
          beds: unit.beds || 0,
          baths: unit.baths || 0,
          sqft: unit.sqft || undefined,
          price: unit.price || undefined,
          maintenanceFee: unit.maintenanceFee || 0,
          status: normalizedStatus,
          images: (unit.images && Array.isArray(unit.images) && unit.images.length > 0) 
            ? unit.images 
            : ['/images/floorplan-placeholder.jpg'],
          description: unit.description,
          features: unit.features || [],
          amenities: unit.amenities || [],
          studio: unit.studio ?? false,
        };
      });
  }, [preCon?.units]);

  // Debug: Log units to console (remove in production)
  useEffect(() => {
    if (units.length > 0) {
      console.log('AvailableUnits: Loaded units from backend:', units);
      console.log('AvailableUnits: Units count:', units.length);
      console.log('AvailableUnits: For-sale count:', units.filter(u => u.status === 'for-sale').length);
      console.log('AvailableUnits: Sold-out count:', units.filter(u => u.status === 'sold-out').length);
    } else {
      console.log('AvailableUnits: No units found in property.preCon.units');
      console.log('AvailableUnits: preCon object:', preCon);
    }
  }, [units, preCon]);

  // Reset showAllUnits when filters change
  useEffect(() => {
    setShowAllUnits(false);
  }, [activeTab, bedrooms, minPrice, maxPrice, minSquareFeet, maxSquareFeet]);

  const filteredAndSortedUnits = useMemo(() => {
    let filtered = units.filter((unit: UnitListing) => unit.status === activeTab);

    // Debug: Log filtering steps
    console.log('AvailableUnits: Filtering units', {
      totalUnits: units.length,
      activeTab,
      afterStatusFilter: filtered.length,
      bedrooms,
      minPrice,
      maxPrice,
      minSquareFeet,
      maxSquareFeet,
    });

    // Apply bedroom filter
    if (bedrooms > 0) {
      if (bedrooms === 5) {
        // 5+ means 5 or more bedrooms
        filtered = filtered.filter(unit => unit.beds >= 5);
      } else {
        filtered = filtered.filter(unit => unit.beds === bedrooms);
      }
    }

    // Apply price filter - only if price is set and within range
    if (activeTab === "for-sale") {
      filtered = filtered.filter(unit => {
        // If unit has no price, still show it (might be "Contact for pricing")
        if (!unit.price) return true;
        return unit.price >= minPrice && unit.price <= maxPrice;
      });
    }

    // Apply square feet filter - only if square feet filter is set
    if (minSquareFeet !== undefined || maxSquareFeet !== undefined) {
      filtered = filtered.filter(unit => {
        // If unit has no sqft, still show it
        if (!unit.sqft) return true;
        if (minSquareFeet !== undefined && unit.sqft < minSquareFeet) return false;
        if (maxSquareFeet !== undefined && unit.sqft > maxSquareFeet) return false;
        return true;
      });
    }

    console.log('AvailableUnits: After all filters:', filtered.length);

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

  const forSaleCount = units.filter((u: UnitListing) => u.status === "for-sale").length;
  const soldOutCount = units.filter((u: UnitListing) => u.status === "sold-out").length;

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
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                No units available for this project.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Please add units in the dashboard to display them here.
              </p>
            </div>
          ) : filteredAndSortedUnits.length > 0 ? (
            <>
              {/* Visible Units */}
              {filteredAndSortedUnits.slice(0, showAllUnits ? filteredAndSortedUnits.length : 6).map((unit) => (
                <UnitCard key={unit.id} unit={unit} propertyId={propertyId} />
              ))}
              
              {/* Blurred Preview Units with View More Button Overlay (only show if not showing all and there are more than 6) */}
              {!showAllUnits && filteredAndSortedUnits.length > 6 && (
                <div className="col-span-full relative">
                  {/* All 4 blurred units */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndSortedUnits.slice(6, 10).map((unit) => (
                      <div key={unit.id} className="blur-sm opacity-50 pointer-events-none">
                        <UnitCard unit={unit} propertyId={propertyId} />
                      </div>
                    ))}
                  </div>
                  
                  {/* View More Button - Overlay on top */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Button
                      onClick={() => setShowAllUnits(true)}
                      variant="default"
                      size="lg"
                      className="shadow-lg"
                    >
                      View More Units ({filteredAndSortedUnits.length - 6} more)
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                No units found matching your criteria.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {units.length} unit{units.length !== 1 ? 's' : ''} available, but none match the current filters.
                {activeTab === 'for-sale' && forSaleCount === 0 && soldOutCount > 0 && (
                  <span className="block mt-2">Try switching to the "Sold Out" tab.</span>
                )}
                {activeTab === 'sold-out' && soldOutCount === 0 && forSaleCount > 0 && (
                  <span className="block mt-2">Try switching to the "For Sale" tab.</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UnitCardProps {
  unit: UnitListing;
  propertyId: string;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, propertyId }) => {
  // Create URL-friendly slug from unit name
  const unitSlug = slugify(unit.name || unit.id);
  
  return (
    <Link href={`/pre-construction/${propertyId}/${unitSlug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-2">
          {/* Floorplan Image */}
          <div className="flex-shrink-0">
            <img
              src={unit.images && unit.images.length > 0 ? unit.images[0] : '/images/floorplan-placeholder.jpg'}
              alt={`${unit.name} floorplan`}
              className="w-16 h-16 object-contain bg-muted rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/floorplan-placeholder.jpg';
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2 w-full flex-1">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">Unit {unit.name}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    <span>{unit.beds === 2 && unit.name.includes("+") ? "2+1" : unit.beds}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{unit.baths}</span>
                  </div>
                  {unit.sqft ? (
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>{unit.sqft}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>-</span>
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Maint Fees: </span>
                  <span className="font-medium">${unit.maintenanceFee || 0}/mo</span>
                </div>
                <div className="flex flex-row justify-between gap-2 w-full flex-1">
                  
                  
                  {/* {unit.features && unit.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {unit.features.slice(0, 3).map((feature: string, idx: number) => (
                        <span key={idx} className="text-xs bg-muted px-1 py-0.5 rounded">
                          {feature}
                        </span>
                      ))}
                      {unit.features.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{unit.features.length - 3} more</span>
                      )}
                    </div>
                  )} */}
                </div>
                
              </div>

              {unit.status === "sold-out" && (
                <Badge variant="secondary" className="bg-muted">
                  Sold Out
                </Badge>
              )}
              <div className="flex flex-row items-center gap-3">
                  
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

