import { useEffect, useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading'
import { fetchTopCities } from '@/data/data';
import CitySlider2 from './CitySlider2';

interface City {
  id: number;
  image: string;
  cityName: string;
  numberOfProperties: number;
}

const CityProperties = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const topCities = await fetchTopCities();
        setCities(topCities);
      } catch (err) {
        setError('Failed to load city data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
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
                Fetching popular cities and their properties
              </p>
              
              {/* Progress indicator */}
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-secondary via-blue-500 to-secondary rounded-full animate-progress-fill"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : (
            <CitySlider2 cities={cities} />
          )}
        </div>
      </div>   
    </div>
  )
}

export default CityProperties