"use client";

import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ArrowUp, ArrowDown, RefreshCw, Table2, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import { formatPrice } from '../utils/helpers';
import { 
  getAverageSoldPriceChartOption, 
  getSalesVolumeChartOption,
  getColorForPropertyType
} from '../utils/chartOptions';
import { 
  generateSalesVolumeMockData,
  generateAverageSoldPriceData,
  generateSalesVolumeData,
  generatePriceOverviewData
} from '../utils/dataGenerators';
import { PropertyListing } from '@/lib/types';
import { MarketTrendsData } from '@/hooks/useMarketTrends';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface HousingPricesSectionProps {
  locationType: LocationType;
  locationName: string;
  parentCity?: string;
  parentArea?: string;
  parentNeighbourhood?: string;
  properties: PropertyListing[];
  dateRanges: {
    current: string;
    past: string;
  };
  propertyType?: string;
  community?: string;
  years?: number;
  marketTrendsData: MarketTrendsData;
  onRefresh?: () => Promise<void>;
}

const PriceCard = ({ label, value, change, showChange = false, subtitle, dollarChange }: { 
  label: string; 
  value: string | number; 
  change?: number; 
  showChange?: boolean;
  subtitle?: string;
  dollarChange?: number;
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  
  return (
    <Card className="p-6 flex flex-col" variant="white">
      <div className="flex items-baseline gap-2 mb-2">
        <div className={`text-2xl font-bold ${showChange && change !== undefined ? (isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-foreground') : 'text-foreground'}`}>
          {typeof value === 'number' ? formatPrice(value) : value}
        </div>
        {showChange && change !== undefined && (
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : isNegative ? (
              <ArrowDown className="h-4 w-4" />
            ) : null}
          </div>
        )}
        {subtitle && (
          <div className="text-sm text-muted-foreground mb-1">
          {subtitle}
          </div>
        )}

      {showChange && dollarChange !== undefined && dollarChange !== 0 && (
        <div className={`text-sm font-medium mb-2 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
          {isPositive ? '+' : ''}{formatPrice(dollarChange)}
        </div>
      )}
      </div>
      
      <div className="text-sm text-muted-foreground mt-auto">
        {label}
      </div>
    </Card>
  );
};

export const HousingPricesSection: React.FC<HousingPricesSectionProps> = ({ 
  locationType,
  locationName,
  parentCity,
  parentArea,
  parentNeighbourhood,
  properties,
  dateRanges,
  propertyType,
  community,
  years = 2,
  marketTrendsData,
  onRefresh,
}) => {
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [averageSoldPriceViewMode, setAverageSoldPriceViewMode] = useState<"chart" | "table">("chart");
  const [salesVolumeViewMode, setSalesVolumeViewMode] = useState<"chart" | "table">("chart");
  const [averageSoldPriceData, setAverageSoldPriceData] = useState<{ months: string[]; prices: number[]; medianPrices?: number[]; counts: number[] }>({ months: [], prices: [], medianPrices: [], counts: [] });
  const [salesVolumeGraphData, setSalesVolumeGraphData] = useState<{ months: string[]; [propertyType: string]: string[] | number[] }>({ months: [] });
  const [salesVolumeTableData, setSalesVolumeTableData] = useState(generateSalesVolumeMockData());
  const [priceOverviewData, setPriceOverviewData] = useState({
    current: {
      avgPrice: 0,
      salesCount: 0,
      monthlyChange: 0,
      quarterlyChange: 0,
      yearlyChange: 0,
    },
    past: {
      avgPrice: 0,
      salesCount: 0,
      monthlyChange: 0,
      quarterlyChange: 0,
      yearlyChange: 0,
    },
  });

  // Handle refresh - delegate to parent's refresh function
  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Process market trends data when it changes
  useEffect(() => {
    // Extract data from marketTrendsData prop
    const avgPriceData = marketTrendsData.averageSoldPrice;
    const salesVolumeData = marketTrendsData.salesVolumeByType;
    const priceOverview = marketTrendsData.priceOverview;

    // Update state with fetched data or fallback to mock data
    if (avgPriceData) {
      // Handle backward compatibility: if medianPrices is missing, use empty array
      setAverageSoldPriceData({
        ...avgPriceData,
        medianPrices: avgPriceData.medianPrices || []
      });
    } else {
      setAverageSoldPriceData(generateAverageSoldPriceData(properties));
    }

    if (salesVolumeData) {
      setSalesVolumeGraphData(salesVolumeData);
      // Generate table data from graph data
      const tableData = generateSalesVolumeMockData(); // Keep mock for now, can enhance later
      setSalesVolumeTableData(tableData);
    } else {
      const mockTableData = generateSalesVolumeMockData();
      setSalesVolumeTableData(mockTableData);
      setSalesVolumeGraphData(generateSalesVolumeData(mockTableData));
    }

    // Keep mock data for table (price by bedrooms aggregation not yet implemented)
    setSalesVolumeTableData(generateSalesVolumeMockData());

    // Only use API data for price overview - no mock fallback
    if (priceOverview) {
      console.log('[HousingPricesSection] Price overview data received:', priceOverview);
      setPriceOverviewData(priceOverview);
    } else {
      console.warn('[HousingPricesSection] Price overview API returned null. Date ranges:', dateRanges);
      // If API fails, show zeros instead of mock data
      setPriceOverviewData({
        current: {
          avgPrice: 0,
          salesCount: 0,
          monthlyChange: 0,
          quarterlyChange: 0,
          yearlyChange: 0,
        },
        past: {
          avgPrice: 0,
          salesCount: 0,
          monthlyChange: 0,
          quarterlyChange: 0,
          yearlyChange: 0,
        },
      });
    }
  }, [marketTrendsData, properties, dateRanges]);

  const handleToggleAveragePriceView = () => {
    setAverageSoldPriceViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${averageSoldPriceViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleToggleSalesVolumeView = () => {
    setSalesVolumeViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${salesVolumeViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleDownload = (type: "averagePrice" | "salesVolume") => {
    toast.success(`${type === "averagePrice" ? "Average price" : "Sales volume"} data downloaded!`);
  };


  return (
      <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            {locationName}'s Housing Prices
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data from API"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Stats Overview
          </h3>
        
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="current" className="px-4">
                Current ({dateRanges.current})
              </TabsTrigger>
              <TabsTrigger value="past" className="px-4">
                Past ({dateRanges.past})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PriceCard 
                  label="Avg sold price" 
                  value={priceOverviewData.current.avgPrice}
                  subtitle={priceOverviewData.current.salesCount > 0 ? `${priceOverviewData.current.salesCount.toLocaleString()} sold` : undefined}
                />
                <PriceCard 
                  label="Monthly change" 
                  value={`${priceOverviewData.current.monthlyChange > 0 ? '+' : ''}${priceOverviewData.current.monthlyChange}%`}
                  change={priceOverviewData.current.monthlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.current.avgPrice && priceOverviewData.current.monthlyChange !== 0 
                    ? (priceOverviewData.current.avgPrice * (priceOverviewData.current.monthlyChange / 100)) / (1 + priceOverviewData.current.monthlyChange / 100)
                    : undefined}
                />
                <PriceCard 
                  label="Quarterly change" 
                  value={`${priceOverviewData.current.quarterlyChange > 0 ? '+' : ''}${priceOverviewData.current.quarterlyChange}%`}
                  change={priceOverviewData.current.quarterlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.current.avgPrice && priceOverviewData.current.quarterlyChange !== 0 
                    ? (priceOverviewData.current.avgPrice * (priceOverviewData.current.quarterlyChange / 100)) / (1 + priceOverviewData.current.quarterlyChange / 100)
                    : undefined}
                />
                <PriceCard 
                  label="Yearly change" 
                  value={`${priceOverviewData.current.yearlyChange > 0 ? '+' : ''}${priceOverviewData.current.yearlyChange}%`}
                  change={priceOverviewData.current.yearlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.current.avgPrice && priceOverviewData.current.yearlyChange !== 0 
                    ? (priceOverviewData.current.avgPrice * (priceOverviewData.current.yearlyChange / 100)) / (1 + priceOverviewData.current.yearlyChange / 100)
                    : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PriceCard 
                  label="Avg sold price" 
                  value={priceOverviewData.past.avgPrice}
                  subtitle={priceOverviewData.past.salesCount > 0 ? `${priceOverviewData.past.salesCount.toLocaleString()} sold` : undefined}
                />
                <PriceCard 
                  label="Monthly change" 
                  value={`${priceOverviewData.past.monthlyChange > 0 ? '+' : ''}${priceOverviewData.past.monthlyChange}%`}
                  change={priceOverviewData.past.monthlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.past.avgPrice && priceOverviewData.past.monthlyChange !== 0 
                    ? (priceOverviewData.past.avgPrice * (priceOverviewData.past.monthlyChange / 100)) / (1 + priceOverviewData.past.monthlyChange / 100)
                    : undefined}
                />
                <PriceCard 
                  label="Quarterly change" 
                  value={`${priceOverviewData.past.quarterlyChange > 0 ? '+' : ''}${priceOverviewData.past.quarterlyChange}%`}
                  change={priceOverviewData.past.quarterlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.past.avgPrice && priceOverviewData.past.quarterlyChange !== 0 
                    ? (priceOverviewData.past.avgPrice * (priceOverviewData.past.quarterlyChange / 100)) / (1 + priceOverviewData.past.quarterlyChange / 100)
                    : undefined}
                />
                <PriceCard 
                  label="Yearly change" 
                  value={`${priceOverviewData.past.yearlyChange > 0 ? '+' : ''}${priceOverviewData.past.yearlyChange}%`}
                  change={priceOverviewData.past.yearlyChange}
                  showChange={true}
                  dollarChange={priceOverviewData.past.avgPrice && priceOverviewData.past.yearlyChange !== 0 
                    ? (priceOverviewData.past.avgPrice * (priceOverviewData.past.yearlyChange / 100)) / (1 + priceOverviewData.past.yearlyChange / 100)
                    : undefined}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Explanation Section */}
        <div className="mb-8 bg-muted/30 rounded-lg p-6">
          <button
            onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
            className="w-full flex items-center gap-2 text-left hover:text-primary transition-colors"
          >
            <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-foreground">
              Average price not what you expected? Here's why.
            </span>
            {isExplanationExpanded ? (
              <ChevronUp className="h-5 w-5 ml-auto flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 ml-auto flex-shrink-0" />
            )}
          </button>

          {isExplanationExpanded && (
            <div className="mt-4 pl-7 space-y-4 text-sm text-muted-foreground animate-in slide-in-from-top-2">
              <p>
                The change in average home price is affected by two factors:
              </p>
              
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">The proportions of home types sold has changed.</strong> This means that the mix of homes sold has shifted from a majority of higher-priced homes to a majority of lower-priced homes, or vice versa.
                </li>
                <li>
                  <strong className="text-foreground">Assuming the mix of homes is relatively stable, all homes are being sold for more or less than the last period.</strong>
                </li>
              </ol>

              <p>
                For example, if the average price decreased from last year, all homes sold this year were either sold for less and/or the majority of them were budget-friendly condos, rather than expensive single-family homes.
              </p>

              <p>
                <a 
                  href="#about-report" 
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('about-report')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  How we calculate our stats
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Graphs Section - Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average & Median Sold Price Graph */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Average & Median Sold Price in {locationName}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleAveragePriceView}
                  className="h-8 w-8 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownload("averagePrice")}
                  className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Card className="p-6" variant='white'>
              {averageSoldPriceViewMode === "chart" ? (
                <ReactECharts
                  option={getAverageSoldPriceChartOption(averageSoldPriceData)}
                  style={{ height: '400px' }}
                />
              ) : (
                <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">Average Price</TableHead>
                        <TableHead className="text-right font-semibold">Median Price</TableHead>
                        <TableHead className="text-right font-semibold">Sales Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {averageSoldPriceData.months.map((month, index) => (
                        <TableRow key={month} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">
                            {averageSoldPriceData.prices[index] ? formatPrice(averageSoldPriceData.prices[index]) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {averageSoldPriceData.medianPrices?.[index] ? formatPrice(averageSoldPriceData.medianPrices[index]) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {averageSoldPriceData.counts[index] || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          {/* Sales Volume by Property Type Graph */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Sales Volume by Property Type in {locationName}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleSalesVolumeView}
                  className="h-8 w-8 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownload("salesVolume")}
                  className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Card className="p-6" variant='white'>
              {salesVolumeViewMode === "chart" ? (
                <ReactECharts
                  option={getSalesVolumeChartOption(salesVolumeGraphData)}
                  style={{ height: '400px' }}
                />
              ) : (
                <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        {Object.keys(salesVolumeGraphData)
                          .filter(key => key !== 'months')
                          .filter((propertyType) => {
                            // Only show property types with data
                            const counts = salesVolumeGraphData[propertyType] as number[];
                            return counts && counts.length > 0 && counts.some(count => count > 0);
                          })
                          .map((propertyType, index) => {
                            const colors = getColorForPropertyType(index);
                            return (
                              <TableHead key={propertyType} className="text-right font-semibold">
                                <span className="inline-flex items-center gap-2">
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: colors.solid }}
                                  ></span>
                                  {propertyType}
                                </span>
                              </TableHead>
                            );
                          })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesVolumeGraphData.months.map((month, index) => (
                        <TableRow key={month} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{month}</TableCell>
                          {Object.keys(salesVolumeGraphData)
                            .filter(key => key !== 'months')
                            .filter((propertyType) => {
                              // Only show property types with data
                              const counts = salesVolumeGraphData[propertyType] as number[];
                              return counts && counts.length > 0 && counts.some(count => count > 0);
                            })
                            .map((propertyType, propIndex) => {
                              const colors = getColorForPropertyType(propIndex);
                              const counts = salesVolumeGraphData[propertyType] as number[];
                              return (
                                <TableCell key={propertyType} className="text-right">
                                  <span className="inline-flex items-center gap-2">
                                    <span 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: colors.solid }}
                                    ></span>
                                    {counts[index] || 0}
                                  </span>
                                </TableCell>
                              );
                            })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Average Sold Price Breakdown Table */}
        {/* <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Average Prices by Bedrooms
          </h3>
          
          <Tabs defaultValue="townhouse" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="detached" className="px-4">
                Detached
              </TabsTrigger>
              <TabsTrigger value="townhouse" className="px-4">
                Townhouse
              </TabsTrigger>
              <TabsTrigger value="condo" className="px-4">
                Condo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detached" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold"># Beds</TableHead>
                      <TableHead className="text-right font-semibold">{dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">3 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">6 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">1 year ago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {salesVolumeTableData.detached.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{row.current}</span>
                            <span className="text-red-600 text-sm font-medium">
                              ({row.yoyChange > 0 ? '+' : ''}{row.yoyChange}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{row.threeMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.sixMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.oneYearAgo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: +/- change calculated year-over-year
              </p>
            </TabsContent>

            <TabsContent value="townhouse" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold"># Beds</TableHead>
                      <TableHead className="text-right font-semibold">{dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">3 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">6 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">1 year ago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {salesVolumeTableData.townhouse.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{row.current}</span>
                            <span className="text-red-600 text-sm font-medium">
                              ({row.yoyChange > 0 ? '+' : ''}{row.yoyChange}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{row.threeMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.sixMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.oneYearAgo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: +/- change calculated year-over-year
              </p>
            </TabsContent>

            <TabsContent value="condo" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold"># Beds</TableHead>
                      <TableHead className="text-right font-semibold">{dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">3 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">6 mo ago</TableHead>
                      <TableHead className="text-right font-semibold">1 year ago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {salesVolumeTableData.condo.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{row.current}</span>
                            <span className="text-red-600 text-sm font-medium">
                              ({row.yoyChange > 0 ? '+' : ''}{row.yoyChange}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{row.threeMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.sixMonthsAgo}</TableCell>
                        <TableCell className="text-right">{row.oneYearAgo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: +/- change calculated year-over-year
              </p>
            </TabsContent>
          </Tabs>
        </div> */}
      </div>
    </section>
  );
};

