"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Table2, Download } from 'lucide-react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  getNewClosedAvailableChartOption,
  getDaysOnMarketChartOption
} from '../utils/chartOptions';
import { 
  generateInventoryOverviewData,
  generateInventoryTableData,
  generateDaysOnMarketData
} from '../utils/dataGenerators';
import { MarketTrendsData } from '@/hooks/useMarketTrends';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface HousingInventorySectionProps {
  locationType: LocationType;
  locationName: string;
  parentCity?: string;
  parentArea?: string;
  parentNeighbourhood?: string;
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

export const HousingInventorySection: React.FC<HousingInventorySectionProps> = ({ 
  locationType,
  locationName,
  parentCity,
  parentArea,
  parentNeighbourhood,
  dateRanges,
  propertyType,
  community,
  years = 2,
  marketTrendsData,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [newClosedViewMode, setNewClosedViewMode] = useState<"chart" | "table">("chart");
  const [daysOnMarketViewMode, setDaysOnMarketViewMode] = useState<"chart" | "table">("chart");
  const [inventoryOverview, setInventoryOverview] = useState({
    newListings: 0,
    homesSold: 0,
    avgDaysOnMarket: 0,
    saleToListRatio: 0,
  });
  const [inventoryTableData, setInventoryTableData] = useState(generateInventoryTableData());
  const [newClosedAvailableData, setNewClosedAvailableData] = useState({
    months: [] as string[],
    new: [] as number[],
    closed: [] as number[],
  });
  const [daysOnMarketData, setDaysOnMarketData] = useState({
    months: [] as string[],
    lastYear: [] as number[],
    currentYear: [] as number[],
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
    // Extract inventory data from marketTrendsData prop
    const overview = marketTrendsData.inventoryOverview;
    const newClosedAvailable = marketTrendsData.newClosedAvailable;
    const daysOnMarket = marketTrendsData.daysOnMarket;

    // Update state with fetched data or fallback to mock data
    if (overview) {
      setInventoryOverview(overview);
    } else {
      setInventoryOverview(generateInventoryOverviewData());
    }

    if (newClosedAvailable) {
      setNewClosedAvailableData(newClosedAvailable);
    } else {
      // Fallback: create empty data structure
      setNewClosedAvailableData({
        months: [],
        new: [],
        closed: [],
      });
    }

    if (daysOnMarket) {
      setDaysOnMarketData(daysOnMarket);
    } else {
      setDaysOnMarketData(generateDaysOnMarketData());
    }

    // Keep mock data for table (requires complex aggregation by property type and bedrooms)
    setInventoryTableData(generateInventoryTableData());
  }, [marketTrendsData]);

  const handleToggleNewClosedView = () => {
    setNewClosedViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${newClosedViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleToggleDaysOnMarketView = () => {
    setDaysOnMarketViewMode(prev => prev === "chart" ? "table" : "chart");
    toast.success(`Switched to ${daysOnMarketViewMode === "chart" ? "table" : "chart"} view`);
  };

  const handleDownload = (type: "newClosed" | "daysOnMarket") => {
    toast.success(`${type === "newClosed" ? "New and closed properties" : "Days on market"} data downloaded!`);
  };

  return (
      <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            {locationName}'s Housing Inventory
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
            {locationName}'s Stats Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.newListings.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">new listings</p>
                <p className="text-xs text-muted-foreground">({dateRanges.current})</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.homesSold.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">homes sold</p>
                <p className="text-xs text-muted-foreground">({dateRanges.current})</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.avgDaysOnMarket}</p>
                <p className="text-sm text-muted-foreground">average days on market</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.saleToListRatio}%</p>
                <p className="text-sm text-muted-foreground">selling to listing price ratio</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Graphs Section - Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New and Closed Properties Graph */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                New and Closed Properties in {locationName}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleNewClosedView}
                  className="h-8 w-8 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownload("newClosed")}
                  className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Card className="p-6" variant="white">
              {newClosedViewMode === "chart" ? (
                <ReactECharts
                  option={getNewClosedAvailableChartOption(newClosedAvailableData)}
                  style={{ height: '400px' }}
                />
              ) : (
                <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            New Listings
                          </span>
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Closed
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newClosedAvailableData.months.map((month, index) => (
                        <TableRow key={month} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {newClosedAvailableData.new[index] || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              {newClosedAvailableData.closed[index] || 0}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          {/* Average Days on Market Graph */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Average Days on Market in {locationName}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleDaysOnMarketView}
                  className="h-8 w-8 rounded-lg transition-all duration-300"
                  title="Switch to table view"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownload("daysOnMarket")}
                  className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Card className="p-6" variant="white">
              {daysOnMarketViewMode === "chart" ? (
                <ReactECharts
                  option={getDaysOnMarketChartOption(daysOnMarketData)}
                  style={{ height: '400px' }}
                />
              ) : (
                <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Last Year
                          </span>
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Current Year
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {daysOnMarketData.months.map((month, index) => (
                        <TableRow key={month} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              {daysOnMarketData.lastYear[index] || 0} days
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                              {daysOnMarketData.currentYear[index] || 0} days
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Inventory Breakdown Table */}
        {/* <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Inventory Breakdown by Property Type in {locationName}
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
                      <TableHead className="font-semibold"># of Beds</TableHead>
                      <TableHead className="text-right font-semibold">New Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Sold Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Active Listings</TableHead>
                      <TableHead className="text-right font-semibold">Days on Market</TableHead>
                      <TableHead className="text-right font-semibold">Sale to List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {inventoryTableData.detached.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">{row.newListings}</TableCell>
                        <TableCell className="text-right">{row.soldListings}</TableCell>
                        <TableCell className="text-right">{row.activeListings}</TableCell>
                        <TableCell className="text-right">{row.daysOnMarket}</TableCell>
                        <TableCell className="text-right">{row.saleToList}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="townhouse" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold"># of Beds</TableHead>
                      <TableHead className="text-right font-semibold">New Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Sold Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Active Listings</TableHead>
                      <TableHead className="text-right font-semibold">Days on Market</TableHead>
                      <TableHead className="text-right font-semibold">Sale to List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {inventoryTableData.townhouse.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">{row.newListings}</TableCell>
                        <TableCell className="text-right">{row.soldListings}</TableCell>
                        <TableCell className="text-right">{row.activeListings}</TableCell>
                        <TableCell className="text-right">{row.daysOnMarket}</TableCell>
                        <TableCell className="text-right">{row.saleToList}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="condo" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold"># of Beds</TableHead>
                      <TableHead className="text-right font-semibold">New Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Sold Listings {dateRanges.current}</TableHead>
                      <TableHead className="text-right font-semibold">Active Listings</TableHead>
                      <TableHead className="text-right font-semibold">Days on Market</TableHead>
                      <TableHead className="text-right font-semibold">Sale to List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {inventoryTableData.condo.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.bedroom}</TableCell>
                        <TableCell className="text-right">{row.newListings}</TableCell>
                        <TableCell className="text-right">{row.soldListings}</TableCell>
                        <TableCell className="text-right">{row.activeListings}</TableCell>
                        <TableCell className="text-right">{row.daysOnMarket}</TableCell>
                        <TableCell className="text-right">{row.saleToList}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div> */}
      </div>
    </section>
  );
};

