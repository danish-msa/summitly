"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getListings } from '@/lib/api/properties';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import { fetchTopCities } from '@/data/data';
import { AreaSelector } from '@/components/City/AreaSelector';
import { Separator } from '@/components/ui/separator';
import { Bell, TrendingUp, Home } from 'lucide-react';
import Link from 'next/link';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import SellRentToggle from '../common/filters/SellRentToggle';
import PropertyAlertsDialog from '@/components/common/PropertyAlertsDialog';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

// Helper function to convert slug back to city name
const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


const CityPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.cityName as string || '';
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string; numberOfProperties: number } | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<Record<string, boolean>>({
    newProperties: false,
    soldListings: false,
    expiredListings: false,
  });
  
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

  // Convert slug to city name
  const cityName = useMemo(() => {
    return unslugifyCityName(citySlug);
  }, [citySlug]);
  
  // Use property alerts hook for saving alerts
  const { data: session } = useSession();
  const { currentAlert, saveAlert } = usePropertyAlerts(
    undefined, // No specific property
    cityName,  // City name for location-based alerts
    undefined  // No specific neighborhood
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

  // City coordinates are calculated when needed

  useEffect(() => {
    const loadCityData = async () => {
      try {
        setLoading(true);

        // Fetch city info from top cities
        const topCities = await fetchTopCities();
        const foundCity = topCities.find(city => 
          city.cityName.toLowerCase() === cityName.toLowerCase()
        );

        // Fetch properties for the city
        const listingsData = await getListings({
          status: 'A',
          resultsPerPage: 50,
          pageNum: 1,
        });

        // Filter properties by city name
        const cityProperties = listingsData.listings.filter(property =>
          property.address?.city?.toLowerCase() === cityName.toLowerCase()
        );

        // Set city info - use found city from top cities if available, otherwise count from filtered properties
        if (foundCity) {
          setCityInfo({
            name: foundCity.cityName,
            numberOfProperties: foundCity.numberOfProperties,
          });
        } else {
          setCityInfo({
            name: cityName,
            numberOfProperties: cityProperties.length,
          });
        }

        setProperties(cityProperties);
        setAllProperties(cityProperties);
        
        // Extract unique communities from the properties
        const uniqueCommunities = Array.from(
          new Set(
            cityProperties
              .map(property => property.address?.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('Error loading city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug) {
      loadCityData();
    }
  }, [citySlug, cityName]);

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

    setProperties(filtered);
  }, [filters, allProperties]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading city information...</p>
        </div>
      </div>
    );
  }

  const displayCityName = cityInfo?.name || cityName;

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="border-b bg-card pt-16">
        <div className="container-1400 mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {displayCityName} Properties For Sale
              </h1>
              <p className="text-muted-foreground">
                Search for {displayCityName} real estate by price, bedroom, or property type. View
                all the latest {displayCityName} MLS® listings.
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
        
        {/* Area Selector */}
        <section>
          <AreaSelector properties={properties} cityName={displayCityName} />
        </section>

        {/* Navigation Buttons */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${citySlug}/trends`}
              className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Market Trends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore housing market statistics and price trends for {displayCityName}
                </p>
              </div>
            </Link>

            <Link
              href={`/${citySlug}/neighbourhoods`}
              className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Neighbourhoods
                </h3>
                <p className="text-sm text-muted-foreground">
                  Discover different neighbourhoods and areas in {displayCityName}
                </p>
              </div>
            </Link>
          </div>
        </section>
        <Separator />

        {/* Filters */}
        <section>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                <GlobalFilters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    resetFilters={resetFilters}
                    communities={communities}
                    locations={LOCATIONS}
                    showLocation={false}
                    showPropertyType={true}
                    showCommunity={false}
                    showPrice={true}
                    showBedrooms={false}
                    showBathrooms={false}
                    showAdvanced={true}
                    showSellRentToggle={false}
                    layout="horizontal"
                    className="w-full"
                />
                </div>
          {/* Sell/Rent Toggle */}
                <div className="flex-1 flex justify-end">
                    <SellRentToggle 
                    listingType={(filters.listingType === 'sell' || filters.listingType === 'rent') ? filters.listingType : 'sell'}
                    onListingTypeChange={handleListingTypeChange}
                    />
                </div>
            </div>
        </section>


        {/* Property Listings */}
        <section className="pb-8">
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <div
                  key={property.mlsNumber}
                  className="cursor-pointer transition-all h-full"
                >
                  <PropertyCard
                    property={property}
                    onHide={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No properties found in {displayCityName}
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
        locationName={displayCityName}
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
            await saveAlert({
              cityName: displayCityName,
              newProperties: options.newProperties,
              soldListings: options.soldListings,
              expiredListings: options.expiredListings,
            });

            toast({
              title: "Alerts Saved",
              description: `Your property alerts for ${displayCityName} have been saved successfully.`,
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

export default CityPage;

