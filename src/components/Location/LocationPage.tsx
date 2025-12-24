"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getListings } from '@/lib/api/properties';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import { fetchTopCities } from '@/data/data';
import { AreaSelector } from '@/components/City/AreaSelector';
import { Separator } from '@/components/ui/separator';
import { Bell, TrendingUp, Home, ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import SellRentToggle from '../common/filters/SellRentToggle';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { parseCityUrl } from '@/lib/utils/cityUrl';
import Pagination from '@/components/ui/pagination';

// Helper function to convert slug back to name
const unslugifyName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export type LocationType = 'city' | 'area' | 'neighbourhood';

interface LocationPageProps {
  locationType: LocationType;
}

const LocationPage: React.FC<LocationPageProps> = ({ locationType }) => {
  const params = useParams();
  const citySlug = (params?.citySlug || params?.cityName) as string || ''; // Support both for backward compatibility
  const areaSlug = (params?.areaName || params?.slug) as string || ''; // Support both for backward compatibility
  const neighbourhoodSlug = (params?.neighbourhoodName || params?.neighbourhood) as string || ''; // Support both for backward compatibility
  
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{ name: string; numberOfProperties: number } | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<Record<string, boolean>>({
    newProperties: false,
    soldListings: false,
    expiredListings: false,
  });
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Number of properties per page
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();

  // Handle listing type change for SellRentToggle
  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    handleFilterChange({
      target: {
        name: 'listingType',
        value: type
      }
    });
  };

  // Toggle alert option
  const toggleAlertOption = (option: string) => {
    setAlertOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Determine location names based on type
  // Parse city name from URL (remove -real-estate suffix if present)
  const cityName = useMemo(() => {
    // Check if citySlug ends with -real-estate and parse it
    if (citySlug.endsWith('-real-estate')) {
      return parseCityUrl(citySlug);
    }
    return unslugifyName(citySlug);
  }, [citySlug]);
  
  // Get city slug for URLs (with -real-estate suffix)
  const cityUrlSlug = useMemo(() => {
    if (citySlug.endsWith('-real-estate')) {
      return citySlug; // Already has suffix
    }
    // Generate city URL slug from city name
    return cityName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-real-estate';
  }, [citySlug, cityName]);

  const areaName = useMemo(() => {
    return areaSlug ? unslugifyName(areaSlug) : '';
  }, [areaSlug]);

  const neighbourhoodName = useMemo(() => {
    return neighbourhoodSlug ? unslugifyName(neighbourhoodSlug) : '';
  }, [neighbourhoodSlug]);

  // Build URL paths based on location type (using cityUrlSlug with -real-estate)
  const basePath = useMemo(() => {
    if (locationType === 'neighbourhood') {
      return `/${cityUrlSlug}/${areaSlug}/${neighbourhoodSlug}`;
    } else if (locationType === 'area') {
      return `/${cityUrlSlug}/${areaSlug}`;
    }
    return `/${cityUrlSlug}`;
  }, [locationType, cityUrlSlug, areaSlug, neighbourhoodSlug]);

  const trendsPath = useMemo(() => {
    return `${basePath}/trends`;
  }, [basePath]);

  const neighbourhoodsPath = useMemo(() => {
    if (locationType === 'city') {
      return `/${cityUrlSlug}/neighbourhoods`;
    } else if (locationType === 'area') {
      return `/${cityUrlSlug}/${areaSlug}/neighbourhoods`;
    }
    return null; // No neighbourhoods page for neighbourhood
  }, [locationType, cityUrlSlug, areaSlug]);

  const areasPath = useMemo(() => {
    if (locationType === 'city') {
      return `/${cityUrlSlug}/areas`;
    }
    return null; // Only city has areas
  }, [locationType, cityUrlSlug]);

  // Get display name based on location type
  const displayName = useMemo(() => {
    if (locationType === 'neighbourhood') return neighbourhoodName;
    if (locationType === 'area') return areaName;
    return cityName;
  }, [locationType, cityName, areaName, neighbourhoodName]);
  
  // Use property alerts hook for saving alerts
  const { data: session } = useSession();
  const { currentAlert, saveAlert } = usePropertyAlerts(
    undefined, // No specific property
    locationType === 'city' ? cityName : undefined,  // City name for city-level alerts
    locationType === 'neighbourhood' ? neighbourhoodName : (locationType === 'area' ? areaName : undefined)  // Neighborhood or area
  );
  
  // Load existing alert options when alert is found
  useEffect(() => {
    if (currentAlert) {
      setAlertOptions({
        newProperties: currentAlert.newProperties || false,
        soldListings: currentAlert.soldListings || false,
        expiredListings: currentAlert.expiredListings || false,
      });
    }
  }, [currentAlert]);

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        setLoading(true);

        // Fetch city info from top cities (only for city type)
        let foundCity = null;
        if (locationType === 'city') {
          try {
            const topCities = await fetchTopCities();
            foundCity = topCities.find(city => 
              city.cityName.toLowerCase() === cityName.toLowerCase()
            );
          } catch (error) {
            console.error('Error fetching top cities:', error);
            // Continue without city info if fetch fails
          }
        }

        // Fetch properties - fetch multiple pages to get all areas and neighborhoods
        let allListings: PropertyListing[] = [];
        let page = 1;
        const resultsPerPage = 100; // Maximum allowed by API
        let hasMorePages = true;
        
        try {
          // Fetch multiple pages to get comprehensive area and neighborhood data
          while (hasMorePages && page <= 10) { // Limit to 10 pages to avoid infinite loops
            const listingsData = await getListings({
              status: 'A',
              resultsPerPage,
              pageNum: page,
            });
            
            if (!listingsData || !listingsData.listings || listingsData.listings.length === 0) {
              hasMorePages = false;
              break;
            }
            
            allListings = [...allListings, ...listingsData.listings];
            
            // Check if there are more pages
            const totalPages = listingsData.numPages || Math.ceil((listingsData.count || 0) / resultsPerPage);
            hasMorePages = page < totalPages;
            page++;
          }
        } catch (error) {
          console.error('Error fetching listings:', error);
          // Set empty data if fetch fails
          allListings = [];
        }

        // Filter properties by location
        let filtered = allListings;

        // Always filter by city if cityName is available
        if (cityName) {
          filtered = filtered.filter(property =>
            property.address?.city?.toLowerCase() === cityName.toLowerCase()
          );
        }

        // Filter by area if applicable
        if ((locationType === 'area' || locationType === 'neighbourhood') && areaName) {
          filtered = filtered.filter(property => {
            const propArea = property.address?.area?.toLowerCase() || '';
            const searchArea = areaName.toLowerCase();
            // Use flexible matching: exact match or contains
            return propArea === searchArea || 
                   propArea.includes(searchArea) || 
                   searchArea.includes(propArea);
          });
        }

        // Filter by neighbourhood if applicable
        if (locationType === 'neighbourhood' && neighbourhoodName) {
          filtered = filtered.filter(property => {
            const propNeighbourhood = property.address?.neighborhood?.toLowerCase() || '';
            const searchNeighbourhood = neighbourhoodName.toLowerCase();
            // Use flexible matching: exact match or contains
            return propNeighbourhood === searchNeighbourhood || 
                   propNeighbourhood.includes(searchNeighbourhood) || 
                   searchNeighbourhood.includes(propNeighbourhood);
          });
        }

        const locationProperties = filtered;

        // Set location info
        if (foundCity && locationType === 'city') {
          setLocationInfo({
            name: foundCity.cityName,
            numberOfProperties: foundCity.numberOfProperties,
          });
        } else {
          setLocationInfo({
            name: displayName || cityName || 'Location',
            numberOfProperties: locationProperties.length,
          });
        }

        setProperties(locationProperties);
        setAllProperties(locationProperties);
        
        // Extract unique communities/neighbourhoods from the properties
        const uniqueCommunities = Array.from(
          new Set(
            locationProperties
              .map(property => property.address?.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('Error loading location data:', error);
        // Set default location info on error
        setLocationInfo({
          name: displayName || cityName || 'Location',
          numberOfProperties: 0,
        });
        setProperties([]);
        setAllProperties([]);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    // Check if we have the minimum required data to load
    if (cityName || citySlug) {
      if (locationType === 'neighbourhood' && !neighbourhoodSlug) {
        // For neighbourhood, we need the slug
        setLoading(false);
        return;
      }
      loadLocationData();
    } else {
      // If no city data available, stop loading
      setLoading(false);
    }
  }, [citySlug, areaSlug, neighbourhoodSlug, locationType, cityName, areaName, neighbourhoodName, displayName]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedNeighborhood]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filter properties based on filter state
  useEffect(() => {
    if (allProperties.length === 0) return;

    let filtered = [...allProperties];

    // Filter by property type
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(property => 
        property.details?.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Filter by price
    if (filters.minPrice > 0) {
      filtered = filtered.filter(property => 
        property.listPrice >= filters.minPrice
      );
    }
    if (filters.maxPrice < 2000000) {
      filtered = filtered.filter(property => 
        property.listPrice <= filters.maxPrice
      );
    }

    // Filter by listing type
    if (filters.listingType !== 'all') {
      filtered = filtered.filter(property => {
        if (filters.listingType === 'sell') {
          // Check for active statuses (Active, Active Under Contract, Coming Soon)
          const activeStatuses = ['Active', 'Active Under Contract', 'Coming Soon'];
          return property.type === 'Sale' || activeStatuses.includes(property.status);
        } else if (filters.listingType === 'rent') {
          // Check for active statuses for rentals
          const activeStatuses = ['Active', 'Active Under Contract', 'Coming Soon'];
          return property.type === 'Lease' || activeStatuses.includes(property.status);
        }
        return true;
      });
    }

    // Filter by location area (if selected)
    if (filters.locationArea !== 'all') {
      filtered = filtered.filter(property => 
        property.address?.neighborhood?.toLowerCase().includes(filters.locationArea.toLowerCase()) ||
        property.address?.area?.toLowerCase().includes(filters.locationArea.toLowerCase())
      );
    }

    // Filter by selected neighborhood from AreaSelector
    if (selectedNeighborhood) {
      filtered = filtered.filter(property =>
        property.address?.neighborhood?.toLowerCase() === selectedNeighborhood.toLowerCase()
      );
    }

    setProperties(filtered);
  }, [filters, allProperties, selectedNeighborhood]);

  // Calculate paginated properties
  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = properties.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading location information...</p>
        </div>
      </div>
    );
  }

  const displayLocationName = locationInfo?.name || displayName;

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="border-b bg-card pt-16">
        <div className="container-1400 mx-auto px-4 py-6">
          {/* Back Button - Show for area and neighbourhood pages */}
          {(locationType === 'area' || locationType === 'neighbourhood') && (
            <div className="mb-4">
              <Link href={`/${cityUrlSlug}`}>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to {cityName} Page</span>
                </Button>
              </Link>
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {displayLocationName} Properties For Sale
              </h1>
              <p className="text-muted-foreground">
                Search for {displayLocationName} real estate by price, bedroom, or property type. View
                all the latest {displayLocationName} MLS® listings.
              </p>
            </div>
            <button 
              onClick={() => setAlertsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Get Alerts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">

        {/* Navigation Buttons */}
        <section>
          <div className={`grid gap-4 ${neighbourhoodsPath && areasPath ? 'grid-cols-1 md:grid-cols-3' : neighbourhoodsPath || areasPath ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-1'}`}>
            <Link
              href={trendsPath}
              className="group flex items-center gap-4 p-6 bg-green-500/20 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Market Trends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore housing market statistics and price trends for {displayLocationName}
                </p>
              </div>
            </Link>

            {areasPath && (
              <Link
                href={areasPath}
                className="group flex items-center gap-4 p-6 bg-blue-500/20 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Areas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore different areas in {displayLocationName}
                  </p>
                </div>
              </Link>
            )}

            {neighbourhoodsPath && (
              <Link
                href={neighbourhoodsPath}
                className="group flex items-center gap-4 p-6 bg-purple-500/20 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Home className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Neighbourhoods
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Discover different neighbourhoods and areas in {displayLocationName}
                  </p>
                </div>
              </Link>
            )}

            
          </div>
        </section>
        
         {/* Neighborhood Selector - Only show for city */}
         {locationType === 'city' && (
           <section>
             <AreaSelector 
               properties={allProperties} 
               cityName={displayLocationName}
               onNeighborhoodSelect={setSelectedNeighborhood}
               selectedNeighborhood={selectedNeighborhood}
             />
           </section>
         )}

        
        <Separator />

        {/* Filters */}
        <section>
            <div className="flex flex-col md:flex-row gap-4">
                {/* Left side - Property Filters */}
                <div className="flex-1 w-full lg:w-auto">
                  <GlobalFilters
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      resetFilters={resetFilters}
                      communities={communities}
                      locations={LOCATIONS}
                      showLocation={true}
                      showPropertyType={true}
                      showCommunity={false}
                      showPrice={true}
                      showBedrooms={false}
                      showBathrooms={false}
                      showAdvanced={true}
                      showSellRentToggle={false}
                      showResetButton={false}
                      layout="horizontal"
                      className="w-full"
                  />
                </div>
                {/* Sell/Rent Toggle */}
                <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
                  <SellRentToggle 
                    listingType={(filters.listingType === 'sell' || filters.listingType === 'rent') ? filters.listingType : 'sell'}
                    onListingTypeChange={handleListingTypeChange}
                    />
                </div>
            </div>
        </section>


        {/* Property Listings */}
        <section className="pb-8">
          {properties.length > 0 && totalPages > 1 && (
            <div className="mb-6">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, properties.length)} of {properties.length}
              </span>
            </div>
          )}
          
          {paginatedProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                {paginatedProperties.map((property, index) => (
                  <div
                    key={`${property.mlsNumber}-${index}-${property.address?.streetNumber || ''}-${property.address?.streetName || ''}`}
                    className="cursor-pointer transition-all"
                  >
                    <PropertyCard
                      property={property}
                      onHide={() => {}}
                    />
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No properties found in {displayLocationName}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Alerts Dialog */}
      <PropertyAlertsDialog
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alertOptions={alertOptions}
        onToggleOption={toggleAlertOption}
        locationName={displayLocationName}
        propertyType="property"
        onSave={async (options) => {
          if (!session) {
            toast({
              title: "Sign in required",
              description: "Please sign in to set up property alerts.",
              variant: "destructive",
            });
            setAlertsOpen(false);
            return;
          }

          try {
            // Determine what to save based on location type
            const alertData: {
              newProperties: boolean;
              soldListings: boolean;
              expiredListings: boolean;
              cityName?: string;
              neighborhood?: string;
            } = {
              newProperties: options.newProperties,
              soldListings: options.soldListings,
              expiredListings: options.expiredListings,
            };

            // Add location information based on location type
            if (locationType === 'city') {
              alertData.cityName = cityName;
            } else if (locationType === 'area') {
              alertData.cityName = cityName;
              alertData.neighborhood = areaName; // Using neighborhood field for area
            } else if (locationType === 'neighbourhood') {
              alertData.cityName = cityName;
              alertData.neighborhood = neighbourhoodName;
            }

            await saveAlert(alertData);

            toast({
              title: "Alerts Saved",
              description: `Your property alerts for ${displayLocationName} have been saved successfully.`,
              variant: "default",
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save alerts. Please try again.";
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
};

export default LocationPage;

