"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { getListings } from "@/lib/api/properties";
import { PropertyListing } from "@/lib/types";

interface MarketStatsProps {
  cityName: string;
  properties?: PropertyListing[];
}

export const MarketStats: React.FC<MarketStatsProps> = ({ cityName, properties = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dataView, setDataView] = useState<"sold" | "rented">("sold");
  const [downtownProperties, setDowntownProperties] = useState<PropertyListing[]>([]);
  const [loadingDowntown, setLoadingDowntown] = useState(false);

  // Fetch Downtown properties
  useEffect(() => {
    const fetchDowntownProperties = async () => {
      if (cityName.toLowerCase() !== "downtown") {
        setLoadingDowntown(true);
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
        } finally {
          setLoadingDowntown(false);
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

  const getChartOption = (area: "city" | "downtown") => {
    const isSold = dataView === "sold";
    const data =
      isSold
        ? area === "city"
          ? [650, 720, 780, 850, 920, 980, 1020, 1050, 1060, cityStats.avgPrice]
          : [580, 640, 690, 750, 820, 880, 940, 970, 990, downtownStats.avgPrice || 978]
        : area === "city"
        ? [1800, 1900, 2050, 2150, 2200, 2280, 2350, 2400, 2430, 2450]
        : [1650, 1750, 1850, 1950, 2050, 2120, 2180, 2250, 2290, 2280];

    // Define colors based on area
    const primaryColor = area === "city" ? "#0d9488" : "#3b82f6"; // Teal for city, Blue for downtown
    const gradientColors = area === "city" 
      ? ["rgba(13, 148, 136, 0.8)", "rgba(13, 148, 136, 0.1)"]
      : ["rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.1)"];

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 1000,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: primaryColor,
        borderWidth: 1,
        textStyle: {
          color: "#fff",
          fontSize: 12,
        },
        padding: [8, 12],
        axisPointer: {
          type: "line",
          lineStyle: {
            color: primaryColor,
            width: 2,
            type: "dashed",
          },
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        formatter: (params: any) => {
          const value = params[0].value;
          const period = params[0].name;
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${period}</div>
            <div style="color: ${primaryColor}; font-size: 14px; font-weight: 700;">
              ${isSold ? "Avg. Sale Price" : "Avg. Rent"}: $${value}${isSold ? "K" : ""}
            </div>
          `;
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
      series: [
        {
          name: isSold ? "Sale Price" : "Rent",
          data: data,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          showSymbol: true,
          emphasis: {
            focus: "series",
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: primaryColor,
            },
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: gradientColors[0],
                },
                {
                  offset: 1,
                  color: gradientColors[1],
                },
              ],
            },
          },
          lineStyle: {
            color: primaryColor,
            width: 3,
            shadowBlur: 4,
            shadowColor: primaryColor,
            shadowOffsetY: 2,
          },
          itemStyle: {
            color: primaryColor,
            borderColor: "#fff",
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: primaryColor,
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "12%",
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
                <h4 className="text-sm font-medium mb-4">Historical Avg. Prices</h4>
                <div className="space-y-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    All Condos
                  </span>
                </div>
                <div className="mt-4">
                  <ReactECharts
                    option={getChartOption("city")}
                    style={{ height: "300px" }}
                  />
                </div>
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
                <h4 className="text-sm font-medium mb-4">Historical Avg. Prices</h4>
                <div className="space-y-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    All Condos
                  </span>
                </div>
                <div className="mt-4">
                  <ReactECharts
                    option={getChartOption("downtown")}
                    style={{ height: "300px" }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

