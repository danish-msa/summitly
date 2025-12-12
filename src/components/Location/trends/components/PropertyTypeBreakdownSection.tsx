"use client";

import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, Table2, Download } from "lucide-react";
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
import { formatFullPrice } from '../utils/helpers';
import { 
  getSalesVolumeChartOption,
  getColorForPropertyType
} from '../utils/chartOptions';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface PropertyTypeBreakdownSectionProps {
  locationType: LocationType;
  locationName: string;
}

interface StatChange {
  value: number;
  label: string;
  isPositive?: boolean;
}

interface PropertyData {
  type: string;
  avgPrice: number;
  priceChanges: StatChange[];
  transactions: number;
  transactionChanges: StatChange[];
}

interface PropertyTypeBreakdownData {
  propertyType: string;
  avgPrice: number;
  medianPrice: number;
  avgPriceOneMonthChange: number;
  avgPriceOneYearChange: number;
  transactions: number;
  transactionsOneMonthChange: number;
  transactionsOneYearChange: number;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const ChangeIndicator = ({ change }: { change: StatChange }) => {
  const isPositive = change.isPositive ?? false;
  
  return (
    <div className="flex items-center gap-1.5">
      {isPositive ? (
        <ArrowUp className="w-6 h-6 text-green-600" />
      ) : (
        <ArrowDown className="w-6 h-6 text-red-600" />
      )}
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {Math.abs(change.value).toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground">({change.label})</span>
      </div>
    </div>
  );
};

const PropertyCard = ({ data, isFirst }: { data: PropertyData; isFirst?: boolean }) => {
  return (
    <div className={`relative flex flex-col bg-white rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/20 hover:-translate-y-1`}>
      {/* Header */}
      <div className="bg-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-primary-foreground tracking-wide uppercase text-center">
          {data.type}
        </h3>
      </div>
      
      {/* Price Section */}
      <div className="p-3 border-b border-border/50">
        <div className="flex flex-col items-center gap-2 mb-2">
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {formatFullPrice(data.avgPrice)}
          </p>
          <p className="text-sm text-muted-foreground font-medium">Avg. Sold Price</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.priceChanges.map((change, index) => (
            <ChangeIndicator key={index} change={change} />
          ))}
        </div>
      </div>
      
      {/* Transactions Section */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex flex-row justify-between items-center">
            <p className="text-md font-bold text-foreground tracking-tight mr-2">
              {formatNumber(data.transactions)}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Properties Sold</p>
  
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.transactionChanges.map((change, index) => (
            <ChangeIndicator key={index} change={change} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const PropertyTypeBreakdownSection: React.FC<PropertyTypeBreakdownSectionProps> = ({ 
  locationType,
  locationName 
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [salesVolumeGraphData, setSalesVolumeGraphData] = useState<{ months: string[]; [propertyType: string]: string[] | number[] }>({ months: [] });
  const [salesVolumeViewMode, setSalesVolumeViewMode] = useState<"chart" | "table">("chart");
  
  // Calculate property type totals for the legend
  const propertyTypeTotals = React.useMemo(() => {
    const totals: Array<{ name: string; value: number; color: string; percent: number }> = [];
    const allPropertyTypes = Object.keys(salesVolumeGraphData).filter(key => key !== 'months');
    
    allPropertyTypes.forEach((propertyType) => {
      const counts = salesVolumeGraphData[propertyType] as number[];
      if (counts && counts.length > 0 && counts.some(count => count > 0)) {
        const total = counts.reduce((sum, count) => sum + (count || 0), 0);
        if (total > 0) {
          totals.push({
            name: propertyType,
            value: total,
            color: '',
            percent: 0
          });
        }
      }
    });
    
    // Sort by value (descending)
    totals.sort((a, b) => b.value - a.value);
    
    // Calculate grand total and percentages
    const grandTotal = totals.reduce((sum, item) => sum + item.value, 0);
    
    // Assign colors and percentages
    totals.forEach((item, index) => {
      const colors = getColorForPropertyType(index);
      item.color = colors.solid;
      item.percent = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
    });
    
    // Filter out items with percentage < 0.1%
    return totals.filter(item => item.percent >= 0.1);
  }, [salesVolumeGraphData]);

  const fetchPropertyTypeBreakdown = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Only fetch for city-level views
      if (locationType !== 'city') {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch property type breakdown and sales volume data in parallel
      const breakdownUrl = new URL('/api/market-trends/property-type-breakdown', window.location.origin);
      breakdownUrl.searchParams.set('city', locationName);
      if (forceRefresh) {
        breakdownUrl.searchParams.set('refresh', 'true');
      }

      // Build market trends API URL for sales volume data
      const marketTrendsUrl = new URL(`/api/market-trends/${locationType}/${encodeURIComponent(locationName)}`, window.location.origin);
      marketTrendsUrl.searchParams.set('years', '2');
      if (forceRefresh) {
        marketTrendsUrl.searchParams.set('refresh', 'true');
      }
      
      const [breakdownResponse, marketTrendsResponse] = await Promise.all([
        fetch(breakdownUrl.toString()),
        fetch(marketTrendsUrl.toString())
      ]);
      
      if (!breakdownResponse.ok) {
        throw new Error('Failed to fetch property type breakdown data');
      }

      const data = await breakdownResponse.json();

      // Fetch sales volume data
      if (marketTrendsResponse.ok) {
        const marketTrendsData = await marketTrendsResponse.json();
        if (marketTrendsData.salesVolumeByType) {
          // Filter out unwanted property types from sales volume data
          const excludedPropertyTypes = ['Parking Space', 'Common Element Condo'];
          const filteredSalesVolume: { months: string[]; [key: string]: string[] | number[] } = {
            months: marketTrendsData.salesVolumeByType.months || []
          };
          
          Object.keys(marketTrendsData.salesVolumeByType)
            .filter(key => key !== 'months' && !excludedPropertyTypes.includes(key))
            .forEach(propertyType => {
              filteredSalesVolume[propertyType] = marketTrendsData.salesVolumeByType[propertyType];
            });
          
          setSalesVolumeGraphData(filteredSalesVolume);
        }
      }
      
      // Format month for display
      const [year, month] = data.month.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = parseInt(month) - 1;
      setCurrentMonth(`${monthNames[monthIndex]} ${year}`);

      const breakdownData = data.breakdownData as PropertyTypeBreakdownData[];

      // Filter out unwanted property types
      const excludedPropertyTypes = ['Parking Space', 'Common Element Condo'];
      const filteredBreakdownData = breakdownData.filter(
        item => !excludedPropertyTypes.includes(item.propertyType)
      );

      // Transform API data to component format
      const transformedData: PropertyData[] = filteredBreakdownData.map(item => ({
        type: item.propertyType,
        avgPrice: item.avgPrice,
        priceChanges: [
          { 
            value: item.avgPriceOneMonthChange, 
            label: "MoM", 
            isPositive: item.avgPriceOneMonthChange > 0 
          },
          { 
            value: item.avgPriceOneYearChange, 
            label: "YoY", 
            isPositive: item.avgPriceOneYearChange > 0 
          },
        ],
        transactions: item.transactions,
        transactionChanges: [
          { 
            value: item.transactionsOneMonthChange, 
            label: "MoM", 
            isPositive: item.transactionsOneMonthChange > 0 
          },
          { 
            value: item.transactionsOneYearChange, 
            label: "YoY", 
            isPositive: item.transactionsOneYearChange > 0 
          },
        ],
      }));

      // Add "All Property Types" aggregate at the beginning
      if (transformedData.length > 0) {
        const totalTransactions = transformedData.reduce((sum, item) => sum + item.transactions, 0);
        const allTypesAggregate: PropertyData = {
          type: "All Property Types",
          avgPrice: totalTransactions > 0
            ? Math.round(
                transformedData.reduce((sum, item) => sum + (item.avgPrice * item.transactions), 0) /
                totalTransactions
              )
            : 0,
          priceChanges: [
            {
              value: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const monthChange = item.priceChanges[0]?.value || 0;
                    return sum + (monthChange * item.transactions);
                  }, 0) / totalTransactions
                : 0,
              label: "MoM",
              isPositive: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const monthChange = item.priceChanges[0]?.value || 0;
                    return sum + (monthChange * item.transactions);
                  }, 0) / totalTransactions > 0
                : false,
            },
            {
              value: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const yearChange = item.priceChanges[1]?.value || 0;
                    return sum + (yearChange * item.transactions);
                  }, 0) / totalTransactions
                : 0,
              label: "YoY",
              isPositive: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const yearChange = item.priceChanges[1]?.value || 0;
                    return sum + (yearChange * item.transactions);
                  }, 0) / totalTransactions > 0
                : false,
            },
          ],
          transactions: totalTransactions,
          transactionChanges: [
            {
              value: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const monthChange = item.transactionChanges[0]?.value || 0;
                    return sum + (monthChange * item.transactions);
                  }, 0) / totalTransactions
                : 0,
              label: "MoM",
              isPositive: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const monthChange = item.transactionChanges[0]?.value || 0;
                    return sum + (monthChange * item.transactions);
                  }, 0) / totalTransactions > 0
                : false,
            },
            {
              value: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const yearChange = item.transactionChanges[1]?.value || 0;
                    return sum + (yearChange * item.transactions);
                  }, 0) / totalTransactions
                : 0,
              label: "YoY",
              isPositive: totalTransactions > 0
                ? transformedData.reduce((sum, item) => {
                    const yearChange = item.transactionChanges[1]?.value || 0;
                    return sum + (yearChange * item.transactions);
                  }, 0) / totalTransactions > 0
                : false,
            },
          ],
        };
        setPropertyData([allTypesAggregate, ...transformedData]);
      } else {
        setPropertyData(transformedData);
      }
    } catch (error) {
      console.error('[PropertyTypeBreakdownSection] Error fetching property type breakdown:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch for city-level views
    if (locationType === 'city') {
      fetchPropertyTypeBreakdown();
    }
  }, [locationType, locationName]);

  const handleRefresh = () => {
    fetchPropertyTypeBreakdown(true);
  };

  const handleToggleSalesVolumeView = () => {
    setSalesVolumeViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${salesVolumeViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleDownload = (type: "salesVolume") => {
    toast.success("Sales volume data downloaded!");
  };

  // Only show for city-level views
  if (locationType !== 'city') {
    return null;
  }

  if (loading) {
    return (
      <section className="border-b">
        <div className="container-1400 mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b py-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container-1400 mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Breakdown by Property Type
            </h2>
            <p className="text-muted-foreground text-lg">
              Real-time property market insights across different property types
              {currentMonth && ` - Data for ${currentMonth}`}
            </p>
          </div>
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
        
        {propertyData.length > 0 ? (
          <div className="space-y-8">
            {/* Property Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-1">
              {propertyData.map((data, index) => (
                <PropertyCard key={data.type} data={data} isFirst={index === 0} />
              ))}
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
                  <div className="flex gap-6">
                    {/* Graph on the left */}
                    <div className="flex-1">
                      <ReactECharts
                        option={getSalesVolumeChartOption(salesVolumeGraphData, true)}
                        style={{ height: '400px' }}
                      />
                    </div>
                    {/* Vertical property types list on the right */}
                    <div className="w-64 flex-shrink-0">
                      <div className="sticky top-0">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Property Types</h4>
                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                          {propertyTypeTotals.map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.value.toLocaleString()} ({item.percent.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No property type data available</p>
          </div>
        )}
      </div>
    </section>
  );
};

