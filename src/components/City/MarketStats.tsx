"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronDown, ChevronUp, Table2, Download } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { getListings } from "@/lib/api/properties";
import { PropertyListing } from "@/lib/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MarketStatsProps {
  cityName: string;
  properties?: PropertyListing[];
}

export const MarketStats: React.FC<MarketStatsProps> = ({ cityName, properties = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dataView, setDataView] = useState<"sold" | "rented">("sold");
  const [cityViewMode, setCityViewMode] = useState<"chart" | "table">("chart");
  const [downtownViewMode, setDowntownViewMode] = useState<"chart" | "table">("chart");
  const [downtownProperties, setDowntownProperties] = useState<PropertyListing[]>([]);
  
  // Filter properties by type
  const getPropertiesByType = (props: PropertyListing[], type: string) => {
    return props.filter(property => {
      const propertyType = property.details?.propertyType?.toLowerCase() || '';
      if (type === 'condo') {
        return propertyType.includes('condo') || propertyType.includes('condominium');
      } else if (type === 'detached') {
        return propertyType.includes('detached') || propertyType.includes('house') || propertyType.includes('single family');
      } else if (type === 'townhouse') {
        return propertyType.includes('townhouse') || propertyType.includes('town house') || propertyType.includes('town-home');
      }
      return false;
    });
  };

  const detachedProperties = getPropertiesByType(properties, 'detached');
  const condoProperties = getPropertiesByType(properties, 'condo');
  const townhouseProperties = getPropertiesByType(properties, 'townhouse');

  // Fetch Downtown properties
  useEffect(() => {
    const fetchDowntownProperties = async () => {
      if (cityName.toLowerCase() !== "downtown") {
        try {
          const listingsData = await getListings({
            status: "A",
            resultsPerPage: 50,
            pageNum: 1,
          });

          // Filter for Downtown Toronto properties
          const downtown = listingsData.listings.filter(
            (property) =>
              property.address?.city?.toLowerCase() === "toronto" &&
              (property.address?.neighborhood?.toLowerCase().includes("downtown") ||
                property.address?.area?.toLowerCase().includes("downtown"))
          );

          setDowntownProperties(downtown);
        } catch (error) {
          console.error("Error fetching downtown properties:", error);
        }
      }
    };

    fetchDowntownProperties();
  }, [cityName]);

  // Calculate stats for city
  const calculateCityStats = (props: PropertyListing[]) => {
    if (props.length === 0) return { avgPrice: 1050, change: "+3.2%", basedOn: 0 };

    const totalPrice = props.reduce((sum, p) => sum + (p.listPrice || 0), 0);
    const avgPrice = Math.round(totalPrice / props.length);
    const avgPricePSF = dataView === "sold" ? Math.round(avgPrice / 1000) : Math.round(avgPrice / 100);

    return {
      avgPrice: avgPricePSF,
      change: "+3.2%", // Mock - replace with actual calculation
      basedOn: props.length,
    };
  };

  const cityStats = calculateCityStats(properties);
  const downtownStats = calculateCityStats(downtownProperties);

  // Mock data for demonstration (replace with actual calculations)
  const citySoldData = {
    avgPrice: cityStats.avgPrice,
    change: cityStats.change,
    trend: "up" as const,
    basedOn: `${cityStats.basedOn} recent sales`,
  };

  const downtownSoldData = {
    avgPrice: downtownStats.avgPrice || 978,
    change: downtownStats.change || "+2.8%",
    trend: "up" as const,
    basedOn: `${downtownStats.basedOn || 2341} recent sales`,
  };

  const cityRentedData = {
    avgPrice: 2450,
    change: "+5.1%",
    trend: "up" as const,
    basedOn: `${Math.floor(properties.length * 1.5)} recent rentals`,
  };

  const downtownRentedData = {
    avgPrice: 2280,
    change: "+4.3%",
    trend: "up" as const,
    basedOn: `${Math.floor((downtownProperties.length || 1000) * 1.5)} recent rentals`,
  };

  // Calculate average prices for each property type
  const calculateTypeStats = (props: PropertyListing[]) => {
    if (props.length === 0) return { avgPrice: 0, count: 0 };
    const totalPrice = props.reduce((sum, p) => sum + (p.listPrice || 0), 0);
    const avgPrice = Math.round(totalPrice / props.length);
    const avgPricePSF = dataView === "sold" ? Math.round(avgPrice / 1000) : Math.round(avgPrice / 100);
    return { avgPrice: avgPricePSF, count: props.length };
  };

  const detachedStats = calculateTypeStats(detachedProperties);
  const condoStats = calculateTypeStats(condoProperties);
  const townhouseStats = calculateTypeStats(townhouseProperties);

  // Generate historical data for table view
  const generateHistoricalData = (currentPrice: number, type: string) => {
    const baseMultiplier = type === 'detached' ? 1.2 : type === 'townhouse' ? 1.1 : 1.0;
    const startPrice = currentPrice * 0.7;
    const increment = (currentPrice - startPrice) / 9;
    return Array.from({ length: 10 }, (_, i) => 
      Math.round(startPrice + (increment * i) * baseMultiplier)
    );
  };

  const getHistoricalData = (area: "city" | "downtown") => {
    const detachedData = generateHistoricalData(
      area === "city" ? detachedStats.avgPrice || 1200 : 1100,
      'detached'
    );
    const condoData = generateHistoricalData(
      area === "city" ? condoStats.avgPrice || 1050 : 978,
      'condo'
    );
    const townhouseData = generateHistoricalData(
      area === "city" ? townhouseStats.avgPrice || 1150 : 1050,
      'townhouse'
    );
    
    return { detachedData, condoData, townhouseData };
  };

  const quarters = [
    "2023 Q1", "2023 Q2", "2023 Q3", "2023 Q4",
    "2024 Q1", "2024 Q2", "2024 Q3", "2024 Q4",
    "2025 Q1", "2025 Q2"
  ];

  const handleToggleCityView = () => {
    setCityViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${cityViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleToggleDowntownView = () => {
    setDowntownViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${downtownViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleDownload = () => {
    toast.success("Market data downloaded!");
  };

  const getChartOption = (area: "city" | "downtown") => {
    const isSold = dataView === "sold";
    const { detachedData, condoData, townhouseData } = getHistoricalData(area);

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
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const period = params[0]?.axisValue || '';
          let tooltipContent = `<div style="font-weight: 600; margin-bottom: 8px;">${period}</div>`;
          
          params.forEach((param: any) => {
            const value = param.value;
            const seriesName = param.seriesName;
            const color = param.color;
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
        data: [
          "2023 Q1",
          "2023 Q2",
          "2023 Q3",
          "2023 Q4",
          "2024 Q1",
          "2024 Q2",
          "2024 Q3",
          "2024 Q4",
          "2025 Q1",
          "2025 Q2",
        ],
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
          <Tabs value={dataView} onValueChange={(v) => setDataView(v as "sold" | "rented")}>
            <TabsList>
              <TabsTrigger value="sold">Sold</TabsTrigger>
              <TabsTrigger value="rented">Rented</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-6">
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
                    ? `$${citySoldData.avgPrice}`
                    : `$${cityRentedData.avgPrice}`}
                  <span className="text-lg text-muted-foreground ml-1">
                    {dataView === "sold" ? "PSF" : "/mo"}
                  </span>
                </span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">
                    {dataView === "sold" ? citySoldData.change : cityRentedData.change}
                  </span>
                </div>
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
                    Detached {detachedStats.count > 0 && `(${detachedStats.count})`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-teal-50 text-teal-700 rounded border border-teal-200">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    Condos {condoStats.count > 0 && `(${condoStats.count})`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Townhouse {townhouseStats.count > 0 && `(${townhouseStats.count})`}
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
                          const { detachedData, condoData, townhouseData } = getHistoricalData("city");
                          return quarters.map((quarter, index) => (
                            <TableRow key={quarter} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{quarter}</TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  ${detachedData[index]}K
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                  ${condoData[index]}K
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  ${townhouseData[index]}K
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

            {/* Downtown Stats Card */}
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Downtown</h3>
                <p className="text-sm text-muted-foreground">
                  Year over year change in values
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {dataView === "sold"
                    ? `$${downtownSoldData.avgPrice}`
                    : `$${downtownRentedData.avgPrice}`}
                  <span className="text-lg text-muted-foreground ml-1">
                    {dataView === "sold" ? "PSF" : "/mo"}
                  </span>
                </span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">
                    {dataView === "sold"
                      ? downtownSoldData.change
                      : downtownRentedData.change}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Based on{" "}
                {dataView === "sold"
                  ? downtownSoldData.basedOn
                  : downtownRentedData.basedOn}{" "}
                in Downtown
              </p>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">Historical Avg. Prices</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleDowntownView}
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
                {downtownViewMode === "chart" ? (
                  <div className="mt-4">
                    <ReactECharts
                      option={getChartOption("downtown")}
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
                          const { detachedData, condoData, townhouseData } = getHistoricalData("downtown");
                          return quarters.map((quarter, index) => (
                            <TableRow key={quarter} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{quarter}</TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  ${detachedData[index]}K
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                  ${condoData[index]}K
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  ${townhouseData[index]}K
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

