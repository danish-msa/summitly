import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocationData } from "@/hooks/useLocationData";
import { useMarketAnalytics } from "@/hooks/useMarketAnalytics";
import type { ProcessedLocation } from "@/data/types";
import { MarketAnalyticsProps, MarketData, ListingsData, SoldPriceData } from './types';
import { generateMarketData, generateListingsData, generateSoldPriceData, extractCoordinates } from './dataGenerators';
import { HeaderSection } from './HeaderSection';
import { ChartSectionHeader } from './ChartSectionHeader';
import { MarketChartSection } from './MarketChartSection';
import { ListingsChartSection } from './ListingsChartSection';
import { SoldPriceChartSection } from './SoldPriceChartSection';
import { TableView } from './TableView';

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
  
  // Use Repliers API with fallback to mock data
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
    enabled: true, // Enable API calls
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
  
  // Use API data if available, otherwise fallback to mock data
  const chartData = useMemo(() => {
    if (apiMarketData && !apiError) {
      return apiMarketData;
    }
    // Fallback to mock data
    return generateMarketData(locationData, propertyClass);
  }, [apiMarketData, apiError, locationData, propertyClass, chartKey]);

  const listingsData = useMemo(() => {
    if (apiListingsData && !apiError) {
      return apiListingsData;
    }
    // Fallback to mock data
    return generateListingsData(locationData);
  }, [apiListingsData, apiError, locationData, chartKey]);

  const soldPriceData = useMemo(() => {
    if (apiSoldPriceData && !apiError) {
      return apiSoldPriceData;
    }
    // Fallback to mock data
    return generateSoldPriceData(locationData);
  }, [apiSoldPriceData, apiError, locationData, chartKey]);
  
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
  
  // Determine if we're using API data or mock data
  const usingAPIData = !apiError && (apiMarketData || apiListingsData);
  const isLoading = apiLoading;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setChartKey(prev => prev + 1); // Force chart re-render
    
    // Refetch API data
    refetchAPI();
    
    toast.success(usingAPIData ? "Market data refreshed from API!" : "Market data refreshed!");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDownload = () => {
    toast.success("Market data downloaded!");
  };

  const handleToggleView = () => {
    setViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${viewMode === "chart" ? "table" : "chart"} view`);
  };

  return (
    <div className="w-full">
      <HeaderSection
        propertyAddress={propertyAddress}
        propertyClass={propertyClass}
        locationData={locationData}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        usingAPIData={usingAPIData}
        apiError={apiError}
      />
      
      {viewMode === "chart" ? (
        <>
          {/* Main Chart: Median Sold Price & Average Days On Market */}
          <div className="w-full h-[500px] md:h-[400px]">
            <MarketChartSection data={marketData} chartKey={chartKey} />
          </div>

          {/* Second Chart: New/Closed Listings */}
          <div className="mt-12">
            <ChartSectionHeader
              title="New/Closed Listings by Month (Last 6 Months)"
              description="Track market activity with new listings and closed sales"
              isLoading={isLoading}
              usingAPIData={usingAPIData}
              apiError={apiError}
            />
            <div className="w-full h-[400px] md:h-[350px]">
              <ListingsChartSection data={listingsDataFormatted} chartKey={chartKey} />
            </div>
          </div>

          {/* Third Chart: Sold Price Trends */}
          <div className="mt-12">
            <ChartSectionHeader
              title="Med/Avg Sold Price by Month (Last 12 Months)"
              description="Track median and average sold prices over time"
              isLoading={isLoading}
              usingAPIData={usingAPIData}
              apiError={apiError}
            />
            <div className="w-full h-[400px] md:h-[350px]">
              <SoldPriceChartSection data={soldPriceDataFormatted} chartKey={chartKey} />
            </div>
          </div>
        </>
      ) : (
        <TableView
          viewMode={viewMode}
          marketData={marketData}
          listingsData={listingsDataFormatted}
          soldPriceData={soldPriceDataFormatted}
        />
      )}
    </div>
  );
};

