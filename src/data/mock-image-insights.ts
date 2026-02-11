/**
 * Mock Image Insights Data
 * 
 * This provides mock data for imageInsights when the API doesn't return it
 * The structure matches the SinglePropertyListingResponse.imageInsights format
 */

import type { ImageInsights } from '@/lib/api/repliers/types/single-listing';

/**
 * Generate mock image insights based on property data
 * This simulates the API response structure
 */
export function getMockImageInsights(mlsNumber?: string): ImageInsights {
  // Generate consistent mock data based on MLS number for testing
  const seed = mlsNumber ? parseInt(mlsNumber.replace(/\D/g, '').slice(-4)) || 1234 : 1234;
  
  // Generate scores between 3.5 and 5.0 (realistic quality scores)
  const baseScore = 3.5 + (seed % 150) / 100; // Range: 3.5 - 5.0
  const overallScore = Math.min(5.0, Math.max(3.5, baseScore));
  
  // Generate feature scores with some variation
  const featureScores = {
    livingRoom: Math.min(5.0, Math.max(3.0, overallScore + (seed % 100 - 50) / 200)),
    frontOfStructure: Math.min(5.0, Math.max(2.5, overallScore + (seed % 80 - 40) / 200)),
    kitchen: Math.min(5.0, Math.max(3.5, overallScore + (seed % 120 - 60) / 200)),
    diningRoom: Math.min(5.0, Math.max(3.0, overallScore + (seed % 90 - 45) / 200)),
    bathroom: Math.min(5.0, Math.max(3.0, overallScore + (seed % 110 - 55) / 200)),
    bedroom: Math.min(5.0, Math.max(3.5, overallScore + (seed % 100 - 50) / 200)),
  };
  
  // Determine overall rating based on score
  const getOverallRating = (score: number): string => {
    if (score >= 4.5) return 'excellent';
    if (score >= 4.0) return 'very good';
    if (score >= 3.5) return 'good';
    if (score >= 3.0) return 'above average';
    return 'average';
  };
  
  // Get feature ratings
  const getFeatureRating = (score: number): string => {
    if (score >= 4.5) return 'excellent';
    if (score >= 4.0) return 'very good';
    if (score >= 3.5) return 'above average';
    if (score >= 3.0) return 'average';
    return 'below average';
  };
  
  const overallRating = getOverallRating(overallScore);
  
  return {
    summary: {
      quality: {
        qualitative: {
          features: {
            livingRoom: getFeatureRating(featureScores.livingRoom),
            frontOfStructure: getFeatureRating(featureScores.frontOfStructure),
            kitchen: getFeatureRating(featureScores.kitchen),
            diningRoom: getFeatureRating(featureScores.diningRoom),
            bathroom: getFeatureRating(featureScores.bathroom),
            bedroom: getFeatureRating(featureScores.bedroom),
          },
          overall: overallRating,
        },
        quantitative: {
          features: {
            livingRoom: Math.round(featureScores.livingRoom * 100) / 100,
            frontOfStructure: Math.round(featureScores.frontOfStructure * 100) / 100,
            kitchen: Math.round(featureScores.kitchen * 100) / 100,
            diningRoom: Math.round(featureScores.diningRoom * 100) / 100,
            bathroom: Math.round(featureScores.bathroom * 100) / 100,
            bedroom: Math.round(featureScores.bedroom * 100) / 100,
          },
          overall: Math.round(overallScore * 100) / 100,
        },
      },
    },
    images: [
      // Mock image insights - simplified version
      {
        image: 'sample/IMG-0.jpg',
        classification: {
          imageOf: 'Living Room',
          prediction: 0.95,
        },
        quality: {
          qualitative: 'excellent',
          quantitative: 4.8,
        },
      },
      {
        image: 'sample/IMG-1.jpg',
        classification: {
          imageOf: 'Kitchen',
          prediction: 0.92,
        },
        quality: {
          qualitative: 'very good',
          quantitative: 4.6,
        },
      },
    ],
  };
}

