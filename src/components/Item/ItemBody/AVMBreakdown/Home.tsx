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
      const totalSqft = rawProperty.comparables.reduce((sum, comp) => {
        const compSqft = (comp as any)?.details?.sqft;
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

  // Calculate bar heights proportionally (subtle difference)
  const maxHeight = 90;
  const typicalHeight = Math.max(maxHeight * (typicalSqFt / homeSqFt), maxHeight * 0.7); // Minimum 70% of max height
  const homeHeight = maxHeight;

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
    <div ref={containerRef} className="max-w-3xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Home</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-semibold ${valueAdded >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {valueAdded >= 0 ? '+' : ''} {formatCurrency(valueAdded)}
          </span>
          <span className="text-lg text-muted-foreground">to value</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatNumber(Math.abs(sqFtDifference))} square feet {sqFtDifference >= 0 ? 'larger' : 'smaller'} than the typical square footage
        </p>
      </div>

      {/* Comparison Bars */}
      <div className="flex gap-8 items-end relative">
        {/* Typical homes bar */}
        <div className="flex-1 relative">
          <div className="relative flex flex-col justify-end">
            {/* Text labels - positioned above bars */}
            <div 
              className="space-y-0.5 mb-4 transition-opacity duration-1000 ease-out"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transitionDelay: '0.1s'
              }}
            >
              <p className="text-xs text-muted-foreground">Typical homes in the area</p>
              <p className="text-xl font-semibold text-foreground">
                {formatNumber(typicalSqFt)} <span className="text-base">Sq.Ft</span>
              </p>
            </div>
            {/* Bar container - aligned to bottom */}
            <div className="flex items-end">
              <div 
                className="w-full rounded-t-[2rem] rounded-b-md bg-[#E8E8E8] transition-all duration-1000 ease-out"
                style={{ 
                  height: `${typicalHeight}px`,
                  transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'bottom',
                  transitionDelay: '0.1s'
                }}
              />
            </div>
          </div>
        </div>

        {/* This home bar */}
        <div className="flex-1 relative">
          <div className="relative flex flex-col justify-end">
            {/* Text labels - positioned above bars */}
            <div 
              className="space-y-0.5 mb-4 text-right transition-opacity duration-1000 ease-out"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transitionDelay: '0.2s'
              }}
            >
              <p className="text-xs text-muted-foreground">This Home</p>
              <p className="text-xl font-semibold text-foreground">
                {formatNumber(homeSqFt)} <span className="text-base">Sq.Ft</span>
              </p>
            </div>
            {/* Bar container - aligned to bottom */}
            <div className="flex items-end">
              <div 
                className="w-full rounded-t-[2rem] rounded-b-md price-card-gradient transition-all duration-1000 ease-out"
                style={{ 
                  height: `${homeHeight}px`,
                  transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'bottom',
                  transitionDelay: '0.2s'
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
