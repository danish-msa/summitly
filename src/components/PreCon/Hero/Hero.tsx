"use client";
import PreConSearchBar from '@/components/common/PreConSearchBar';
import React from 'react'

const Hero = () => {
  return (
    <div className="w-full flex-col flex justify-center items-center sm:mt-16 pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 bg-[url('/images/pre-con-hero.webp')] bg-cover bg-center relative mx-auto">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="flex flex-col items-center justify-center text-white w-[95%] sm:w-[90%] md:w-[70%] lg:w-[60%] relative z-10">
        <span className='text-white text-xs sm:text-sm mb-3 sm:mb-4 bg-secondary rounded-full px-6 sm:px-8 md:px-10 py-1.5 sm:py-2'>Pre-Construction Homes</span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 leading-tight sm:leading-relaxed px-2">
          Discover the Most Exciting Pre-Construction Projects Across Canada
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-center mb-6 sm:mb-8 px-2">
          Get first access to floor plans, pricing, and VIP incentives before public release.
        </p>
        <div className="relative w-full max-w-xl px-2">
          <PreConSearchBar
            placeholder="Enter location to search pre-construction properties"
            className='bg-white/90 rounded-full'
            autoNavigate={true}
          />
        </div>
      </div>
    </div>
  )
}

export default Hero
