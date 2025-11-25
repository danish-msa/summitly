"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreConItem from '@/components/PreConItem/PreConItem';
import PreConstructionCityPage from '@/components/PreCon/PreConstructionCityPage';
import { preConCities } from '@/components/PreCon/Search/preConSearchData';

const PreConstructionPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';
  const [pageType, setPageType] = useState<'project' | 'city' | 'loading'>('loading');

  // Known city slugs (from preConCities)
  const knownCitySlugs = preConCities.map(city => city.id);

  useEffect(() => {
    const determinePageType = async () => {
      try {
        // First, check if it's a known city
        if (knownCitySlugs.includes(slug.toLowerCase())) {
          setPageType('city');
          return;
        }

        // If not a known city, try to fetch as a project (by mlsNumber)
        const projectResponse = await fetch(`/api/pre-con-projects/${slug}`);
        
        if (projectResponse.ok) {
          // It's a project
          setPageType('project');
        } else {
          // Not found as project, but could still be a city (dynamic city names)
          // Check if we can fetch projects for this city
          const cityName = slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const cityResponse = await fetch(`/api/pre-con-projects?city=${encodeURIComponent(cityName)}`);
          
          if (cityResponse.ok) {
            const data = await cityResponse.json();
            // If we get projects back, treat it as a city
            if (data.projects && data.projects.length > 0) {
              setPageType('city');
            } else {
              // No projects found, but still treat as city (empty city page)
              setPageType('city');
            }
          } else {
            // Not a city either, default to project (will show 404 if not found)
            setPageType('project');
          }
        }
      } catch (error) {
        console.error('Error determining page type:', error);
        // Default to project on error
        setPageType('project');
      }
    };

    if (slug) {
      determinePageType();
    }
  }, [slug, knownCitySlugs]);

  // Show loading state
  if (pageType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate page based on type
  if (pageType === 'city') {
    return <PreConstructionCityPage citySlug={slug} />;
  }

  // Otherwise, it's a project
  return <PreConItem />;
};

export default PreConstructionPage;

