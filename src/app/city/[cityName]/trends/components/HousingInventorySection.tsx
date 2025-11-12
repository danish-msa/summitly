"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReactECharts from "echarts-for-react";
import { 
  getSalesAndInventoryChartOption,
  getDaysOnMarketChartOption,
  type SalesAndInventoryData,
  type DaysOnMarketData
} from '../utils/chartOptions';
import { 
  generateInventoryOverviewData,
  generateInventoryTableData,
  generateSalesAndInventoryData,
  generateDaysOnMarketData,
  type InventoryData
} from '../utils/dataGenerators';

interface HousingInventorySectionProps {
  cityName: string;
  dateRanges: {
    current: string;
    past: string;
  };
}

export const HousingInventorySection: React.FC<HousingInventorySectionProps> = ({ 
  cityName,
  dateRanges 
}) => {
  const inventoryOverview = generateInventoryOverviewData();
  const inventoryTableData = generateInventoryTableData();
  const salesAndInventoryData = generateSalesAndInventoryData();
  const daysOnMarketData = generateDaysOnMarketData();

  return (
    <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          {cityName}'s Housing Inventory
        </h2>

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {cityName}'s Stats Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.newListings.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">new listings</p>
                <p className="text-xs text-muted-foreground">(last 28 days)</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.homesSold.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">homes sold</p>
                <p className="text-xs text-muted-foreground">(last 28 days)</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.avgDaysOnMarket}</p>
                <p className="text-sm text-muted-foreground">average days on market</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{inventoryOverview.saleToListRatio}%</p>
                <p className="text-sm text-muted-foreground">selling to listing price ratio</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Graphs Section - Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Number of Sales and Inventory Graph */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Number of Sales and Inventory in {cityName}
            </h3>
            <Card className="p-6">
              <ReactECharts
                option={getSalesAndInventoryChartOption(salesAndInventoryData)}
                style={{ height: '400px' }}
              />
            </Card>
          </div>

          {/* Average Days on Market Graph */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Average Days on Market in {cityName}
            </h3>
            <Card className="p-6">
              <ReactECharts
                option={getDaysOnMarketChartOption(daysOnMarketData)}
                style={{ height: '400px' }}
              />
            </Card>
          </div>
        </div>

        {/* Inventory Breakdown Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Inventory Breakdown by Property Type in {cityName}
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
        </div>
      </div>
    </section>
  );
};

