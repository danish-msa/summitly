"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronDown, ChevronUp, Table2, Download } from "lucide-react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketTrendsData } from '@/hooks/useMarketTrends';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface MarketStatsProps {
  cityName: string;
  locationType?: LocationType;
  locationName?: string;
  parentCity?: string;
  parentArea?: string;
  parentNeighbourhood?: string;
  propertyType?: string;
  community?: string;
  years?: number;
  marketTrendsData?: MarketTrendsData;
  onRefresh?: () => Promise<void>;
}

export const MarketStats: React.FC<MarketStatsProps> = ({ 
  cityName, 
  locationType = 'city',
  locationName,
  parentCity,
  parentArea,
  parentNeighbourhood,
  propertyType,
  community,
  years = 5,
  marketTrendsData,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dataView, setDataView] = useState<"sold" | "rented">("sold");
  const [cityViewMode, setCityViewMode] = useState<"chart" | "table">("chart");
  const [refreshing, setRefreshing] = useState(false);
  const [averageSoldPriceByType, setAverageSoldPriceByType] = useState<{
    months: string[];
    detached: number[];
    townhouse: number[];
    condo: number[];
  } | null>(null);
  const [priceOverview, setPriceOverview] = useState<{
    current: {
      avgPrice: number;
      salesCount: number;
      monthlyChange: number;
      quarterlyChange: number;
      yearlyChange: number;
    };
    past: {
      avgPrice: number;
      salesCount: number;
      monthlyChange: number;
      quarterlyChange: number;
      yearlyChange: number;
    };
  } | null>(null);
  const [averageSoldPrice, setAverageSoldPrice] = useState<{
    months: string[];
    prices: number[];
    medianPrices?: number[];
    counts: number[];
  } | null>(null);

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

  // Process market trends data when it changes (if provided)
  useEffect(() => {
    if (marketTrendsData) {
      if (marketTrendsData.averageSoldPriceByType) {
        setAverageSoldPriceByType(marketTrendsData.averageSoldPriceByType);
      }
      if (marketTrendsData.priceOverview) {
        setPriceOverview(marketTrendsData.priceOverview);
      }
      if (marketTrendsData.averageSoldPrice) {
        setAverageSoldPrice(marketTrendsData.averageSoldPrice);
      }
    } else {
      // Fallback: fetch data if marketTrendsData is not provided (backward compatibility)
      const fetchMarketData = async () => {
        try {
          const cleanLocationName = (locationName || cityName)
            .replace(/\s+Real\s+Estate$/i, '')
            .replace(/\s+RE$/i, '')
            .trim();
          
          const params = new URLSearchParams();
          if (parentCity) params.append('parentCity', parentCity);
          if (parentArea) params.append('parentArea', parentArea);
          if (parentNeighbourhood) params.append('parentNeighbourhood', parentNeighbourhood);
          if (propertyType) params.append('propertyType', propertyType);
          if (community) params.append('community', community);
          if (years) params.append('years', years.toString());
          
          const queryString = params.toString();
          const apiUrl = `/api/market-trends/${locationType}/${encodeURIComponent(cleanLocationName)}${queryString ? `?${queryString}` : ''}`;
          
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const marketData = await response.json();
          
          if (marketData.averageSoldPriceByType) {
            setAverageSoldPriceByType(marketData.averageSoldPriceByType);
          }
          if (marketData.priceOverview) {
            setPriceOverview(marketData.priceOverview);
          }
          if (marketData.averageSoldPrice) {
            setAverageSoldPrice(marketData.averageSoldPrice);
          }
        } catch (error) {
          console.error('Error fetching market data:', error);
        }
      };

      fetchMarketData();
    }
  }, [marketTrendsData, locationType, locationName, cityName, parentCity, parentArea, parentNeighbourhood, propertyType, community, years]);

  // Calculate stats from API data
  const getCityStats = () => {
    if (!priceOverview) {
      return {
        avgPrice: 0,
        change: 0,
        basedOn: 0,
      };
    }

    const current = priceOverview.current;
    const avgPricePSF = dataView === "sold" 
      ? Math.round(current.avgPrice / 1000) 
      : Math.round(current.avgPrice / 100);
    
    const change = dataView === "sold" 
      ? current.yearlyChange 
      : 0; // Rented data not available in priceOverview

    return {
      avgPrice: avgPricePSF,
      change: change,
      basedOn: current.salesCount,
    };
  };

  const cityStats = getCityStats();

  // Format data for display
  const citySoldData = {
    avgPrice: cityStats.avgPrice,
    change: cityStats.change,
    trend: cityStats.change >= 0 ? "up" as const : "down" as const,
    basedOn: `${cityStats.basedOn.toLocaleString()} recent sales`,
  };

  // Note: Rented data is not available in the current API response
  // If needed, we would need to add a separate endpoint for rental data
  const cityRentedData = {
    avgPrice: 0,
    change: 0,
    trend: "up" as const,
    basedOn: `0 recent rentals`,
  };

  // Transform monthly data to quarterly format
  const transformMonthlyToQuarterly = (
    months: string[],
    detached: number[],
    townhouse: number[],
    condo: number[]
  ) => {
    const quarterlyData: {
      quarters: string[];
      detached: number[];
      townhouse: number[];
      condo: number[];
    } = {
      quarters: [],
      detached: [],
      townhouse: [],
      condo: [],
    };

    // Group months by quarter
    const quarterMap = new Map<string, { detached: number[]; townhouse: number[]; condo: number[] }>();

    months.forEach((month, index) => {
      // Parse month string (e.g., "Jan 2024")
      const [monthName, yearStr] = month.split(' ');
      const year = parseInt(yearStr, 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(monthName);
      
      if (monthIndex === -1) return;
      
      // Determine quarter (0-indexed: 0=Q1, 1=Q2, 2=Q3, 3=Q4)
      const quarter = Math.floor(monthIndex / 3);
      const quarterKey = `${year} Q${quarter + 1}`;
      
      if (!quarterMap.has(quarterKey)) {
        quarterMap.set(quarterKey, { detached: [], townhouse: [], condo: [] });
      }
      
      const quarterData = quarterMap.get(quarterKey)!;
      if (detached[index] > 0) quarterData.detached.push(detached[index]);
      if (townhouse[index] > 0) quarterData.townhouse.push(townhouse[index]);
      if (condo[index] > 0) quarterData.condo.push(condo[index]);
    });

    // Calculate averages for each quarter and sort by date
    const sortedQuarters = Array.from(quarterMap.entries()).sort((a, b) => {
      const [yearA, qA] = a[0].split(' Q').map(Number);
      const [yearB, qB] = b[0].split(' Q').map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return qA - qB;
    });

    sortedQuarters.forEach(([quarter, data]) => {
      quarterlyData.quarters.push(quarter);
      quarterlyData.detached.push(
        data.detached.length > 0
          ? Math.round(data.detached.reduce((sum, val) => sum + val, 0) / data.detached.length)
          : 0
      );
      quarterlyData.townhouse.push(
        data.townhouse.length > 0
          ? Math.round(data.townhouse.reduce((sum, val) => sum + val, 0) / data.townhouse.length)
          : 0
      );
      quarterlyData.condo.push(
        data.condo.length > 0
          ? Math.round(data.condo.reduce((sum, val) => sum + val, 0) / data.condo.length)
          : 0
      );
    });

    return quarterlyData;
  };

  // Generate historical data - use API data only
  const getHistoricalData = (area: "city" | "downtown") => {
    // Only use API data for city
    if (area === "city" && averageSoldPriceByType) {
      const quarterly = transformMonthlyToQuarterly(
        averageSoldPriceByType.months,
        averageSoldPriceByType.detached,
        averageSoldPriceByType.townhouse,
        averageSoldPriceByType.condo
      );
      return {
        detachedData: quarterly.detached,
        condoData: quarterly.condo,
        townhouseData: quarterly.townhouse,
        quarters: quarterly.quarters,
      };
    }

    // Return empty data if no API data available
    return {
      detachedData: [],
      condoData: [],
      townhouseData: [],
      quarters: [],
    };
  };

  const handleToggleCityView = () => {
    setCityViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${cityViewMode === "chart" ? "table" : "chart"} view`);
  };


  const handleDownload = () => {
    toast.success("Market data downloaded!");
  };

  const getChartOption = (area: "city" | "downtown") => {
    const isSold = dataView === "sold";
    const { detachedData, condoData, townhouseData, quarters } = getHistoricalData(area);
    
    // If no data, return empty chart option
    if (quarters.length === 0) {
      return {
        backgroundColor: "transparent",
        xAxis: { type: "category", data: [] },
        yAxis: { type: "value" },
        series: [],
      };
    }

    // Define colors for each property type
    const colors = {
      detached: "#ef4444", // Red
      condo: "#0d9488", // Teal
      townhouse: "#3b82f6", // Blue
    };

    const gradientColors = {
      detached: ["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0.05)"],
      condo: ["rgba(13, 148, 136, 0.3)", "rgba(13, 148, 136, 0.05)"],
      townhouse: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.05)"],
    };

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 1000,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "#64748b",
        borderWidth: 1,
        textStyle: {
          color: "#fff",
          fontSize: 12,
        },
        padding: [8, 12],
        axisPointer: {
          type: "line",
          lineStyle: {
            color: "#64748b",
            width: 2,
            type: "dashed",
          },
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
          const paramsArray = Array.isArray(params) ? params : [params];
          if (paramsArray.length === 0) return '';
          const firstParam = paramsArray[0] as { axisValue?: string };
          const period = firstParam.axisValue || '';
          let tooltipContent = `<div style="font-weight: 600; margin-bottom: 8px;">${period}</div>`;
          
          paramsArray.forEach((param) => {
            const p = param as { value?: number; seriesName?: string; color?: string };
            const value = p.value || 0;
            const seriesName = p.seriesName || '';
            const color = p.color || '#000';
            tooltipContent += `
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
                <span style="color: ${color}; font-weight: 600;">${seriesName}:</span>
                <span style="color: #fff; margin-left: 6px; font-weight: 700;">$${value}${isSold ? "K" : ""}</span>
              </div>
            `;
          });
          
          return tooltipContent;
        },
      },
      xAxis: {
        type: "category",
        data: getHistoricalData(area).quarters,
        axisLabel: {
          interval: 1,
          rotate: 45,
          color: "#64748b",
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: {
          lineStyle: {
            color: "#e2e8f0",
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: isSold ? "${value}K" : "${value}",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#f1f5f9",
            width: 1,
            type: "dashed",
          },
        },
      },
      legend: {
        data: ['Detached', 'Condos', 'Townhouse'],
        top: 10,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        itemGap: 20,
      },
      series: [
        {
          name: "Detached",
          data: detachedData,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: colors.detached,
            width: 2,
          },
          itemStyle: {
            color: colors.detached,
            borderColor: "#fff",
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: gradientColors.detached[0] },
                { offset: 1, color: gradientColors.detached[1] },
              ],
            },
          },
        },
        {
          name: "Condos",
          data: condoData,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: colors.condo,
            width: 2,
          },
          itemStyle: {
            color: colors.condo,
            borderColor: "#fff",
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: gradientColors.condo[0] },
                { offset: 1, color: gradientColors.condo[1] },
              ],
            },
          },
        },
        {
          name: "Townhouse",
          data: townhouseData,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: colors.townhouse,
            width: 2,
          },
          itemStyle: {
            color: colors.townhouse,
            borderColor: "#fff",
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: gradientColors.townhouse[0] },
                { offset: 1, color: gradientColors.townhouse[1] },
              ],
            },
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "18%",
        containLabel: true,
      },
    };
  };

  return (
    <div className="space-y-4">
      <Button
        variant="link"
        className="text-primary font-medium flex items-center gap-2 p-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TrendingUp className="h-4 w-4" />
        Discover {cityName} Housing Market Stats
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-6 animate-in slide-in-from-top-4">
          {/* Note: Rented data not available from current API - only showing Sold data */}
          <Tabs value="sold" onValueChange={(v) => setDataView(v as "sold" | "rented")}>
            <TabsList>
              <TabsTrigger value="sold">Sold</TabsTrigger>
              <TabsTrigger value="rented" disabled>Rented (Coming Soon)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid md:grid-cols-1 gap-6">
            {/* City Stats Card */}
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{cityName}</h3>
                <p className="text-sm text-muted-foreground">
                  Year over year change in values
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-primary">
                      {dataView === "sold"
                        ? `$${citySoldData.avgPrice || 0}`
                        : `$${cityRentedData.avgPrice || 0}`}
                      <span className="text-lg text-muted-foreground ml-1">
                        {dataView === "sold" ? "PSF" : "/mo"}
                      </span>
                    </span>
                    {citySoldData.change !== 0 && (
                      <div className={`flex items-center gap-1 ${citySoldData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {citySoldData.change >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {citySoldData.change >= 0 ? '+' : ''}{citySoldData.change.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Based on{" "}
                    {dataView === "sold" ? citySoldData.basedOn : cityRentedData.basedOn}{" "}
                    in {cityName}
                  </p>

                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium">Historical Avg. Prices</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleToggleCityView}
                          className="h-8 w-8 rounded-lg transition-all duration-300"
                          title="Switch to table view"
                        >
                          <Table2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleDownload}
                          className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          title="Download data"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-200">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Detached
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-teal-50 text-teal-700 rounded border border-teal-200">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Condos
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Townhouse
                      </span>
                    </div>
                    {cityViewMode === "chart" ? (
                      <div className="mt-4">
                        <ReactECharts
                          option={getChartOption("city")}
                          style={{ height: "300px" }}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 overflow-auto max-h-[400px] rounded-lg border border-border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                            <TableRow>
                              <TableHead className="font-semibold">Period</TableHead>
                              <TableHead className="text-right font-semibold">Detached</TableHead>
                              <TableHead className="text-right font-semibold">Condos</TableHead>
                              <TableHead className="text-right font-semibold">Townhouse</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const { detachedData, condoData, townhouseData, quarters } = getHistoricalData("city");
                              if (quarters.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                      No data available
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                              return quarters.map((quarter, index) => (
                                <TableRow key={quarter} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">{quarter}</TableCell>
                                  <TableCell className="text-right">
                                    <span className="inline-flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      ${detachedData[index] || 0}K
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="inline-flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                      ${condoData[index] || 0}K
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="inline-flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      ${townhouseData[index] || 0}K
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

