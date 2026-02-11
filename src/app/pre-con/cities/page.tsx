import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PreConCityCard from '@/components/PreCon/PreConCityProperties/PreConCityCard';
import SectionHeading from '@/components/Helper/SectionHeading';

export const metadata: Metadata = {
  title: 'Pre-Construction Cities | Explore All Cities',
  description: 'Discover pre-construction projects across all cities. Browse available cities and find your ideal new home in the perfect location.',
  openGraph: {
    title: 'Pre-Construction Cities | Explore All Cities',
    description: 'Discover pre-construction projects across all cities. Browse available cities and find your ideal new home in the perfect location.',
    type: 'website',
  },
  alternates: {
    canonical: '/pre-con/cities',
  },
};

interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

// Helper function to convert city name to URL-friendly slug
function slugifyCityName(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getCities(): Promise<PreConCity[]> {
  try {
    // Fetch all published projects with city and image data
    const projects = await prisma.preConstructionProject.findMany({
      where: {
        isPublished: true,
        city: {
          not: null,
        },
      },
      select: {
        city: true,
        images: true,
      },
    });

    // Count projects per city and collect images
    const cityData: Record<string, { count: number; images: string[] }> = {};
    
    projects.forEach(project => {
      const city = project.city;
      if (city) {
        if (!cityData[city]) {
          cityData[city] = { count: 0, images: [] };
        }
        cityData[city].count++;
        
        // Collect images from projects in this city
        if (project.images && project.images.length > 0) {
          // Add images that aren't already in the array
          project.images.forEach(image => {
            if (image && !cityData[city].images.includes(image)) {
              cityData[city].images.push(image);
            }
          });
        }
      }
    });

    // Convert to array format and sort by project count (descending)
    const cities = Object.entries(cityData)
      .map(([cityName, data]) => ({
        id: slugifyCityName(cityName),
        name: cityName,
        numberOfProjects: data.count,
        image: data.images.length > 0 
          ? data.images[0] // Use first available image
          : '/images/default-city.jpg', // Fallback image
      }))
      .sort((a, b) => b.numberOfProjects - a.numberOfProjects); // Sort by project count descending

    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

const PreConCitiesPage: React.FC = async () => {
  const cities = await getCities();

  return (
    <div className="min-h-screen bg-white pt-16 pb-16">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading 
          heading="All Pre-Construction Cities" 
          subheading="Pre-Construction Cities" 
          description="Explore pre-construction projects in cities across the region. Find your ideal new home in a location that suits your lifestyle."
        />
        
        {cities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-600 text-lg">No cities found at this time.</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later.</p>
          </div>
        ) : (
          <div className="mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.map((city) => (
                <PreConCityCard key={city.id} city={city} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreConCitiesPage;
