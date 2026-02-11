import type { ProcessedLocation } from "@/data/types";
import type { MarketData, ListingsData, SoldPriceData } from './types';

/**
 * Generate realistic market data based on location demographics
 */
export const generateMarketData = (locationData: ProcessedLocation | null, propertyClass: string): MarketData => {
  const months: string[] = [];
  const prices: number[] = [];
  const days: number[] = [];
  
  const startDate = new Date(2020, 0, 1);
  const endDate = new Date(2025, 9, 1);
  
  const currentDate = new Date(startDate);
  
  // Base values based on property class and location demographics
  let basePrice = 650000;
  let baseDays = 20;
  
  // Adjust base values based on property class
  if (propertyClass === 'condo') {
    basePrice = 550000;
    baseDays = 15;
  } else if (propertyClass === 'commercial') {
    basePrice = 850000;
    baseDays = 35;
  }
  
  // Adjust based on location demographics
  if (locationData) {
    const totalProperties = locationData.demographics.total;
    const residentialRatio = locationData.demographics.residential / totalProperties;
    
    // Higher property count areas tend to have higher prices
    if (totalProperties > 1000) {
      basePrice *= 1.2;
    } else if (totalProperties < 100) {
      basePrice *= 0.8;
    }
    
    // More residential areas tend to have faster sales
    if (residentialRatio > 0.7) {
      baseDays *= 0.8;
    }
  }
  
  while (currentDate <= endDate) {
    months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Add realistic market variation
    const priceVariation = (Math.random() - 0.5) * 50000;
    const dayVariation = (Math.random() - 0.5) * 15;
    
    // Add seasonal trends
    const month = currentDate.getMonth();
    const seasonalAdjustment = Math.sin((month / 12) * 2 * Math.PI) * 0.1;
    
    basePrice += priceVariation * 0.1 + (basePrice * seasonalAdjustment);
    baseDays += dayVariation * 0.1;
    
    // Ensure realistic bounds
    const minPrice = propertyClass === 'condo' ? 300000 : propertyClass === 'commercial' ? 500000 : 400000;
    const maxPrice = propertyClass === 'condo' ? 800000 : propertyClass === 'commercial' ? 1200000 : 1000000;
    
    prices.push(Math.max(minPrice, Math.min(maxPrice, basePrice)));
    days.push(Math.max(10, Math.min(60, baseDays)));
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return { months, prices, days };
};

/**
 * Generate listings data based on Repliers API pattern
 */
export const generateListingsData = (locationData: ProcessedLocation | null): ListingsData => {
  const months: string[] = [];
  const newListings: number[] = [];
  const closedListings: number[] = [];
  
  // Generate last 6 months data
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Base values scaled by location demographics
    let baseNew = 150;
    let baseClosed = 80;
    
    if (locationData) {
      const totalProperties = locationData.demographics.total;
      // Scale based on total properties in area
      const scaleFactor = Math.min(totalProperties / 1000, 3); // Cap at 3x
      baseNew = Math.round(baseNew * scaleFactor);
      baseClosed = Math.round(baseClosed * scaleFactor);
    }
    
    // Add realistic variation
    const newVariation = (Math.random() - 0.5) * 50;
    const closedVariation = (Math.random() - 0.5) * 30;
    
    // Add seasonal trends (more listings in spring/summer)
    const month = date.getMonth();
    const seasonalAdjustment = Math.sin((month / 12) * 2 * Math.PI) * 0.3;
    
    newListings.push(Math.max(20, Math.round(baseNew + newVariation + (baseNew * seasonalAdjustment))));
    closedListings.push(Math.max(10, Math.round(baseClosed + closedVariation + (baseClosed * seasonalAdjustment))));
  }
  
  return { months, newListings, closedListings };
};

/**
 * Generate sold price data based on Repliers API pattern
 */
export const generateSoldPriceData = (locationData: ProcessedLocation | null): SoldPriceData => {
  const months: string[] = [];
  const medianPrices: number[] = [];
  const averagePrices: number[] = [];
  
  // Generate last 12 months data
  const currentDate = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Base values scaled by location demographics
    let baseMedian = 650000;
    let baseAverage = 580000;
    
    if (locationData) {
      const totalProperties = locationData.demographics.total;
      const residentialRatio = locationData.demographics.residential / totalProperties;
      
      // Adjust prices based on residential ratio and total properties
      const priceAdjustment = residentialRatio * 1.2 + (totalProperties / 10000) * 0.3;
      baseMedian = Math.round(baseMedian * priceAdjustment);
      baseAverage = Math.round(baseAverage * priceAdjustment);
    }
    
    // Add realistic variation
    const medianVariation = (Math.random() - 0.5) * 100000;
    const averageVariation = (Math.random() - 0.5) * 80000;
    
    // Add seasonal trends (higher prices in spring/summer)
    const month = date.getMonth();
    const seasonalAdjustment = Math.sin((month / 12) * 2 * Math.PI) * 0.15;
    
    medianPrices.push(Math.max(300000, Math.round(baseMedian + medianVariation + (baseMedian * seasonalAdjustment))));
    averagePrices.push(Math.max(250000, Math.round(baseAverage + averageVariation + (baseAverage * seasonalAdjustment))));
  }
  
  return { months, medianPrices, averagePrices };
};

/**
 * Extract coordinates from property address
 */
export const extractCoordinates = (propertyAddress: string): [number, number] => {
  const addressParts = propertyAddress.split(',');
  const city = addressParts[1]?.trim().toLowerCase() || '';
  
  // Default coordinates for major cities (simplified)
  const cityCoordinates: Record<string, [number, number]> = {
    'toronto': [43.6532, -79.3832],
    'vancouver': [49.2827, -123.1207],
    'montreal': [45.5017, -73.5673],
    'calgary': [51.0447, -114.0719],
    'ottawa': [45.4215, -75.6972],
    'edmonton': [53.5461, -113.4938],
    'winnipeg': [49.8951, -97.1384],
    'hamilton': [43.2557, -79.8711],
    'london': [42.9849, -81.2453],
    'kitchener': [43.4501, -80.4829],
  };
  
  const coords = cityCoordinates[city] || [43.6532, -79.3832]; // Default to Toronto
  return coords;
};

/**
 * Get location name from location data or address
 */
export const getLocationName = (locationData: ProcessedLocation | null, propertyAddress: string): string => {
  if (locationData) {
    return locationData.name;
  }
  
  // Fallback to extracting from address
  const addressParts = propertyAddress.split(',');
  return addressParts[1]?.trim() || 'Local Area';
};

/**
 * Get property class label
 */
export const getPropertyClassLabel = (propertyClass: string): string => {
  switch (propertyClass.toLowerCase()) {
    case 'condo':
      return 'Condo';
    case 'commercial':
      return 'Commercial';
    case 'residential':
    default:
      return 'Residential';
  }
};

