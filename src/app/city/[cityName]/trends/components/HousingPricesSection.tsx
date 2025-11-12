"use client";

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
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
import { formatPrice } from '../utils/helpers';
import { 
  getAverageSoldPriceChartOption, 
  getSalesVolumeChartOption,
  getProRatedMonthIndex,
  type AverageSoldPriceData,
  type SalesVolumeGraphData
} from '../utils/chartOptions';
import { 
  generateSalesVolumeMockData,
  generateAverageSoldPriceData,
  generateSalesVolumeData,
  generatePriceOverviewData,
  type SalesVolumeData
} from '../utils/dataGenerators';
import { PropertyListing } from '@/lib/types';

interface HousingPricesSectionProps {
  cityName: string;
  properties: PropertyListing[];
  dateRanges: {
    current: string;
    past: string;
  };
}

const PriceCard = ({ label, value, change, showChange = false }: { 
  label: string; 
  value: string | number; 
  change?: number; 
  showChange?: boolean;
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  
  return (
    <Card className="p-6 flex flex-col">
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
      </div>
      <div className="text-sm text-muted-foreground mt-auto pt-2">
        {label}
      </div>
    </Card>
  );
};

export const HousingPricesSection: React.FC<HousingPricesSectionProps> = ({ 
  cityName, 
  properties,
  dateRanges 
}) => {
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

  // Generate data
  const salesVolumeTableData = generateSalesVolumeMockData();
  const averageSoldPriceData = generateAverageSoldPriceData(properties);
  const salesVolumeGraphData = generateSalesVolumeData(salesVolumeTableData);
  const priceOverviewData = generatePriceOverviewData(properties);
  const proRatedIndex = getProRatedMonthIndex(salesVolumeGraphData.months);

  return (
    <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          {cityName}'s Housing Prices
        </h2>

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
                />
                <PriceCard 
                  label="Monthly change" 
                  value={`${priceOverviewData.current.monthlyChange > 0 ? '+' : ''}${priceOverviewData.current.monthlyChange}%`}
                  change={priceOverviewData.current.monthlyChange}
                  showChange={true}
                />
                <PriceCard 
                  label="Quarterly change" 
                  value={`${priceOverviewData.current.quarterlyChange > 0 ? '+' : ''}${priceOverviewData.current.quarterlyChange}%`}
                  change={priceOverviewData.current.quarterlyChange}
                  showChange={true}
                />
                <PriceCard 
                  label="Yearly change" 
                  value={`${priceOverviewData.current.yearlyChange > 0 ? '+' : ''}${priceOverviewData.current.yearlyChange}%`}
                  change={priceOverviewData.current.yearlyChange}
                  showChange={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PriceCard 
                  label="Avg sold price" 
                  value={priceOverviewData.past.avgPrice}
                />
                <PriceCard 
                  label="Monthly change" 
                  value={`${priceOverviewData.past.monthlyChange > 0 ? '+' : ''}${priceOverviewData.past.monthlyChange}%`}
                  change={priceOverviewData.past.monthlyChange}
                  showChange={true}
                />
                <PriceCard 
                  label="Quarterly change" 
                  value={`${priceOverviewData.past.quarterlyChange > 0 ? '+' : ''}${priceOverviewData.past.quarterlyChange}%`}
                  change={priceOverviewData.past.quarterlyChange}
                  showChange={true}
                />
                <PriceCard 
                  label="Yearly change" 
                  value={`${priceOverviewData.past.yearlyChange > 0 ? '+' : ''}${priceOverviewData.past.yearlyChange}%`}
                  change={priceOverviewData.past.yearlyChange}
                  showChange={true}
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
          {/* Average Sold Price Graph */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Average Sold Price in {cityName}
            </h3>
            <Card className="p-6">
              <ReactECharts
                option={getAverageSoldPriceChartOption(averageSoldPriceData)}
                style={{ height: '400px' }}
              />
            </Card>
          </div>

          {/* Sales Volume by Property Type Graph */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Sales Volume by Property Type in {cityName}
            </h3>
            <Card className="p-6">
              <ReactECharts
                option={getSalesVolumeChartOption(salesVolumeGraphData, proRatedIndex)}
                style={{ height: '400px' }}
              />
            </Card>
          </div>
        </div>

        {/* Average Sold Price Breakdown Table */}
        <div className="mb-8">
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
        </div>
      </div>
    </section>
  );
};

