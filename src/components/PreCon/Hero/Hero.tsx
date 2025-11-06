"use client";
import SearchBar from '@/components/common/SearchBar';
import PreConSuggestions, { PreConCity, PreConLaunch } from '@/components/PreCon/Search/PreConSuggestions';
import { preConCities, preConLaunches } from '@/components/PreCon/Search/preConSearchData';
import { preConCityProjectsData } from '@/components/PreCon/PreConCityProperties/preConCityProjectsData';
import React, { useState, useRef, useEffect, useMemo } from 'react'

const Hero = () => {
  const [searchValue, setSearchValue] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setIsSuggestionsOpen(true);
  };

  const handleCitySelect = (city: PreConCity) => {
    setSearchValue(city.name);
    setIsSuggestionsOpen(false);
    console.log('Selected City:', city);
    // You can add navigation logic here, e.g.:
    // router.push(`/pre-construction?city=${city.id}`);
  };

  const handleLaunchSelect = (launch: PreConLaunch) => {
    setSearchValue(launch.title);
    setIsSuggestionsOpen(false);
    console.log('Selected Launch:', launch);
    // You can add navigation logic here, e.g.:
    // router.push(`/pre-construction/launches/${launch.id}`);
  };

  // Merge cities with project counts from mock data
  const citiesWithCounts = useMemo(() => {
    return preConCities.map((city) => {
      const projectData = preConCityProjectsData.find((p) => p.id === city.id);
      return {
        ...city,
        numberOfProjects: projectData?.numberOfProjects,
      };
    });
  }, []);

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
        <div ref={searchContainerRef} className="relative w-full max-w-xl">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onFocus={handleSearchFocus}
            placeholder="Enter location to search pre-construction properties"
            className='bg-white/90 rounded-full'
            showLocationButton={false}
          />
          <PreConSuggestions
            cities={citiesWithCounts}
            launches={preConLaunches}
            onCitySelect={handleCitySelect}
            onLaunchSelect={handleLaunchSelect}
            isOpen={isSuggestionsOpen}
          />
        </div>
      </div>
    </div>
  )
}

export default Hero