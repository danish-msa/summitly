"use client";

import { DollarSign, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface PricePredictionProps {
  estimatedValue?: number;
  lowerRange?: number;
  higherRange?: number;
  confidence?: number;
  appreciation?: number;
  monthlyRent?: number;
}

const PricePrediction = ({
  estimatedValue = 714900,
  lowerRange = 643410,
  higherRange = 786390,
  confidence = 75,
  appreciation = 0,
  monthlyRent = 3575,
}: PricePredictionProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0);

  // Calculate slider position based on estimated value within range
  const calculateSliderPosition = () => {
    const range = higherRange - lowerRange;
    const position = ((estimatedValue - lowerRange) / range) * 100;
    return Math.min(Math.max(position, 0), 100);
  };

  useEffect(() => {
    // Animate the estimated value counter
    const duration = 1500;
    const steps = 60;
    const increment = estimatedValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= estimatedValue) {
        setAnimatedValue(estimatedValue);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    // Animate slider position
    setTimeout(() => {
      setSliderPosition(calculateSliderPosition());
    }, 300);

    return () => clearInterval(timer);
  }, [estimatedValue, lowerRange, higherRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full animate-scale-in">
      <div className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 p-6 sm:p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">Price</h2>
              <h2 className="text-lg font-semibold text-foreground leading-tight">Prediction</h2>
            </div>
          </div>
          
          {/* Confidence Badge */}
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full shadow-badge">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{confidence} %</span>
            <span className="text-xs text-white">Confidence</span>
          </div>
        </div>

        {/* Estimated Value Section */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2 tracking-wide">Estimated Value</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            {formatCurrency(animatedValue)}
          </h1>
        </div>

        {/* Range Section */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span className="font-medium">{formatCurrency(lowerRange)}</span>
            <span className="font-medium">{formatCurrency(higherRange)}</span>
          </div>
          
          {/* Range Slider Track */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-range rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${sliderPosition}%` }}
            />
            {/* Slider Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-card border-2 border-primary rounded-full shadow-lg transition-all duration-1000 ease-out cursor-pointer hover:scale-110"
              style={{ left: `calc(${sliderPosition}% - 8px)` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Lower Range</span>
            <span>Higher Range</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Appreciation */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Appreciation</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${appreciation >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {appreciation >= 0 ? '+' : ''}{appreciation}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Since last<br />sold)
            </p>
          </div>
          
          {/* Monthly Rent */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Est. Monthly Rent</p>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(monthlyRent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricePrediction;

