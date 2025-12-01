"use client";

import { useState, useEffect } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading'
import PreConCitySlider from './PreConCitySlider';
import { preConCityProjectsData } from './preConCityProjectsData';

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

const PreConCityProperties = () => {
  const [cities, setCities] = useState<PreConCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and use preConCityProjectsData
    const loadCities = async () => {
      try {
        // Use the mock data with project counts
        setCities(preConCityProjectsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  return (
    <div className='pt-16 pb-16 bg-white'>
      <div className='container-1400 mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Explore Pre-Construction Cities' 
          subheading='Pre-Construction Cities' 
          description='Discover pre-construction projects in these popular cities and find your ideal new home in a location that suits your lifestyle.'
        />
        <div className='mt-7'>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                {/* City-themed loading spinner */}
                <div className="relative w-16 h-16">
                  {/* Outer ring */}
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full animate-spin-slow"></div>
                  
                  {/* Middle ring */}
                  <div className="absolute inset-2 border-3 border-gray-300 rounded-full animate-spin-reverse"></div>
                  
                  {/* Inner ring */}
                  <div className="absolute inset-4 border-2 border-secondary rounded-full animate-spin animate-pulse-glow"></div>
                  
                  {/* Center city icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-secondary rounded-full animate-pulse-glow"></div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2 animate-fade-in">
                Loading City Data...
              </h3>
              <p className="text-sm text-gray-600 mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Fetching pre-construction cities and their projects
              </p>
              
              {/* Progress indicator */}
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-secondary via-blue-500 to-secondary rounded-full animate-progress-fill"></div>
              </div>
            </div>
          ) : (
            <PreConCitySlider cities={cities} />
          )}
        </div>
      </div>   
    </div>
  )
}

export default PreConCityProperties

