"use client";
import GlobalLocationSearch from '@/components/common/GlobalLocationSearch';
import React from 'react'

const Hero = () => {
  const handleLocationSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    console.log('Selected Location:', address);
    if (coordinates) {
      console.log('Coordinates:', coordinates);
    }
    // You can add navigation logic here, e.g.:
    // router.push(`/search?location=${encodeURIComponent(address)}`);
  };
  return (
    <div className="w-full flex-col flex justify-center items-center mt-16 pt-28 md:pt-20 pb-20 bg-[url('/images/pre-con-hero.webp')] bg-cover bg-center relative mx-auto">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="flex flex-col items-center justify-center text-white w-[90%] sm:w-[70%] lg:w-[60%] relative z-10">
        <span className='text-white text-sm mb-4 bg-secondary rounded-full px-10 py-2'>Pre-Construction Homes</span>
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 leading-relaxed">
          Discover the Most Exciting Pre-Construction Projects Across Canada
        </h1>
        <p className="text-lg  md:text-xl text-center mb-8">
          Get first access to floor plans, pricing, and VIP incentives before public release.
        </p>
        <GlobalLocationSearch 
          onSelect={handleLocationSelect} 
          placeholder="Enter location to search pre-construction properties"
          className='bg-white/90 rounded-full max-w-xl' 
        />
      </div>
    </div>
  )
}

export default Hero