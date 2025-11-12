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
import { formatPrice, getGreaterArea } from '../utils/helpers';
import { 
  generateRankingOverviewData,
  generateRankingTableData
} from '../utils/dataGenerators';

interface RankingSectionProps {
  cityName: string;
}

export const RankingSection: React.FC<RankingSectionProps> = ({ cityName }) => {
  const greaterArea = getGreaterArea(cityName);
  const rankingOverview = generateRankingOverviewData();
  const rankingTableData = generateRankingTableData(cityName);

  return (
    <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          {cityName}'s Ranking in {greaterArea}
        </h2>

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Ranking Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.mostExpensive}
                  <span className="text-lg font-normal text-muted-foreground">th</span>
                </p>
                <p className="text-sm text-muted-foreground">Most expensive</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.fastestGrowing}
                  <span className="text-lg font-normal text-muted-foreground">th</span>
                </p>
                <p className="text-sm text-muted-foreground">Fastest Growing</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.fastestSelling}
                  <span className="text-lg font-normal text-muted-foreground">th</span>
                </p>
                <p className="text-sm text-muted-foreground">Fastest Selling</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.highestTurnover}
                  <span className="text-lg font-normal text-muted-foreground">th</span>
                </p>
                <p className="text-sm text-muted-foreground">Highest Turnover</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Ranking Tables */}
        <div className="mb-8">
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="price" className="px-4">
                Price
              </TabsTrigger>
              <TabsTrigger value="growth" className="px-4">
                Growth
              </TabsTrigger>
              <TabsTrigger value="daysOnMarket" className="px-4">
                Days on Market
              </TabsTrigger>
              <TabsTrigger value="turnover" className="px-4">
                Turnover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="mt-0">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  If the average price is skewed, the median is a more accurate reflection of the market.
                </p>
              </div>
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold">Rank</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="text-right font-semibold">Average Price</TableHead>
                      <TableHead className="text-right font-semibold">Median Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {rankingTableData.price.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={`hover:bg-muted/50 transition-colors ${row.isCurrentCity ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <TableCell className="font-medium">{row.rank}</TableCell>
                        <TableCell className={`font-medium ${row.isCurrentCity ? 'text-primary' : ''}`}>
                          {row.city}
                          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(row.averagePrice)}</TableCell>
                        <TableCell className="text-right">{formatPrice(row.medianPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="growth" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold">Rank</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="text-right font-semibold">Price Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {rankingTableData.growth.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={`hover:bg-muted/50 transition-colors ${row.isCurrentCity ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <TableCell className="font-medium">{row.rank}</TableCell>
                        <TableCell className={`font-medium ${row.isCurrentCity ? 'text-primary' : ''}`}>
                          {row.city}
                          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={row.priceGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {row.priceGrowth >= 0 ? '+' : ''}{row.priceGrowth}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="daysOnMarket" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold">Rank</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="text-right font-semibold">Days on Market</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {rankingTableData.daysOnMarket.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={`hover:bg-muted/50 transition-colors ${row.isCurrentCity ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <TableCell className="font-medium">{row.rank}</TableCell>
                        <TableCell className={`font-medium ${row.isCurrentCity ? 'text-primary' : ''}`}>
                          {row.city}
                          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
                        </TableCell>
                        <TableCell className="text-right">{row.daysOnMarket}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="turnover" className="mt-0">
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold">Rank</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="text-right font-semibold">Turnover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {rankingTableData.turnover.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={`hover:bg-muted/50 transition-colors ${row.isCurrentCity ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <TableCell className="font-medium">{row.rank}</TableCell>
                        <TableCell className={`font-medium ${row.isCurrentCity ? 'text-primary' : ''}`}>
                          {row.city}
                          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
                        </TableCell>
                        <TableCell className="text-right">{row.turnover}%</TableCell>
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

