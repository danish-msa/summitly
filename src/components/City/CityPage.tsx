"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Map from '@/components/ui/map';
import { getListings } from '@/lib/api/properties';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import { fetchTopCities } from '@/data/data';
import { AreaSelector } from '@/components/City/AreaSelector';
import { MarketStats } from '@/components/City/MarketStats';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, MapPin, Bell } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import SellRentToggle from '../common/filters/SellRentToggle';
import PropertyAlertsDialog from './PropertyAlertsDialog';

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Helper function to convert slug back to city name
const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get city coordinates (fallback to Toronto)
const getCityCoordinates = (cityName: string): { lat: number; lng: number } => {
  // Common Canadian cities coordinates
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'Toronto': { lat: 43.6532, lng: -79.3832 },
    'Mississauga': { lat: 43.5890, lng: -79.6441 },
    'Brampton': { lat: 43.7315, lng: -79.7624 },
    'Markham': { lat: 43.8561, lng: -79.3370 },
    'Vaughan': { lat: 43.8367, lng: -79.4982 },
    'Richmond Hill': { lat: 43.8828, lng: -79.4403 },
    'Oakville': { lat: 43.4675, lng: -79.6877 },
    'Burlington': { lat: 43.3256, lng: -79.7990 },
    'Ajax': { lat: 43.8500, lng: -79.0200 },
    'Pickering': { lat: 43.8374, lng: -79.0864 },
    'Whitby': { lat: 43.8975, lng: -78.9428 },
    'Oshawa': { lat: 43.8971, lng: -78.8658 },
    'Cheshire': { lat: 53.2004, lng: -2.8976 }, // UK location, adjust as needed
  };

  const normalizedName = cityName.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (city.toLowerCase() === normalizedName) {
      return coords;
    }
  }

  // Default to Toronto if city not found
  return { lat: 43.6532, lng: -79.3832 };
};

const CityPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.cityName as string || '';
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string; numberOfProperties: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'mixed' | 'map'>('list');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState({
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
  const toggleAlertOption = (option: keyof typeof alertOptions) => {
    setAlertOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Convert slug to city name
  const cityName = useMemo(() => {
    return unslugifyCityName(citySlug);
  }, [citySlug]);

  // Get city coordinates
  const cityCoordinates = useMemo(() => {
    return getCityCoordinates(cityName);
  }, [cityName]);

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
          return property.type === 'Sale' || property.status === 'A';
        } else if (filters.listingType === 'rent') {
          return property.type === 'Lease' || property.status === 'R';
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


        {/* Market Stats */}
        <section>
          <MarketStats cityName={displayCityName} properties={properties} />
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">
                Listings {properties.length}
              </button>
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground pb-2">
                Buildings
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Sort by Date (Newest)
              </div>
              <div className="flex ">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-l-lg ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="List View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-xs font-medium">List</span>
                </button>
                <button
                  onClick={() => setViewMode('mixed')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                    viewMode === 'mixed'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Mixed View"
                >
                  <div className="flex gap-0.5 items-center">
                    <LayoutGrid className="w-3 h-3" />
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium">Mixed</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-r-lg ${
                    viewMode === 'map'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Map View"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* View Content */}
          <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
            {/* Property Listings */}
            {(viewMode === 'list' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'mixed' ? 'calc(100vh - 200px)' : 'auto' }}>
                {properties.length > 0 ? (
                  <div className={`grid gap-6 ${
                    viewMode === 'mixed' 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {properties.map((property) => (
                      <div
                        key={property.mlsNumber}
                        className={`cursor-pointer transition-all ${
                          selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedProperty(property)}
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
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh' }}>
                <GooglePropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onPropertySelect={setSelectedProperty}
                  onBoundsChange={() => {}}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Alerts Dialog */}
      <PropertyAlertsDialog
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alertOptions={alertOptions}
        onToggleOption={toggleAlertOption}
        cityName={displayCityName}
        onSave={(options) => {
          // Handle save alerts logic here
          console.log('Alert options:', options);
        }}
      />
    </div>
  );
};

export default CityPage;

