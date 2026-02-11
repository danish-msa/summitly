"use client";

import React from 'react';
import GlobalPropertySearch from '@/components/common/GlobalPropertySearch';
import { PropertySuggestion } from '@/hooks/usePropertySearch';
import { Home } from 'lucide-react';

interface HomeownerBannerProps {
  onPropertySelect: (property: PropertySuggestion) => void;
}

const HomeownerBanner: React.FC<HomeownerBannerProps> = ({ onPropertySelect }) => {
  return (
    <div className="w-full flex-col flex justify-center items-center sm:mt-16 pt-20 sm:pt-28 md:pt-24 pb-12 sm:pb-16 md:pb-28 bg-[url('/images/pre-con/container.png')] bg-cover bg-center relative mx-auto">
      {/* Overlay */}
      <div 
        className="absolute inset-0" 
        style={{ background: 'linear-gradient(180deg, rgba(10, 22, 40, 0.7) 0%, rgba(10, 22, 40, 0.7) 100%)' }}
      ></div>

      <div className="flex flex-col items-center justify-center text-white w-[95%] sm:w-[90%] md:w-[70%] lg:w-[60%] relative z-10">
        <span className='text-white text-xs sm:text-sm mb-3 sm:mb-4 bg-secondary/30 rounded-full px-6 py-1.5 sm:py-3 border border-secondary/30 flex items-center gap-2'>
          <Home className='w-4 h-4 text-secondary' />
          My Home
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 leading-tight sm:leading-relaxed px-2">
          Discover Your Property's 
          <span className='text-secondary'> Value & Insights</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-center mb-6 sm:mb-8 px-2">
          Get detailed information, market analytics, and insights about your property.
        </p>
        <div className="relative w-full max-w-2xl px-2">
          <GlobalPropertySearch
            onSuggestionSelect={onPropertySelect}
            placeholder="Enter your property address"
          />
        </div>
      </div>
    </div>
  );
};

export default HomeownerBanner;
