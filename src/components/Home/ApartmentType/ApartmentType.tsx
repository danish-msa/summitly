import { useEffect, useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading'
import { fetchPropertyClasses } from '@/data/data';
import React from 'react'
import AppartmentTypeCard from './AppartmentTypeCard';

// Interface for property class
interface PropertyClass {
  id: number;
  icon: string;
  type: string;
  number: number;
}

const ApartmentType = () => {
  const [propertyClasses, setPropertyClasses] = useState<PropertyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPropertyClasses = async () => {
      try {
        const classes = await fetchPropertyClasses();
        setPropertyClasses(classes);
      } catch (err) {
        setError('Failed to load property classes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyClasses();
  }, []);

  if (loading) return <div className="text-center py-10">Loading property types...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className='pt-16 pb-16 bg-[url("/images/pattern.png")] relative bg-cover bg-center'>
      <div className='w-[80%] mx-auto'>
        <SectionHeading 
          heading='Property Categories' 
          subheading='Explore Properties by Type' 
          description='Browse through our diverse collection of property categories to find your perfect match.' 
        />
        
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-center mt-10'>
          {propertyClasses.map((propertyClass) => (
            <div key={propertyClass.id} className='flex flex-col items-center space-y-2'>
              <AppartmentTypeCard type={propertyClass} />
            </div>
          ))}
        </div>
      </div>   
    </div>
  )
}

export default ApartmentType