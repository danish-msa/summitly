"use client";

import React from 'react';
import GlobalSearch from '@/components/common/GlobalSearch';
import { PropertySuggestion } from '@/hooks/usePropertySearch';

const HomeEstimatorBanner = () => {

  const handleSuggestionSelect = (property: PropertySuggestion) => {
    console.log('Selected Property:', property);
    // You can add navigation logic here, e.g.:
    // router.push(`/property/${property.id}`);
  };

  return (
    <div className="w-full flex-col flex justify-center items-center pt-28 md:pt-[10vw] pb-[4vw] bg-[url('/images/banner2.webp')] bg-cover bg-center relative mx-auto">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="flex flex-col items-center justify-center text-white w-[90%] sm:w-[70%] lg:w-[60%] relative z-10">
        <span className='text-white text-lg mb-4 bg-secondary rounded-full px-10 py-2'>Home Value Estimator</span>
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
           What is My Home Worth?
        </h1>
        <p className="text-lg md:text-xl text-center mb-8">
          Get an instant home value estimate and get in the know about your most precious asset.
        </p>
        
        <GlobalSearch onSuggestionSelect={handleSuggestionSelect} />

      </div>
    </div>
  );
};

export default HomeEstimatorBanner;