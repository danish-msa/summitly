import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocationData } from "@/hooks/useLocationData";
import type { ProcessedLocation } from "@/data/types";
import { MarketAnalyticsProps, MarketData, ListingsData, SoldPriceData } from './types';
import { generateMarketData, generateListingsData, generateSoldPriceData } from './dataGenerators';
import { MarketChartSection } from './MarketChartSection';
import { ListingsChartSection } from './ListingsChartSection';
import { SoldPriceChartSection } from './SoldPriceChartSection';
import { TableView } from './TableView';
import { MarketStats } from './MarketStats';
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  VerticalTabs, 
  VerticalTabsList, 
  VerticalTabsTrigger, 
  VerticalTabsContent,
  VerticalTabsContainer
} from '@/components/ui/vertical-tabs';
import { Download, Table2, TrendingUp, RefreshCw, ArrowDown, BarChart3, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocationName, getPropertyClassLabel } from './dataGenerators';
import { RepliersAPI } from '@/lib/api/repliers';

export const MarketAnalytics: React.FC<MarketAnalyticsProps> = ({ 
  propertyAddress, 
  propertyClass,
  latitude,
  longitude,
  city // Add city as optional prop
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Separate view modes for each tab
  const [marketViewMode, setMarketViewMode] = useState<"chart" | "table">("chart");
  const [listingsViewMode, setListingsViewMode] = useState<"chart" | "table">("chart");
  const [soldPriceViewMode, setSoldPriceViewMode] = useState<"chart" | "table">("chart");
  const [locationData, setLocationData] = useState<ProcessedLocation | null>(null);
  const [chartKey, setChartKey] = useState(0);
  
  // API data state
  const [apiMarketData, setApiMarketData] = useState<MarketData | null>(null);
  const [apiListingsData, setApiListingsData] = useState<ListingsData | null>(null);
  const [apiSoldPriceData, setApiSoldPriceData] = useState<SoldPriceData | null>(null);
  const [apiSummaryStats, setApiSummaryStats] = useState<{
    activeListings: number;
    newListings: number;
    soldProperties: number;
    medianPrice: number;
    avgDOM: number;
    last1YearGrowth: number;
    last5YearsGrowth: number;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { searchLocations } = useLocationData();
  
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
      } catch (error) {
        console.error('Error finding location data:', error);
      }
    };
    
    findLocationData();
  }, [propertyAddress, searchLocations]);
  
  // Fetch data from repliers API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      // Only fetch if we have coordinates
      if (!latitude || !longitude) {
        console.log('[MarketAnalytics] No coordinates available, using mock data');
        return;
      }

      setIsLoading(true);
      setApiError(null);

      try {
        console.log('[MarketAnalytics] Fetching analytics data with params:', {
          latitude,
          longitude,
          propertyClass,
        });

        // Use city prop if available, otherwise try to extract from address
        let cityName = city;
        if (!cityName) {
          const addressParts = propertyAddress.split(',');
          cityName = addressParts[1]?.trim() || addressParts[2]?.trim() || '';
        }

        console.log('[MarketAnalytics] City extraction:', {
          cityProp: city,
          extractedCity: cityName,
          propertyAddress,
          willUseCity: !!cityName,
        });

        const analyticsParams = {
          latitude,
          longitude,
          radiusKm: 10, // 10km radius (fallback if city not available)
          propertyClass: propertyClass || undefined,
          city: cityName || undefined, // Use city if available (matches Postman format)
        };

        // Fetch all analytics endpoints in parallel
        const [marketTrends, listingsActivity, soldPriceTrends, summaryStats] = await Promise.all([
          RepliersAPI.analytics.getMarketTrends(analyticsParams),
          RepliersAPI.analytics.getListingsActivity(analyticsParams),
          RepliersAPI.analytics.getSoldPriceTrends(analyticsParams),
          RepliersAPI.analytics.getMarketSummaryStats(analyticsParams),
        ]);

        console.log('[MarketAnalytics] API Results:', {
          marketTrends: marketTrends ? `✓ ${marketTrends.months.length} months` : '✗ null',
          listingsActivity: listingsActivity ? `✓ ${listingsActivity.months.length} months` : '✗ null',
          soldPriceTrends: soldPriceTrends ? `✓ ${soldPriceTrends.months.length} months` : '✗ null',
        });

        if (marketTrends) {
          setApiMarketData(marketTrends);
        }
        if (listingsActivity) {
          setApiListingsData(listingsActivity);
        }
        if (soldPriceTrends) {
          setApiSoldPriceData(soldPriceTrends);
        }
        if (summaryStats) {
          setApiSummaryStats(summaryStats);
        }

        // If all three failed, show error
        if (!marketTrends && !listingsActivity && !soldPriceTrends) {
          setApiError('No market analytics data available');
          toast.error('Failed to load market analytics. Using sample data.');
        } else {
          setChartKey(prev => prev + 1); // Trigger chart re-render
        }
      } catch (error) {
        // Handle both ApiResponse errors and regular exceptions
        let errorMessage = 'Failed to load market analytics data';
        
        if (error && typeof error === 'object' && 'error' in error && 'data' in error) {
          // This is an ApiResponse object thrown by the client
          const apiResponse = error as { error: { code: string; message: string } | null; data: unknown };
          console.error('[MarketAnalytics] API Response Error:', {
            errorCode: apiResponse.error?.code,
            errorMessage: apiResponse.error?.message,
            hasData: !!apiResponse.data,
          });
          errorMessage = apiResponse.error?.message || errorMessage;
        } else if (error instanceof Error) {
          console.error('[MarketAnalytics] Exception:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
          });
          errorMessage = error.message || errorMessage;
        } else {
          console.error('[MarketAnalytics] Unknown error:', error);
        }
        
        setApiError(errorMessage);
        toast.error('Failed to load market analytics. Using sample data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [latitude, longitude, propertyClass]);

  // Use API data if available, otherwise fall back to mock data
  const chartData = useMemo(() => {
    if (apiMarketData) {
      return apiMarketData;
    }
    return generateMarketData(locationData, propertyClass);
  }, [apiMarketData, locationData, propertyClass]);

  const listingsData = useMemo(() => {
    if (apiListingsData) {
      return apiListingsData;
    }
    return generateListingsData(locationData);
  }, [apiListingsData, locationData]);

  const soldPriceData = useMemo(() => {
    if (apiSoldPriceData) {
      return apiSoldPriceData;
    }
    return generateSoldPriceData(locationData);
  }, [apiSoldPriceData, locationData]);
  
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
  
  const handleRefresh = async () => {
    if (!latitude || !longitude) {
      toast.info("Coordinates not available. Using sample data.");
      return;
    }

    setIsRefreshing(true);
    setApiError(null);

    try {
      // Use city prop if available, otherwise try to extract from address
      let cityName = city;
      if (!cityName) {
        const addressParts = propertyAddress.split(',');
        cityName = addressParts[1]?.trim() || addressParts[2]?.trim() || '';
      }

      const analyticsParams = {
        latitude,
        longitude,
        radiusKm: 10,
        propertyClass: propertyClass || undefined,
        city: cityName || undefined,
      };

      const [marketTrends, listingsActivity, soldPriceTrends, summaryStats] = await Promise.all([
        RepliersAPI.analytics.getMarketTrends(analyticsParams),
        RepliersAPI.analytics.getListingsActivity(analyticsParams),
        RepliersAPI.analytics.getSoldPriceTrends(analyticsParams),
        RepliersAPI.analytics.getMarketSummaryStats(analyticsParams),
      ]);

      if (marketTrends) {
        setApiMarketData(marketTrends);
      }
      if (listingsActivity) {
        setApiListingsData(listingsActivity);
      }
      if (soldPriceTrends) {
        setApiSoldPriceData(soldPriceTrends);
      }
      if (summaryStats) {
        setApiSummaryStats(summaryStats);
      }

      setChartKey(prev => prev + 1);
      toast.success("Market data refreshed!");
    } catch (error) {
      console.error('[MarketAnalytics] Error refreshing data:', error);
      toast.error('Failed to refresh market data');
      setApiError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Chart Skeleton Component
  const ChartSkeleton = ({ height = "h-[400px]" }: { height?: string }) => (
    <div className={`w-full ${height} rounded-lg border border-border bg-card p-6`}>
      <div className="space-y-4">
        {/* Chart area skeleton */}
        <Skeleton className="h-full w-full rounded-lg" />
        {/* Legend skeleton */}
        <div className="flex gap-4 justify-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );

  // Table Skeleton Component
  const TableSkeleton = () => (
    <div className="w-full overflow-auto max-h-[500px] md:max-h-[600px] rounded-lg border border-border">
      <div className="p-4 space-y-3">
        {/* Header skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-32 ml-auto" />
          <Skeleton className="h-6 w-32" />
        </div>
        {/* Rows skeleton */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32 ml-auto" />
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>
    </div>
  );

  // Separate handlers for each tab
  const handleToggleMarketView = () => {
    setMarketViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${marketViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleToggleListingsView = () => {
    setListingsViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${listingsViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleToggleSoldPriceView = () => {
    setSoldPriceViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${soldPriceViewMode === "chart" ? "table" : "chart"} view`);
  };

  // Download handlers for each tab
  const handleDownloadMarket = () => {
    // Convert data to CSV format
    const csvContent = [
      ['Period', 'Median Sold Price', 'Average Sold Price'],
      ...marketData.months.map((month, index) => [
        month,
        marketData.prices[index]?.toLocaleString() || '',
        marketData.days[index]?.toLocaleString() || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `market-trends-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Market trends data downloaded!");
  };

  const handleDownloadListings = () => {
    const csvContent = [
      ['Month', 'New Listings', 'Closed Listings'],
      ...listingsDataFormatted.months.map((month, index) => [
        month,
        listingsDataFormatted.newListings[index] || 0,
        listingsDataFormatted.closedListings[index] || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `listings-activity-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Listings activity data downloaded!");
  };

  const handleDownloadSoldPrice = () => {
    const csvContent = [
      ['Month', 'Median Price', 'Average Price'],
      ...soldPriceDataFormatted.months.map((month, index) => [
        month,
        soldPriceDataFormatted.medianPrices[index]?.toLocaleString() || '',
        soldPriceDataFormatted.averagePrices[index]?.toLocaleString() || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sold-price-trends-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sold price trends data downloaded!");
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

  const { neighborhood, city: displayCity } = getNeighborhoodAndCity();

  // Use real data from API if available, otherwise use mock data as fallback
  const marketStats = apiSummaryStats || {
    activeListings: 195,
    newListings: 97,
    soldProperties: 47,
    medianPrice: 640725,
    avgDOM: 36,
    last1YearGrowth: -11.6, // Negative for decrease
    last5YearsGrowth: -1.4, // Negative for decrease
  };

  return (
    <div className="w-full">
      <VerticalTabs defaultValue="stats" className="w-full">
        <VerticalTabsContainer>
          <VerticalTabsList>
            <VerticalTabsTrigger value="stats" className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-secondary" />
              <span>Market Stats</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="market" className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
              <span>Market Trends</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="listings" className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-secondary" />
              <span>Listings Activity</span>
            </VerticalTabsTrigger>
            <VerticalTabsTrigger value="prices" className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
              <span>Sold Prices</span>
            </VerticalTabsTrigger>
          </VerticalTabsList>

          <div className="flex-1">
            <VerticalTabsContent value="stats">
              <MarketStats 
                neighborhood={neighborhood}
                displayCity={displayCity}
                marketStats={marketStats}
              />
            </VerticalTabsContent>

            <VerticalTabsContent value="market">
            {/* Header Section for Market Trends */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {getLocationName(locationData, propertyAddress)} • {getPropertyClassLabel(propertyClass)}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Median & Average Sold Price last 12 months
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={marketViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleMarketView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={marketViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {marketViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
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
                  onClick={handleDownloadMarket}
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
            {/* Main Chart or Table: Median Sold Price & Average Sold Price */}
            {marketViewMode === "chart" ? (
              <div className="w-full h-[500px] md:h-[400px]">
                {isLoading ? (
                  <ChartSkeleton height="h-full" />
                ) : (
                  <MarketChartSection data={marketData} chartKey={chartKey} />
                )}
              </div>
            ) : (
              isLoading ? (
                <TableSkeleton />
              ) : (
                <div className="w-full overflow-auto max-h-[500px] md:max-h-[600px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Period</TableHead>
                        <TableHead className="text-right font-semibold">Median Sold Price</TableHead>
                        <TableHead className="text-right font-semibold">Average Sold Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketData.months.map((month, index) => (
                        <TableRow 
                          key={index} 
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              ${marketData.prices[index]?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                            ${marketData.days[index]?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )
            )}
            </VerticalTabsContent>

            <VerticalTabsContent value="listings">
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={listingsViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleListingsView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={listingsViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {listingsViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
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
                  onClick={handleDownloadListings}
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
            {/* Second Chart or Table: New/Closed Listings */}
            {listingsViewMode === "chart" ? (
              <div className="w-full h-[400px] md:h-[350px]">
                {isLoading ? (
                  <ChartSkeleton height="h-full" />
                ) : (
                  <ListingsChartSection data={listingsDataFormatted} chartKey={chartKey} />
                )}
              </div>
            ) : (
              isLoading ? (
                <TableSkeleton />
              ) : (
                <div className="w-full overflow-auto max-h-[400px] md:max-h-[500px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">New Listings</TableHead>
                        <TableHead className="text-right font-semibold">Closed Listings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingsDataFormatted.months.map((month, index) => (
                      <TableRow 
                        key={index} 
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {listingsDataFormatted.newListings[index] || 0} listings
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            {listingsDataFormatted.closedListings[index] || 0} listings
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )
            )}
            </VerticalTabsContent>

            <VerticalTabsContent value="prices">
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={soldPriceViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleSoldPriceView}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={soldPriceViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {soldPriceViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
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
                  onClick={handleDownloadSoldPrice}
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
            {/* Third Chart or Table: Sold Price Trends */}
            {soldPriceViewMode === "chart" ? (
              <div className="w-full h-[400px] md:h-[350px]">
                {isLoading ? (
                  <ChartSkeleton height="h-full" />
                ) : (
                  <SoldPriceChartSection data={soldPriceDataFormatted} chartKey={chartKey} />
                )}
              </div>
            ) : (
              isLoading ? (
                <TableSkeleton />
              ) : (
                <div className="w-full overflow-auto max-h-[400px] md:max-h-[500px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="font-semibold text-right">Median Price</TableHead>
                        <TableHead className="font-semibold text-right">Average Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soldPriceDataFormatted.months.map((month, index) => (
                        <TableRow key={month} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              ${(soldPriceDataFormatted.medianPrices[index] / 1000).toFixed(0)}k
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              ${(soldPriceDataFormatted.averagePrices[index] / 1000).toFixed(0)}k
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
            </VerticalTabsContent>
          </div>
        </VerticalTabsContainer>
      </VerticalTabs>

      {/* Call to Action */}
      <div className="flex justify-center pt-6 pb-4">
        <Button 
          variant="default" 
          className="px-8 py-6 text-base rounded-lg gap-2"
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

