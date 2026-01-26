"use client";

import { useState, useEffect } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading'
import PreConCitySlider from './PreConCitySlider';
import { CityCardSkeleton } from '@/components/skeletons';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

const PreConCityProperties = () => {
  const [cities, setCities] = useState<PreConCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/pre-con-cities?limit=20');
        
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await response.json();
        setCities(data.cities || []);
      } catch (err) {
        console.error('Error loading cities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cities');
        setCities([]);
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
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  breakpoints: {
                    "(max-width: 640px)": {
                      dragFree: true,
                    },
                  },
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {[...Array(8)].map((_, index) => (
                    <CarouselItem
                      key={index}
                      className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                    >
                      <CityCardSkeleton />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <p className="text-gray-600 text-sm">Please try refreshing the page.</p>
            </div>
          ) : cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-600">No cities found.</p>
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

