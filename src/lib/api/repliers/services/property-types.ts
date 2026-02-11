/**
 * Property Types Service
 * 
 * Handles property types and classes:
 * - Fetching property types with counts
 * - Fetching property classes
 * - Transforming API data to UI format
 */

import { repliersClient, API_CONFIG } from '../client';
import type { PropertyType, PropertyClass, PropertyTypesResponse } from '@/lib/types';

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Fetch property types with active counts
 */
export async function fetchPropertyTypes(): Promise<PropertyType[]> {
  const response = await repliersClient.request<PropertyTypesResponse>({
    endpoint: '/listings/property-types',
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.propertyTypes,
    priority: 'low',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch property types:', response.error?.message);
    return [];
  }

  // Transform nested API structure to flat array
  const transformedData: PropertyType[] = [];
  let id = 1;

  response.data.boards.forEach((board) => {
    Object.entries(board.classes).forEach(([className, classData]) => {
      classData.propertyTypes.forEach((propertyTypeObj) => {
        Object.entries(propertyTypeObj).forEach(([typeName, typeDetails]) => {
          transformedData.push({
            id,
            icon: `/images/a${(id % 5) + 1}.png`,
            type: typeName,
            number: typeDetails.activeCount,
            class: className,
          });
          id++;
        });
      });
    });
  });

  return transformedData;
}

/**
 * Fetch property classes with aggregated counts
 */
export async function fetchPropertyClasses(): Promise<PropertyClass[]> {
  const response = await repliersClient.request<PropertyTypesResponse>({
    endpoint: '/listings/property-types',
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.propertyTypes,
    priority: 'low',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch property classes:', response.error?.message);
    return [];
  }

  // Aggregate counts by class
  const classTotals: Record<string, number> = {};

  response.data.boards.forEach((board) => {
    Object.entries(board.classes).forEach(([className, classData]) => {
      classTotals[className] = 0;

      classData.propertyTypes.forEach((propertyTypeObj) => {
        Object.entries(propertyTypeObj).forEach(([, typeDetails]) => {
          classTotals[className] += typeDetails.activeCount;
        });
      });
    });
  });

  // Transform to array format
  const transformedData: PropertyClass[] = Object.entries(classTotals).map(
    ([className, count], index) => ({
      id: index + 1,
      icon: `/images/a${(index % 5) + 1}.png`,
      type: className.charAt(0).toUpperCase() + className.slice(1) + ' Properties',
      number: count,
    })
  );

  return transformedData;
}

