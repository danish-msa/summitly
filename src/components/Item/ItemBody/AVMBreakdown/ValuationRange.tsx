"use client";

import React, { useMemo } from 'react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import { ArrowDown, ArrowUp, CheckCircle } from 'lucide-react';

interface ValuationData {
  lowValue: number;
  estimatedValue: number;
  highValue: number;
  lowPricePerSqFt: number;
  estimatedPricePerSqFt: number;
  highPricePerSqFt: number;
  confidence: number;
  fsd: number;
}

interface ValuationRangeProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const ValuationRange: React.FC<ValuationRangeProps> = ({ property, rawProperty }) => {
  // Extract valuation data from rawProperty or calculate from property
  const data: ValuationData = useMemo(() => {
    const estimatedValue = rawProperty?.estimate?.value || property?.listPrice || 681465;
    const lowValue = rawProperty?.estimate?.low || Math.round(estimatedValue * 0.975);
    const highValue = rawProperty?.estimate?.high || Math.round(estimatedValue * 1.025);
    const confidence = rawProperty?.estimate?.confidence || 98;

    // Calculate price per square foot
    const sqftValue = property?.details?.sqft;
    const squareFeet = typeof sqftValue === 'number'
      ? sqftValue
      : typeof sqftValue === 'string'
        ? parseFloat(sqftValue.replace(/,/g, '')) || 2318
        : 2318;
    const lowPricePerSqFt = Math.round(lowValue / squareFeet);
    const estimatedPricePerSqFt = Math.round(estimatedValue / squareFeet);
    const highPricePerSqFt = Math.round(highValue / squareFeet);

    // Calculate FSD (Forecast Standard Deviation)
    const range = highValue - lowValue;
    const fsd = range / (2 * estimatedValue);

    return {
      lowValue,
      estimatedValue,
      highValue,
      lowPricePerSqFt,
      estimatedPricePerSqFt,
      highPricePerSqFt,
      confidence,
      fsd: Math.round(fsd * 100) / 100,
    };
  }, [property, rawProperty]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${Math.round(value / 1000)}K`;
  };

  // Generate bar chart data with actual values
  const chartData = useMemo(() => {
    const range = data.highValue - data.lowValue;
    const step = range / 10;

    // Heights creating a bell-curve distribution
    const heights = [50, 60, 72, 82, 90, 100, 92, 85, 75, 62, 52];

    return heights.map((height, index) => {
      const value = Math.round(data.lowValue + (step * index));
      return {
        height,
        value,
        isCenter: index === 5,
      };
    });
  }, [data]);

  return (
    <div className="w-full mx-auto bg-card rounded-xl sm:rounded-2xl overflow-hidden min-w-0">
      {/* Value Cards - responsive grid, Estimated first on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Low Value Card */}
        <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">Low</span>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(data.lowValue)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">${data.lowPricePerSqFt}/ft²</p>
          </div>
        </div>

        {/* Estimated Value Card - order-first on mobile so it appears first when stacked */}
        <div className="bg-secondary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-2 order-first sm:order-none">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-secondary fill-secondary/20 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-primary">Estimated Value</span>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(data.estimatedValue)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">${data.estimatedPricePerSqFt}/ft²</p>
          </div>
        </div>

        {/* High Value Card */}
        <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">High</span>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(data.highValue)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">${data.highPricePerSqFt}/ft²</p>
          </div>
        </div>
      </div>

      {/* Chart Section - CSS bars for responsiveness (no ECharts) */}
      <div className="space-y-3 sm:space-y-4 relative z-0 mt-4 sm:mt-6 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="h-40 sm:h-52 relative z-0 overflow-hidden flex items-end justify-center gap-1 sm:gap-2 min-w-0">
          {chartData.map((item, index) => (
            <div
              key={index}
              className={`flex-1 max-w-8 sm:max-w-12 rounded-t-md sm:rounded-t-lg transition-all duration-300 min-w-0 ${
                item.isCenter
                  ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                  : 'bg-gradient-to-t from-cyan-400 to-cyan-300'
              }`}
              style={{ height: `${item.height}%` }}
            >
              {item.isCenter && (
                <div className="text-center -mt-6 sm:-mt-8">
                  <span className="text-xs sm:text-sm font-bold text-cyan-600">
                    {formatShortCurrency(data.estimatedValue)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Estimated Value Label */}
        <div className="text-center space-y-1 sm:space-y-2">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Estimated Value</h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-medium text-primary">High Confidence</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{data.confidence}%</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">FSD: {data.fsd}</p>
        </div>

        {/* Description */}
        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
          The forecast standard deviation (FSD) is a statistical estimate of model uncertainty. It is a quantity used
          to create the upper and lower bounds on the value estimate. The value range represents the quantity such that the
          range will actually capture the subsequent arm&apos;s-length sale price approximately 68% of the time (one standard
          deviation).
        </p>
      </div>
    </div>
  );
};

export default ValuationRange;
