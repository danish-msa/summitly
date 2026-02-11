import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RepliersAPI } from '@/lib/api/repliers';
import { getDateRanges } from '@/components/Location/trends/utils/helpers';
import type { AnalyticsParams } from '@/lib/api/repliers/services/analytics';
import { Prisma } from '@prisma/client';

// ISR: Revalidate every 30 days (monthly market data)
export const revalidate = 2592000; // 30 days in seconds

// Valid location types
type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

// Helper to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper to check if data is stale (older than 25 days)
function isStale(lastFetchedAt: Date): boolean {
  const now = new Date();
  const daysSinceFetch = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceFetch > 25; // Consider stale if older than 25 days
}

// Helper to clean location name
function cleanLocationName(name: string): string {
  return name
    .replace(/\s+Real\s+Estate$/i, '')
    .replace(/\s+RE$/i, '')
    .trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationType: string; locationName: string }> }
) {
  try {
    // Next.js 15 requires awaiting params
    const resolvedParams = await params;
    const locationType = resolvedParams.locationType as LocationType;
    const locationName = decodeURIComponent(resolvedParams.locationName);
    const cleanName = cleanLocationName(locationName);

    // Validate location type
    const validTypes: LocationType[] = ['city', 'area', 'neighbourhood', 'intersection', 'community'];
    if (!validTypes.includes(locationType)) {
      return NextResponse.json(
        { error: `Invalid location type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get parent location info and filters from query params
    const searchParams = request.nextUrl.searchParams;
    const parentCity = searchParams.get('parentCity') || null;
    const parentArea = searchParams.get('parentArea') || null;
    const parentNeighbourhood = searchParams.get('parentNeighbourhood') || null;
    const propertyType = searchParams.get('propertyType') || null;
    const community = searchParams.get('community') || null;
    const yearsParam = searchParams.get('years');
    const years = yearsParam ? parseInt(yearsParam, 10) : 2; // Default to 2 years
    const forceRefresh = searchParams.get('refresh') === 'true'; // Force refresh from API

    const currentMonth = getCurrentMonth();
    // Calculate date ranges based on selected years (defaults to 2 years if not specified)
    const dateRanges = getDateRanges(years);

    // Only skip cache for propertyType/community filters (years is now cached separately)
    const hasFilters = propertyType || community;
    const shouldUseCache = !forceRefresh && !hasFilters;

    // If not forcing refresh and no property/community filters, try to get data from database first
    // Years filter is now cached separately, so we can use cache even with different year ranges
    if (shouldUseCache) {
      const marketTrends = await prisma.marketTrends.findUnique({
        where: {
          locationType_locationName_month_years: {
            locationType: locationType,
            locationName: cleanName,
            month: currentMonth,
            years: years,
          },
        },
      });

      // If data exists in database, return it (even if stale - no auto-refresh)
      if (marketTrends) {
        const isDataStale = isStale(marketTrends.lastFetchedAt);
        console.log(`[MarketTrends API] Serving database data for ${locationType}:${cleanName} (${years} years)${isDataStale ? ' (stale, but using cached)' : ''}`);
        return NextResponse.json({
          priceOverview: marketTrends.priceOverview,
          averageSoldPrice: marketTrends.averageSoldPrice,
          averageSoldPriceByType: marketTrends.averageSoldPriceByType,
          salesVolumeByType: marketTrends.salesVolumeByType,
          priceByBedrooms: marketTrends.priceByBedrooms,
          inventoryOverview: marketTrends.inventoryOverview,
          newClosedAvailable: marketTrends.newClosedAvailable,
          daysOnMarket: marketTrends.daysOnMarket,
          medianListingVsSoldPrice: marketTrends.medianListingVsSoldPrice,
          // Note: Rankings are stored in separate MarketRankings table (one record per month, shared by all cities)
          // Fetch via /api/market-trends/[locationType]/[locationName]/rankings
          cached: true,
          stale: isDataStale,
          lastFetchedAt: marketTrends.lastFetchedAt,
        });
      }
      
      // If no data in database, fetch from API (first time load)
      console.log(`[MarketTrends API] No database data found for ${locationType}:${cleanName} (${years} years), fetching from API`);
    } else {
      console.log(`[MarketTrends API] Force refresh or filters applied for ${locationType}:${cleanName} (${years} years)`);
    }

    // Data is missing or stale - fetch from API
    console.log(`[MarketTrends API] Fetching fresh data for ${locationType}:${cleanName} (${years} years)`);
    
    // Build analytics params based on location type
    const analyticsParams: AnalyticsParams = {};
    
    if (locationType === 'city') {
      analyticsParams.city = cleanName;
    } else if (locationType === 'area') {
      analyticsParams.area = cleanName;
      if (parentCity) analyticsParams.city = parentCity;
    } else if (locationType === 'neighbourhood') {
      analyticsParams.neighborhood = cleanName;
      if (parentCity) analyticsParams.city = parentCity;
      if (parentArea) analyticsParams.area = parentArea;
    } else if (locationType === 'intersection') {
      // Intersections might need special handling - using neighborhood for now
      analyticsParams.neighborhood = cleanName;
      if (parentCity) analyticsParams.city = parentCity;
      if (parentArea) analyticsParams.area = parentArea;
      if (parentNeighbourhood) analyticsParams.neighborhood = parentNeighbourhood;
    } else if (locationType === 'community') {
      // Communities might need special handling - using neighborhood for now
      analyticsParams.neighborhood = cleanName;
      if (parentCity) analyticsParams.city = parentCity;
      if (parentArea) analyticsParams.area = parentArea;
      if (parentNeighbourhood) analyticsParams.neighborhood = parentNeighbourhood;
    }

    // Apply filters
    if (propertyType) {
      // Map property type to Repliers API format
      const propertyTypeMap: Record<string, string> = {
        'Detached': 'Detached',
        'Condo Apartment': 'Condo Apartment',
        'Condo Townhouse': 'Condo Townhouse',
        'house': 'Detached',
        'condo': 'Condo Apartment',
        'townhouse': 'Condo Townhouse',
      };
      analyticsParams.propertyType = propertyTypeMap[propertyType] || propertyType;
    }
    
    if (community) {
      // If community filter is set, override neighborhood
      analyticsParams.neighborhood = community;
    }

    // Calculate date range based on years filter
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - years);
    analyticsParams.minSoldDate = startDate.toISOString().split('T')[0];
    analyticsParams.maxSoldDate = now.toISOString().split('T')[0];

    // Fetch all market trends data in parallel
    const [
      priceOverview,
      averageSoldPrice,
      averageSoldPriceByType,
      salesVolumeByType,
      inventoryOverview,
      newClosedAvailable,
      daysOnMarket,
      medianListingVsSoldPrice,
    ] = await Promise.all([
      RepliersAPI.analytics.getPriceOverview(analyticsParams, dateRanges),
      RepliersAPI.analytics.getAverageSoldPriceData(analyticsParams),
      RepliersAPI.analytics.getAverageSoldPriceByType(analyticsParams),
      RepliersAPI.analytics.getSalesVolumeByType(analyticsParams),
      RepliersAPI.analytics.getInventoryOverview(analyticsParams, dateRanges),
      RepliersAPI.analytics.getNewClosedAvailableData(analyticsParams, dateRanges),
      RepliersAPI.analytics.getDaysOnMarketData(analyticsParams),
      RepliersAPI.analytics.getMedianListingVsSoldPriceData(analyticsParams),
    ]);

    // Note: Rankings are stored in separate MarketRankings table (one record per month, shared by all cities)
    // They can be fetched separately via /api/market-trends/[locationType]/[locationName]/rankings

    const marketTrendsData = {
      priceOverview,
      averageSoldPrice,
      averageSoldPriceByType,
      salesVolumeByType,
      priceByBedrooms: null, // Not implemented yet
      inventoryOverview,
      newClosedAvailable,
      daysOnMarket,
      medianListingVsSoldPrice,
      // Rankings are not included here - they're in MarketRankings table
    };

    // Store in database if no property/community filters are applied
    // Years filter is now cached separately, so we store data for each year range
    if (!hasFilters) {
      try {
        await prisma.marketTrends.upsert({
          where: {
            locationType_locationName_month_years: {
              locationType: locationType,
              locationName: cleanName,
              month: currentMonth,
              years: years,
            },
          },
          update: {
            priceOverview: marketTrendsData.priceOverview as unknown as Prisma.InputJsonValue,
            averageSoldPrice: marketTrendsData.averageSoldPrice as unknown as Prisma.InputJsonValue,
            averageSoldPriceByType: marketTrendsData.averageSoldPriceByType as unknown as Prisma.InputJsonValue,
            salesVolumeByType: marketTrendsData.salesVolumeByType as unknown as Prisma.InputJsonValue,
            priceByBedrooms: marketTrendsData.priceByBedrooms as unknown as Prisma.InputJsonValue,
            inventoryOverview: marketTrendsData.inventoryOverview as unknown as Prisma.InputJsonValue,
            newClosedAvailable: marketTrendsData.newClosedAvailable as unknown as Prisma.InputJsonValue,
            daysOnMarket: marketTrendsData.daysOnMarket as unknown as Prisma.InputJsonValue,
            medianListingVsSoldPrice: marketTrendsData.medianListingVsSoldPrice as unknown as Prisma.InputJsonValue,
            parentCity: parentCity || null,
            parentArea: parentArea || null,
            parentNeighbourhood: parentNeighbourhood || null,
            years: years,
            lastFetchedAt: new Date(),
          },
          create: {
            locationType: locationType,
            locationName: cleanName,
            month: currentMonth,
            years: years,
            parentCity: parentCity || null,
            parentArea: parentArea || null,
            parentNeighbourhood: parentNeighbourhood || null,
            priceOverview: marketTrendsData.priceOverview as unknown as Prisma.InputJsonValue,
            averageSoldPrice: marketTrendsData.averageSoldPrice as unknown as Prisma.InputJsonValue,
            averageSoldPriceByType: marketTrendsData.averageSoldPriceByType as unknown as Prisma.InputJsonValue,
            salesVolumeByType: marketTrendsData.salesVolumeByType as unknown as Prisma.InputJsonValue,
            priceByBedrooms: marketTrendsData.priceByBedrooms as unknown as Prisma.InputJsonValue,
            inventoryOverview: marketTrendsData.inventoryOverview as unknown as Prisma.InputJsonValue,
            newClosedAvailable: marketTrendsData.newClosedAvailable as unknown as Prisma.InputJsonValue,
            daysOnMarket: marketTrendsData.daysOnMarket as unknown as Prisma.InputJsonValue,
            medianListingVsSoldPrice: marketTrendsData.medianListingVsSoldPrice as unknown as Prisma.InputJsonValue,
            lastFetchedAt: new Date(),
          },
        });
        console.log(`[MarketTrends API] Cached data for ${locationType}:${cleanName} with ${years} years of history`);
      } catch (dbError: unknown) {
        // If constraint error, migration might not be run yet - log warning but continue
        const error = dbError as { code?: string; message?: string };
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
          console.warn(`[MarketTrends API] Database constraint error - migration may not be applied yet. Error: ${error.message}`);
          console.warn(`[MarketTrends API] Please run the migration: prisma/migrations/add_years_to_market_trends.sql`);
        } else {
          // Re-throw if it's a different error
          throw dbError;
        }
      }
    }

    return NextResponse.json({
      ...marketTrendsData,
      cached: false,
      lastFetchedAt: new Date(),
    });
  } catch (error) {
    console.error('[MarketTrends API] Error:', error);
    
    // Try to return stale data from database if available
    try {
      const resolvedParams = await params;
      const locationType = resolvedParams.locationType as LocationType;
      const locationName = decodeURIComponent(resolvedParams.locationName);
      const cleanName = cleanLocationName(locationName);
      const currentMonth = getCurrentMonth();
      
      // Re-extract years from request in case we're in error handler
      const searchParams = request.nextUrl.searchParams;
      const yearsParam = searchParams.get('years');
      const years = yearsParam ? parseInt(yearsParam, 10) : 2;

      // Use the new constraint with years
      const staleData = await prisma.marketTrends.findUnique({
        where: {
          locationType_locationName_month_years: {
            locationType: locationType,
            locationName: cleanName,
            month: currentMonth,
            years: years,
          },
        },
      });

      if (staleData) {
        console.log(`[MarketTrends API] Returning stale data as fallback for ${locationType}:${cleanName}`);
        return NextResponse.json({
          priceOverview: staleData.priceOverview,
          averageSoldPrice: staleData.averageSoldPrice,
          averageSoldPriceByType: staleData.averageSoldPriceByType,
          salesVolumeByType: staleData.salesVolumeByType,
          priceByBedrooms: staleData.priceByBedrooms,
          inventoryOverview: staleData.inventoryOverview,
          newClosedAvailable: staleData.newClosedAvailable,
          daysOnMarket: staleData.daysOnMarket,
          // Note: Rankings are stored in separate MarketRankings table
          // Fetch via /api/market-trends/[locationType]/[locationName]/rankings
          cached: true,
          stale: true,
          lastFetchedAt: staleData.lastFetchedAt,
        });
      }
    } catch (dbError) {
      console.error('[MarketTrends API] Database fallback error:', dbError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch market trends data' },
      { status: 500 }
    );
  }
}

