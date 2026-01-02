import { NextResponse } from 'next/server';
import { RepliersAPI } from '@/lib/api/repliers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

interface CategoryCount {
  id: string;
  count: number;
}

export async function GET() {
  try {
    // Fetch counts for each category - handle errors individually
    let newListingsCount = 0;
    let soldListingsCount = 0;
    let landCount = 0;

    try {
      const newListingsResult = await RepliersAPI.listings.getFiltered({
        status: 'A',
        resultsPerPage: 1,
        page: 1,
      });
      newListingsCount = newListingsResult.count || 0;
    } catch (error) {
      console.error('Error fetching new listings count:', error);
    }

    try {
      const soldListingsResult = await RepliersAPI.listings.getFiltered({
        status: 'U',
        resultsPerPage: 1,
        page: 1,
      });
      soldListingsCount = soldListingsResult.count || 0;
    } catch (error) {
      console.error('Error fetching sold listings count:', error);
    }

    // Try to get land count from property types instead
    try {
      const landResult = await RepliersAPI.listings.getFiltered({
        status: 'A',
        propertyType: 'land',
        resultsPerPage: 1,
        page: 1,
      });
      landCount = landResult.count || 0;
    } catch (error) {
      // If propertyType filter fails, try to get from property types
      try {
        const propertyTypes = await RepliersAPI.propertyTypes.fetch();
        const landType = propertyTypes.find(
          (pt) => pt.type.toLowerCase().includes('land')
        );
        landCount = landType?.number || 0;
      } catch (ptError) {
        console.error('Error fetching land count:', ptError);
      }
    }

    // Get count of published pre-construction projects from database
    let constructionCount = 0;
    try {
      const preConCount = await prisma.preConstructionProject.count({
        where: {
          isPublished: true,
        },
      });
      constructionCount = preConCount;
    } catch (error) {
      console.error('Error fetching pre-construction projects count:', error);
      // Fallback to property types if database query fails
      try {
        const propertyTypes = await RepliersAPI.propertyTypes.fetch();
        const constructionTypes = propertyTypes.filter(
          (pt) =>
            pt.type.toLowerCase().includes('new') ||
            pt.type.toLowerCase().includes('construction') ||
            pt.type.toLowerCase().includes('development')
        );
        constructionCount = constructionTypes.reduce(
          (sum, pt) => sum + (pt.number || 0),
          0
        );
      } catch (fallbackError) {
        console.error('Error fetching property types fallback:', fallbackError);
      }
    }

    // Calculate counts
    const categories: Record<string, CategoryCount> = {
      new: {
        id: 'new',
        count: newListingsCount,
      },
      sold: {
        id: 'sold',
        count: soldListingsCount,
      },
      land: {
        id: 'land',
        count: landCount,
      },
      construction: {
        id: 'construction',
        count: constructionCount,
      },
      communities: {
        id: 'communities',
        count: constructionCount, // Similar to construction
      },
      openHouses: {
        id: 'openHouses',
        // Estimate: roughly 5-10% of active listings have open houses
        count: Math.max(1, Math.floor(newListingsCount * 0.08)),
      },
      priceReduced: {
        id: 'priceReduced',
        // Estimate: roughly 15-20% of active listings have price reductions
        count: Math.max(1, Math.floor(newListingsCount * 0.18)),
      },
      foreclosures: {
        id: 'foreclosures',
        // Estimate: roughly 1-2% of active listings are foreclosures
        count: Math.max(1, Math.floor(newListingsCount * 0.015)),
      },
    };

    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching property category counts:', error);
    // Return default counts on error
    return NextResponse.json({
      new: { id: 'new', count: 0 },
      sold: { id: 'sold', count: 0 },
      land: { id: 'land', count: 0 },
      construction: { id: 'construction', count: 0 },
      communities: { id: 'communities', count: 0 },
      openHouses: { id: 'openHouses', count: 0 },
      priceReduced: { id: 'priceReduced', count: 0 },
      foreclosures: { id: 'foreclosures', count: 0 },
    });
  }
}

