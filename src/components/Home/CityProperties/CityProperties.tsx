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
      <div className='w-[95%] mx-auto'>
        <SectionHeading 
          heading='Our Location For You' 
          subheading='Explore Cities' 
          description='Discover properties in these popular cities and find your ideal home in a location that suits your lifestyle.'
        />
        <div className='mt-7 md:mt-20'>
          {loading ? (
            <div className="text-center py-10">Loading city data...</div>
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