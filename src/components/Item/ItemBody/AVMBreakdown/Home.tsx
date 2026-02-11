"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';

interface HomeProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const Home: React.FC<HomeProps> = ({ property, rawProperty }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract square footage data
  const sqftValue = property?.details?.sqft;
  const homeSqFt = typeof sqftValue === 'number'
    ? sqftValue
    : typeof sqftValue === 'string'
      ? parseFloat(sqftValue.replace(/,/g, '')) || 2315
      : 2315;

  // Calculate typical square footage from comparables or use default
  const typicalSqFt = useMemo(() => {
    if (rawProperty?.comparables && rawProperty.comparables.length > 0) {
      const totalSqft = rawProperty.comparables.reduce<number>((sum, comp) => {
        const compSqft = comp.details?.sqft;
        const sqft = typeof compSqft === 'number'
          ? compSqft
          : typeof compSqft === 'string'
            ? parseFloat(String(compSqft).replace(/,/g, '')) || 0
            : 0;
        return sum + sqft;
      }, 0);
      const avgSqft = totalSqft / rawProperty.comparables.length;
      return avgSqft > 0 ? Math.round(avgSqft) : 1410;
    }
    return 1410;
  }, [rawProperty]);

  // Calculate value added (approximately $78 per square foot difference)
  const sqFtDifference = homeSqFt - typicalSqFt;
  const valuePerSqft = 78;
  const valueAdded = Math.round(sqFtDifference * valuePerSqft);

  // Calculate bar heights proportionally (both scale to same max for comparison)
  const maxHeight = 90;
  const typicalHeight = Math.max(
    maxHeight * (typicalSqFt / Math.max(homeSqFt, typicalSqFt)),
    maxHeight * 0.6
  );
  const homeHeight = Math.max(
    maxHeight * (homeSqFt / Math.max(homeSqFt, typicalSqFt)),
    maxHeight * 0.6
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-10 min-w-0">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-foreground">Home</h3>
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className={`text-2xl sm:text-4xl font-semibold ${valueAdded >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {valueAdded >= 0 ? '+' : ''} {formatCurrency(valueAdded)}
          </span>
          <span className="text-base sm:text-lg text-muted-foreground">to value</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {formatNumber(Math.abs(sqFtDifference))} square feet {sqFtDifference >= 0 ? 'larger' : 'smaller'} than the typical square footage
        </p>
      </div>

      {/* Comparison Bars - responsive layout */}
      <div className="flex gap-4 sm:gap-8 items-end relative px-4 sm:px-0 min-w-0">
        {/* Typical homes bar */}
        <div className="flex-1 relative min-w-0">
          <div className="relative flex flex-col justify-end">
            {/* Text labels - positioned above bars */}
            <div
              className="space-y-0.5 mb-2 sm:mb-4 transition-opacity duration-1000 ease-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transitionDelay: '0.1s',
              }}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground">Typical homes in the area</p>
              <p className="text-base sm:text-xl font-semibold text-foreground">
                {formatNumber(typicalSqFt)} <span className="text-sm sm:text-base">Sq.Ft</span>
              </p>
            </div>
            {/* Bar container - aligned to bottom */}
            <div className="flex items-end">
              <div
                className="w-full rounded-t-xl sm:rounded-t-[2rem] rounded-b-md bg-[#E8E8E8] transition-all duration-1000 ease-out"
                style={{
                  height: `${typicalHeight}px`,
                  transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'bottom',
                  transitionDelay: '0.1s',
                }}
              />
            </div>
          </div>
        </div>

        {/* This home bar */}
        <div className="flex-1 relative min-w-0">
          <div className="relative flex flex-col justify-end">
            {/* Text labels - positioned above bars */}
            <div
              className="space-y-0.5 mb-2 sm:mb-4 text-right transition-opacity duration-1000 ease-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transitionDelay: '0.2s',
              }}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground">This Home</p>
              <p className="text-base sm:text-xl font-semibold text-foreground">
                {formatNumber(homeSqFt)} <span className="text-sm sm:text-base">Sq.Ft</span>
              </p>
            </div>
            {/* Bar container - aligned to bottom */}
            <div className="flex items-end">
              <div
                className="w-full rounded-t-xl sm:rounded-t-[2rem] rounded-b-md price-card-gradient transition-all duration-1000 ease-out"
                style={{
                  height: `${homeHeight}px`,
                  transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'bottom',
                  transitionDelay: '0.2s',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
