import { useEffect, useState } from 'react';

interface Property {
  id: string;
  type: string;
  price: number;
  location: string;
  // Add more properties as needed based on Repliers.io response
}

const ApartmentType = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('https://api.repliers.io/listings', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REPLIERS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {properties.map((property) => (
        <div key={property.id}>
          <h3>{property.type}</h3>
          <p>Price: ${property.price}</p>
          <p>Location: {property.location}</p>
          {/* Add more property details as needed */}
        </div>
      ))}
    </div>
  );
};

export default ApartmentType;