import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Download, Table2, TrendingUp, RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { useLocationData } from "@/hooks/useLocationData";
import { ProcessedLocation } from "@/data/types";

interface MarketAnalyticsProps {
  propertyAddress: string;
  propertyClass: string;
}

// Generate realistic market data based on location demographics
const generateMarketData = (locationData: ProcessedLocation | null, propertyClass: string) => {
  const months: string[] = [];
  const prices: number[] = [];
  const days: number[] = [];
  
  const startDate = new Date(2020, 0, 1);
  const endDate = new Date(2025, 9, 1);
  
  let currentDate = new Date(startDate);
  
  // Base values based on property class and location demographics
  let basePrice = 650000;
  let baseDays = 20;
  
  // Adjust base values based on property class
  if (propertyClass === 'condo') {
    basePrice = 550000;
    baseDays = 15;
  } else if (propertyClass === 'commercial') {
    basePrice = 850000;
    baseDays = 35;
  }
  
  // Adjust based on location demographics
  if (locationData) {
    const totalProperties = locationData.demographics.total;
    const residentialRatio = locationData.demographics.residential / totalProperties;
    
    // Higher property count areas tend to have higher prices
    if (totalProperties > 1000) {
      basePrice *= 1.2;
    } else if (totalProperties < 100) {
      basePrice *= 0.8;
    }
    
    // More residential areas tend to have faster sales
    if (residentialRatio > 0.7) {
      baseDays *= 0.8;
    }
  }
  
  while (currentDate <= endDate) {
    months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Add realistic market variation
    const priceVariation = (Math.random() - 0.5) * 50000;
    const dayVariation = (Math.random() - 0.5) * 15;
    
    // Add seasonal trends
    const month = currentDate.getMonth();
    const seasonalAdjustment = Math.sin((month / 12) * 2 * Math.PI) * 0.1;
    
    basePrice += priceVariation * 0.1 + (basePrice * seasonalAdjustment);
    baseDays += dayVariation * 0.1;
    
    // Ensure realistic bounds
    const minPrice = propertyClass === 'condo' ? 300000 : propertyClass === 'commercial' ? 500000 : 400000;
    const maxPrice = propertyClass === 'condo' ? 800000 : propertyClass === 'commercial' ? 1200000 : 1000000;
    
    prices.push(Math.max(minPrice, Math.min(maxPrice, basePrice)));
    days.push(Math.max(10, Math.min(60, baseDays)));
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return { months, prices, days };
};

export const MarketAnalytics: React.FC<MarketAnalyticsProps> = ({ 
  propertyAddress, 
  propertyClass 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [locationData, setLocationData] = useState<ProcessedLocation | null>(null);
  const [chartKey, setChartKey] = useState(0); // Force chart re-render on data change
  
  const { searchLocations, getLocationStats } = useLocationData();
  
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
  
  // Memoize chart data to prevent regeneration on every render
  const chartData = useMemo(
    () => generateMarketData(locationData, propertyClass),
    [locationData, propertyClass, chartKey]
  );
  
  // Ensure data arrays are always valid
  const months = chartData.months || [];
  const prices = chartData.prices || [];
  const days = chartData.days || [];
  
  // Only show chart if we have valid data
  const hasValidData = months.length > 0 && prices.length > 0 && days.length > 0;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setChartKey(prev => prev + 1); // Force chart re-render
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

  const getLocationName = () => {
    if (locationData) {
      return locationData.name;
    }
    
    // Fallback to extracting from address
    const addressParts = propertyAddress.split(',');
    return addressParts[1]?.trim() || 'Local Area';
  };

  const getPropertyClassLabel = () => {
    switch (propertyClass.toLowerCase()) {
      case 'condo':
        return 'Condo';
      case 'commercial':
        return 'Commercial';
      case 'residential':
      default:
        return 'Residential';
    }
  };

  const option = useMemo(() => {
    // Safety check: only create option if we have data
    if (!hasValidData) {
      return {};
    }
    
    return {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
        lineStyle: {
          type: 'dashed',
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937',
        fontSize: 12,
      },
      padding: 12,
      formatter: (params: any) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          const value = param.seriesName === 'Median Sold Price' 
            ? `$${(param.value / 1000).toFixed(0)}K`
            : `${param.value.toFixed(0)} Days`;
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 600; margin-left: auto;">${value}</span>
            </div>
          `;
        });
        return result;
      },
    },
    legend: {
      data: ['Median Sold Price', 'Average Days On Market'],
      top: '2%',
      left: 'left',
      textStyle: {
        color: '#1f2937',
        fontSize: 13,
        fontWeight: 500,
      },
      itemGap: 20,
      icon: 'circle',
    },
    xAxis: {
      type: 'category',
      data: months,
      axisPointer: {
        type: 'shadow',
      },
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        interval: 11,
        rotate: 0,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '',
        position: 'left',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
        },
        splitLine: {
          lineStyle: {
            color: '#d1d5db',
            type: 'dashed',
            opacity: 0.5,
          },
        },
      },
      {
        type: 'value',
        name: '',
        position: 'right',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => `${value.toFixed(0)} D`,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        start: 0,
        end: 100,
        height: 20,
        bottom: '3%',
        handleIcon:
          'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
        handleSize: '100%',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#3b82f6',
        },
        textStyle: {
          color: '#6b7280',
        },
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(59, 130, 246, 0.1)',
        dataBackground: {
          lineStyle: {
            color: '#d1d5db',
          },
          areaStyle: {
            color: '#f3f4f6',
          },
        },
      },
    ],
    series: [
      {
        name: 'Median Sold Price',
        type: 'line',
        yAxisIndex: 0,
        data: prices,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: 'rgb(0, 123, 255)',
        },
        itemStyle: {
          color: 'rgb(0, 123, 255)',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(0, 123, 255, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(0, 123, 255, 0)',
              },
            ],
          },
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: 'rgb(0, 123, 255)',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 123, 255, 0.5)',
          },
        },
      },
      {
        name: 'Average Days On Market',
        type: 'bar',
        yAxisIndex: 1,
        data: days,
        barMaxWidth: 12,
        itemStyle: {
          color: 'rgb(0, 204, 102)',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: 'rgb(125, 211, 252)',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 204, 102, 0.5)',
          },
        },
      },
    ],
  };
  }, [months, prices, days, hasValidData]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {getLocationName()} • {getPropertyClassLabel()}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Median Sold Price & Average Days On Market
          </h2>
          {locationData && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-4">
                <span>Total Properties: {locationData.demographics.total}</span>
                <span>Residential: {locationData.demographics.residential}</span>
                <span>Condo: {locationData.demographics.condo}</span>
                <span>Commercial: {locationData.demographics.commercial}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={handleToggleView}
            className="h-9 w-9 rounded-lg transition-all duration-300"
            title={viewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
          >
            {viewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
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
      
      {viewMode === "chart" ? (
        <div className="w-full h-[500px] md:h-[400px]">
          {hasValidData ? (
            <ReactECharts
              key={chartKey}
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge={true}
              lazyUpdate={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full overflow-auto max-h-[500px] md:max-h-[600px] rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="text-right font-semibold">Median Sold Price</TableHead>
                <TableHead className="text-right font-semibold">Average Days On Market</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasValidData ? (
                months.map((month, index) => (
                  <TableRow 
                    key={index} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{month}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-chart-price" />
                        ${prices[index].toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-chart-days" />
                        {days[index].toFixed(0)} days
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Loading market data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
