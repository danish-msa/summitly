"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AreaSelector } from "./AreaSelector";
import { PriceChart } from "./PriceChart";
import { CompletionsChart } from "./CompletionsChart";
import { TrendingDown } from "lucide-react";
import { areas, priceDataByArea, completionsDataByArea } from "./data/insightsData";
import SectionHeading from "@/components/Helper/SectionHeading";

export function InsightsSection() {
  const [selectedPriceArea, setSelectedPriceArea] = useState("gta");
  const [selectedCompletionsArea, setSelectedCompletionsArea] = useState("gta");

  // Get area-specific data
  const priceData = priceDataByArea[selectedPriceArea] || priceDataByArea.gta;
  const completionsData = completionsDataByArea[selectedCompletionsArea] || completionsDataByArea.gta;

  const currentPrice = priceData[priceData.length - 1].price;
  const previousPrice = priceData[priceData.length - 2].price;
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

  const totalCompletions = areas.find((a) => a.id === selectedCompletionsArea)?.value || 0;

  return (
    <section className="w-full py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SectionHeading
          heading="Market Insights"
          subheading="Market Analytics"
          position="center"
          description="Real-time market analytics for pre-construction properties"
        />


        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          {/* Average Price Chart */}
          <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground/80 mb-2">
                  Average Price/sq.ft. (High Rise)
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-foreground">
                    ${currentPrice.toLocaleString()}/ft
                  </span>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">
                      {priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">from last year</p>
              </div>
              <div className="w-48">
                <AreaSelector
                  areas={areas}
                  selectedArea={selectedPriceArea}
                  onAreaChange={setSelectedPriceArea}
                />
              </div>
            </div>
            <PriceChart data={priceData} />
          </Card>

          {/* Completions Chart */}
          <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground/80 mb-2">
                  Completions (High Rise)
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-foreground">
                    {totalCompletions.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">total units</p>
              </div>
              <div className="w-48">
                <AreaSelector
                  areas={areas}
                  selectedArea={selectedCompletionsArea}
                  onAreaChange={setSelectedCompletionsArea}
                />
              </div>
            </div>
            <CompletionsChart data={completionsData} />
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="p-6 border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Peak Year
            </h4>
            <p className="text-3xl font-bold text-foreground">2025</p>
            <p className="text-sm text-muted-foreground mt-1">
              43,000 units expected
            </p>
          </Card>

          <Card className="p-6 border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Average Growth
            </h4>
            <p className="text-3xl font-bold text-foreground">8.2%</p>
            <p className="text-sm text-muted-foreground mt-1">
              Year-over-year (2016-2022)
            </p>
          </Card>

          <Card className="p-6 border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Market Outlook
            </h4>
            <p className="text-3xl font-bold text-foreground">Stable</p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on 10-year trends
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

