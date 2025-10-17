import { useEffect, useState } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';
import { fetchPropertyListings } from '@/data/data';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts

const Properties = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const listings = await fetchPropertyListings();
        setProperties(listings);
      } catch (err) {
        setError('Failed to load property listings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (loading) return <div className="text-center py-10">Loading properties...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className='pt-12 sm:pt-16 pb-12 sm:pb-16'>
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Properties' 
          subheading='Latest Properties' 
          description='Explore our latest property listings to find your perfect home, investment opportunity, or commercial space.' 
        />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10'>
          {properties.slice(0, 6).map((property) => (
            <PropertyCard key={property.mlsNumber} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Properties;