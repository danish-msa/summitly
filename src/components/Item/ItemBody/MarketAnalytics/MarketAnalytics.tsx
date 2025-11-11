import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocationData } from "@/hooks/useLocationData";
import { useMarketAnalytics } from "@/hooks/useMarketAnalytics";
import type { ProcessedLocation } from "@/data/types";
import { MarketAnalyticsProps, MarketData, ListingsData, SoldPriceData } from './types';
import { generateMarketData, generateListingsData, generateSoldPriceData, extractCoordinates } from './dataGenerators';
import { MarketChartSection } from './MarketChartSection';
import { ListingsChartSection } from './ListingsChartSection';
import { SoldPriceChartSection } from './SoldPriceChartSection';
import { TableView } from './TableView';
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Table2, TrendingUp, RefreshCw, ArrowDown } from "lucide-react";
import { getLocationName, getPropertyClassLabel } from './dataGenerators';

export const MarketAnalytics: React.FC<MarketAnalyticsProps> = ({ 
  propertyAddress, 
  propertyClass 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [locationData, setLocationData] = useState<ProcessedLocation | null>(null);
  const [chartKey, setChartKey] = useState(0); // Force chart re-render on data change
  
  const { searchLocations } = useLocationData();
  
  // Extract coordinates from property address for API calls
  const [latitude, longitude] = useMemo(() => {
    return extractCoordinates(propertyAddress);
  }, [propertyAddress]);
  
  // Disabled API calls - using mock data only
  const { 
    marketData: apiMarketData, 
    listingsData: apiListingsData, 
    soldPriceData: apiSoldPriceData,
    loading: apiLoading, 
    error: apiError, 
    refetch: refetchAPI 
  } = useMarketAnalytics({
    latitude,
    longitude,
    propertyClass,
    enabled: false, // Disabled API calls - using mock data only
  });
  
  // Find location data based on property address
  useEffect(() => {
    const findLocationData = async () => {
      try {
        // Extract city/neighborhood from address for search
        const addressParts = propertyAddress.split(',');
        const city = addressParts[1]?.trim() || '';
        const neighborhood = addressParts[0]?.trim() || '';
        
        // Search for matching locations
        const cityResults = searchLocations(city, 5);
        const neighborhoodResults = searchLocations(neighborhood, 5);
        
        // Find the best match
        let bestMatch: ProcessedLocation | null = null;
        
        // Prefer neighborhood match, then city match
        if (neighborhoodResults.length > 0) {
          bestMatch = neighborhoodResults[0];
        } else if (cityResults.length > 0) {
          bestMatch = cityResults[0];
        }
        
        setLocationData(bestMatch);
        setChartKey(prev => prev + 1); // Trigger chart re-render with new data
      } catch (error) {
        console.error('Error finding location data:', error);
      }
    };
    
    findLocationData();
  }, [propertyAddress, searchLocations]);
  
  // Always use mock data (API calls disabled)
  const chartData = useMemo(() => {
    return generateMarketData(locationData, propertyClass);
  }, [locationData, propertyClass, chartKey]);

  const listingsData = useMemo(() => {
    return generateListingsData(locationData);
  }, [locationData, chartKey]);

  const soldPriceData = useMemo(() => {
    return generateSoldPriceData(locationData);
  }, [locationData, chartKey]);
  
  // Ensure data arrays are always valid
  const marketData: MarketData = {
    months: chartData.months || [],
    prices: chartData.prices || [],
    days: chartData.days || [],
  };
  
  const listingsDataFormatted: ListingsData = {
    months: listingsData.months || [],
    newListings: listingsData.newListings || [],
    closedListings: listingsData.closedListings || [],
  };
  
  const soldPriceDataFormatted: SoldPriceData = {
    months: soldPriceData.months || [],
    medianPrices: soldPriceData.medianPrices || [],
    averagePrices: soldPriceData.averagePrices || [],
  };
  
  // Always using mock data (API calls disabled)
  const usingAPIData = false;
  const isLoading = false;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setChartKey(prev => prev + 1); // Force chart re-render with new mock data
    
    toast.success("Market data refreshed!");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDownload = () => {
    toast.success("Market data downloaded!");
  };

  const handleToggleView = () => {
    setViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${viewMode === "chart" ? "table" : "chart"} view`);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Extract neighborhood and city from address or location data
  const getNeighborhoodAndCity = () => {
    if (locationData) {
      // If locationData is a neighborhood, use its name and parent (city)
      if (locationData.type === 'neighborhood' && locationData.parent) {
        return {
          neighborhood: locationData.name,
          city: locationData.parent
        };
      }
      // If locationData is a city, try to find neighborhood from address
      if (locationData.type === 'city') {
        const addressParts = propertyAddress.split(',');
        const neighborhood = addressParts[0]?.trim() || '';
        return {
          neighborhood: neighborhood || locationData.name,
          city: locationData.name
        };
      }
    }
    
    // Fallback: extract from address
    const addressParts = propertyAddress.split(',');
    const neighborhood = addressParts[0]?.trim() || '';
    const city = addressParts[1]?.trim() || addressParts[2]?.trim() || '';
    
    return {
      neighborhood: neighborhood || 'Area',
      city: city || 'Location'
    };
  };

  const { neighborhood, city } = getNeighborhoodAndCity();

  // Mock stats data - replace with actual data from API or props
  const marketStats = {
    activeListings: 195,
    newListings: 97,
    soldProperties: 47,
    expiredSuspendedTerminated: 320000,
    medianPrice: 640725,
    avgDOM: 36,
    last1YearGrowth: -11.6, // Negative for decrease
    last5YearsGrowth: -1.4, // Negative for decrease
  };

  return (
    <div className="w-full px-6 mt-6 pb-6">
      {viewMode === "chart" ? (
        <>
          {/* Market Stats Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Market Insights in {neighborhood}, {city}
              </h3>
              <span className="text-sm text-muted-foreground">As of Oct 2025</span>
            </div>
            
            {/* Stats Grid - Top Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Active Listings</p>
                <p className="text-2xl font-bold text-foreground">{marketStats.activeListings}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">New Listings</p>
                <p className="text-2xl font-bold text-foreground">{marketStats.newListings}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Sold Properties</p>
                <p className="text-2xl font-bold text-foreground">{marketStats.soldProperties}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Exp/Sus/Ter</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(marketStats.expiredSuspendedTerminated)}</p>
              </div>
            </div>

            {/* Stats Grid - Bottom Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Median Price</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(marketStats.medianPrice)}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg DOM</p>
                <p className="text-2xl font-bold text-foreground">{marketStats.avgDOM}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Last 1 Year's Growth</p>
                <div className="flex items-center gap-1">
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{Math.abs(marketStats.last1YearGrowth)}%</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Last 5 Years' Growth</p>
                <div className="flex items-center gap-1">
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{Math.abs(marketStats.last5YearsGrowth)}%</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="market" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="market">Market Trends</TabsTrigger>
            <TabsTrigger value="listings">Listings Activity</TabsTrigger>
            <TabsTrigger value="prices">Sold Prices</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="mt-0">
            {/* Header Section for Market Trends */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {getLocationName(locationData, propertyAddress)} • {getPropertyClassLabel(propertyClass)}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Median Sold Price & Average Days On Market
                </h2>
                <div className="mt-2 flex items-center gap-4">
                  {locationData && (
                    <div className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-4">
                        <span>Total Properties: {locationData.demographics.total}</span>
                        <span>Residential: {locationData.demographics.residential}</span>
                        <span>Condo: {locationData.demographics.condo}</span>
                        <span>Commercial: {locationData.demographics.commercial}</span>
                      </span>
                    </div>
                  )}
                  <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Sample Data
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Trend analysis coming soon!")}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Trend analysis"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {/* Main Chart: Median Sold Price & Average Days On Market */}
            <div className="w-full h-[500px] md:h-[400px]">
              <MarketChartSection data={marketData} chartKey={chartKey} />
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-0">
            {/* Header Section for Listings Activity */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {getLocationName(locationData, propertyAddress)} • {getPropertyClassLabel(propertyClass)}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  New/Closed Listings by Month (Last 6 Months)
                </h2>
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Track market activity with new listings and closed sales
                  </p>
                  <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Sample Data
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Trend analysis coming soon!")}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Trend analysis"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {/* Second Chart: New/Closed Listings */}
            <div className="w-full h-[400px] md:h-[350px]">
              <ListingsChartSection data={listingsDataFormatted} chartKey={chartKey} />
            </div>
          </TabsContent>

          <TabsContent value="prices" className="mt-0">
            {/* Header Section for Sold Prices */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {getLocationName(locationData, propertyAddress)} • {getPropertyClassLabel(propertyClass)}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Med/Avg Sold Price by Month (Last 12 Months)
                </h2>
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Track median and average sold prices over time
                  </p>
                  <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Sample Data
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Trend analysis coming soon!")}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Trend analysis"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {/* Third Chart: Sold Price Trends */}
            <div className="w-full h-[400px] md:h-[350px]">
              <SoldPriceChartSection data={soldPriceDataFormatted} chartKey={chartKey} />
            </div>
          </TabsContent>
        </Tabs>
        </>
      ) : (
        <TableView
          viewMode={viewMode}
          marketData={marketData}
          listingsData={listingsDataFormatted}
          soldPriceData={soldPriceDataFormatted}
        />
      )}

      {/* Call to Action */}
      <div className="flex justify-center pt-6 pb-4">
        <Button 
          variant="default" 
          className="bg-gradient-to-r from-brand-celestial to-brand-cb-blue hover:bg-brand-midnight text-white px-8 py-6 text-base rounded-lg gap-2"
          onClick={() => {
            // Add handler for CTA click
            console.log('Connect me with a market expert');
          }}
        >
          <UserCheck className="h-5 w-5" />
          Connect me with a market expert
        </Button>
      </div>
    </div>
  );
};

