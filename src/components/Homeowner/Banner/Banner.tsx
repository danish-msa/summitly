"use client";

import React from 'react';
import GlobalPropertySearch from '@/components/common/GlobalPropertySearch';
import { PropertySuggestion } from '@/hooks/usePropertySearch';

interface HomeownerBannerProps {
  onPropertySelect: (property: PropertySuggestion) => void;
}

const HomeownerBanner: React.FC<HomeownerBannerProps> = ({ onPropertySelect }) => {
  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-20 px-4">
      <div className="container-1400 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            My Home
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Search for your property to get started
          </p>
          
          {/* Property Search */}
          <div className="flex justify-center">
            <GlobalPropertySearch
              onSuggestionSelect={onPropertySelect}
              placeholder="Enter your property address"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerBanner;
