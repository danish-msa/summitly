"use client";

import { useState, useEffect } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading'
import CitySlider from './CitySlider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

// Static city data - no API calls for better performance
const STATIC_CITIES: City[] = [
  {
    id: 1,
    image: '/images/cities/toronto.webp',
    cityName: 'Toronto',
    numberOfProperties: 0, // Count removed for performance
  },
  {
    id: 2,
    image: '/images/cities/vancouver.webp',
    cityName: 'Vancouver',
    numberOfProperties: 0,
  },
  {
    id: 3,
    image: '/images/cities/calgary.webp',
    cityName: 'Calgary',
    numberOfProperties: 0,
  },
  {
    id: 4,
    image: '/images/cities/montreal.webp',
    cityName: 'Montreal',
    numberOfProperties: 0,
  },
  {
    id: 5,
    image: '/images/cities/ottawa.webp',
    cityName: 'Ottawa',
    numberOfProperties: 0,
  },
  {
    id: 6,
    image: '/images/cities/edmonton.webp',
    cityName: 'Edmonton',
    numberOfProperties: 0,
  },
  {
    id: 7,
    image: '/images/cities/mississauga.webp',
    cityName: 'Mississauga',
    numberOfProperties: 0,
  },
  {
    id: 8,
    image: '/images/cities/winnipeg.webp',
    cityName: 'Winnipeg',
    numberOfProperties: 0,
  },
];

const CityProperties = () => {
  const [loading, setLoading] = useState(true);
  const cities = STATIC_CITIES;

  // Simulate loading time for images
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Short delay to show skeleton

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='pt-16 pb-16 bg-white'>
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Explore Popular Cities' 
          subheading='Popular Cities' 
          description='Discover properties in these popular cities and find your ideal home in a location that suits your lifestyle.'
        />
        <div className='mt-7 md:mt-20'>
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
                      className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                    >
                      <div className='relative rounded-lg overflow-hidden m-2'>
                        {/* Image Skeleton */}
                        <Skeleton className='w-full h-[250px] rounded-2xl' />
                        
                        {/* Bottom Overlay Skeleton */}
                        <div className='absolute bottom-2 left-2 right-2 rounded-xl px-4 pt-4 pb-4 bg-white flex justify-between items-center'>
                          <div className='flex flex-col flex-1'>
                            <Skeleton className='h-5 w-24 mb-1' />
                          </div>
                          <Skeleton className='h-8 w-8 rounded-full' />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <CitySlider cities={cities} />
          )}
        </div>
      </div>   
    </div>
  )
}

export default CityProperties