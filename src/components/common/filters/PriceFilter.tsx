"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaChevronDown, FaDollarSign } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';
import { DollarSign } from 'lucide-react';

const PriceFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const MIN_PRICE = 0;
  const MAX_PRICE = 2000000;
  const STEP = 10000;

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const minEvent = {
      target: {
        name: 'minPrice',
        value: MIN_PRICE
      }
    } as FilterChangeEvent;
    const maxEvent = {
      target: {
        name: 'maxPrice',
        value: MAX_PRICE
      }
    } as FilterChangeEvent;
    handleFilterChange(minEvent);
    handleFilterChange(maxEvent);
  };

  // Calculate percentage for positioning
  const getPercentage = (value: number) => {
    return ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  };

  // Get value from percentage
  const getValueFromPercentage = (percentage: number) => {
    const value = MIN_PRICE + (percentage / 100) * (MAX_PRICE - MIN_PRICE);
    return Math.round(value / STEP) * STEP;
  };

  // Handle mouse/touch events for dragging
  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleTouchStart = (type: 'min' | 'max') => (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  // Memoized mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const padding = 10; // 2.5 * 4 = 10px padding on each side
    const trackWidth = rect.width - (padding * 2);
    const x = e.clientX - rect.left - padding;
    const percentage = Math.max(0, Math.min(100, (x / trackWidth) * 100));
    const newValue = getValueFromPercentage(percentage);

    if (isDragging === 'min') {
      const clampedValue = Math.min(newValue, filters.maxPrice - STEP);
      const minEvent = {
        target: {
          name: 'minPrice',
          value: clampedValue
        }
      } as FilterChangeEvent;
      handleFilterChange(minEvent);
    } else {
      const clampedValue = Math.max(newValue, filters.minPrice + STEP);
      const maxEvent = {
        target: {
          name: 'maxPrice',
          value: clampedValue
        }
      } as FilterChangeEvent;
      handleFilterChange(maxEvent);
    }
  }, [isDragging, filters.minPrice, filters.maxPrice, handleFilterChange]);

  // Memoized touch move handler
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const padding = 10; // 2.5 * 4 = 10px padding on each side
    const trackWidth = rect.width - (padding * 2);
    const touch = e.touches[0];
    const x = touch.clientX - rect.left - padding;
    const percentage = Math.max(0, Math.min(100, (x / trackWidth) * 100));
    const newValue = getValueFromPercentage(percentage);

    if (isDragging === 'min') {
      const clampedValue = Math.min(newValue, filters.maxPrice - STEP);
      const minEvent = {
        target: {
          name: 'minPrice',
          value: clampedValue
        }
      } as FilterChangeEvent;
      handleFilterChange(minEvent);
    } else {
      const clampedValue = Math.max(newValue, filters.minPrice + STEP);
      const maxEvent = {
        target: {
          name: 'maxPrice',
          value: clampedValue
        }
      } as FilterChangeEvent;
      handleFilterChange(maxEvent);
    }
  }, [isDragging, filters.minPrice, filters.maxPrice, handleFilterChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp]);

  const minPercentage = getPercentage(filters.minPrice);
  const maxPercentage = getPercentage(filters.maxPrice);

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all ${activeDropdown ? 'border-2 border-secondary text-primary' : 'border border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <DollarSign className="w-4 h-4" />
        <span>{formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}</span>
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-[100] mt-2 w-full sm:w-72 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Price Range</p>
            {(filters.minPrice > MIN_PRICE || filters.maxPrice < MAX_PRICE) && (
              <button
                onClick={handleIndividualReset}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                title="Reset price range"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{formatPrice(filters.minPrice)}</span>
              <span className="text-sm font-medium">{formatPrice(filters.maxPrice)}</span>
            </div>
            
            {/* Dual Range Slider */}
            <div className="relative py-3 px-2.5" ref={sliderRef}>
              {/* Track */}
              <div className="h-2 bg-gray-200 rounded-lg relative">
                {/* Active range */}
                <div
                  className="absolute h-2 bg-secondary rounded-lg"
                  style={{
                    left: `${minPercentage}%`,
                    width: `${maxPercentage - minPercentage}%`
                  }}
                />
              </div>
              
              {/* Min handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-secondary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
                style={{ 
                  left: `calc(${minPercentage}% - 10px)`,
                  transform: 'translateY(-50%)'
                }}
                onMouseDown={handleMouseDown('min')}
                onTouchStart={handleTouchStart('min')}
              />
              
              {/* Max handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-secondary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
                style={{ 
                  left: `calc(${maxPercentage}% - 10px)`,
                  transform: 'translateY(-50%)'
                }}
                onMouseDown={handleMouseDown('max')}
                onTouchStart={handleTouchStart('max')}
              />
            </div>
            
            {/* Value labels below slider */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatPrice(MIN_PRICE)}</span>
              <span>{formatPrice(MAX_PRICE)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceFilter;
