"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreConItem from '@/components/PreConItem/PreConItem';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';
import { preConCities } from '@/components/PreCon/Search/preConSearchData';

const PreConstructionPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';
  const [pageType, setPageType] = useState<'project' | 'city' | 'status' | 'propertyType' | 'subPropertyType' | 'completionYear' | 'loading'>('loading');

  // Known city slugs (from preConCities)
  const knownCitySlugs = preConCities.map(city => city.id);

  // Known status slugs
  const knownStatusSlugs = ['selling', 'coming-soon', 'sold-out'];

  // Known property type slugs
  const knownPropertyTypeSlugs = ['condos', 'houses', 'lofts', 'master-planned-communities', 'multi-family', 'offices'];

  // Known sub-property type slugs (format: subType-mainType)
  const knownSubPropertyTypeSlugs = [
    'high-rise-condos',
    'mid-rise-condos',
    'low-rise-condos',
    'link-houses',
    'townhouse-houses',
    'semi-detached-houses',
    'detached-houses',
  ];

  // Helper to check if slug is a sub-property type
  const isSubPropertyType = (slug: string): boolean => {
    return knownSubPropertyTypeSlugs.includes(slug.toLowerCase());
  };

  // Helper to check if slug is a year (4-digit number)
  const isYear = (slug: string): boolean => {
    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(slug)) return false;
    const year = parseInt(slug, 10);
    // Check if it's a reasonable year (e.g., 2020-2100)
    return year >= 2020 && year <= 2100;
  };

  useEffect(() => {
    const determinePageType = async () => {
      try {
        const slugLower = slug.toLowerCase();

        // First, check if it's a year (e.g., "2025")
        if (isYear(slug)) {
          setPageType('completionYear');
          return;
        }

        // Check if it's a sub-property type (e.g., "high-rise-condos")
        if (isSubPropertyType(slugLower)) {
          setPageType('subPropertyType');
          return;
        }

        // Check if it's a known status
        if (knownStatusSlugs.includes(slugLower)) {
          setPageType('status');
          return;
        }

        // Check if it's a known property type
        if (knownPropertyTypeSlugs.includes(slugLower)) {
          setPageType('propertyType');
          return;
        }

        // Check if it's a known city
        if (knownCitySlugs.includes(slugLower)) {
          setPageType('city');
          return;
        }

        // If not a known filter, try to fetch as a project (by mlsNumber)
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
  if (pageType === 'city' || pageType === 'status' || pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
    return <PreConstructionBasePage slug={slug} pageType={pageType} />;
  }

  // Otherwise, it's a project
  return <PreConItem />;
};

export default PreConstructionPage;

