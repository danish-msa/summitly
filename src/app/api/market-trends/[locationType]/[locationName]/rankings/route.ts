import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RepliersAPI } from '@/lib/api/repliers';
import type { RankingData, RankingOverviewData } from '@/lib/api/repliers/services/analytics';
import { Prisma } from '@prisma/client';

// ISR: Revalidate every 30 days (monthly market data)
export const revalidate = 2592000; // 30 days in seconds

// Valid location types
type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

// List of cities for ranking comparison
const GTA_CITIES = [
  'Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan', 'Richmond Hill',
  'Oakville', 'Burlington', 'Ajax', 'Pickering', 'Whitby', 'Oshawa',
  'Aurora', 'Milton', 'Caledon', 'Newmarket', 'Georgina', 'East Gwillimbury',
  'Halton Hills', 'Orangeville', 'Bradford', 'Innisfil', 'Barrie', 'Hamilton',
  'St. Catharines', 'Niagara Falls', 'Kitchener', 'Waterloo', 'Cambridge', 'Guelph'
];

// Helper to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper to check if data is stale (older than 25 days)
function isStale(lastFetchedAt: Date): boolean {
  const now = new Date();
  const daysSinceFetch = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceFetch > 25;
}

// Helper to clean location name
function cleanLocationName(name: string): string {
  return name
    .replace(/\s+Real\s+Estate$/i, '')
    .replace(/\s+RE$/i, '')
    .trim();
}

// Helper to calculate ranking overview for a specific city from rankings data
function calculateRankingOverview(rankings: RankingData | null, cityName: string): RankingOverviewData {
  if (!rankings || !cityName) {
    return {
      mostExpensive: 0,
      fastestGrowing: 0,
      fastestSelling: 0,
      highestTurnover: 0,
    };
  }

  const cleanCityName = cleanLocationName(cityName).toLowerCase();
  
  // Helper to check if a city matches
  const isCurrentCity = (city: string): boolean => {
    const cleanCity = cleanLocationName(city).toLowerCase();
    return cleanCity === cleanCityName;
  };

  // Find current city's ranks in each category
  const priceRank = rankings.price?.find((r) => isCurrentCity(r.city))?.rank || 0;
  const growthRank = rankings.growth?.find((r) => isCurrentCity(r.city))?.rank || 0;
  const daysRank = rankings.daysOnMarket?.find((r) => isCurrentCity(r.city))?.rank || 0;
  const turnoverRank = rankings.turnover?.find((r) => isCurrentCity(r.city))?.rank || 0;

  return {
    mostExpensive: priceRank,
    fastestGrowing: growthRank,
    fastestSelling: daysRank,
    highestTurnover: turnoverRank,
  };
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

    // Rankings are typically only available for cities
    // For other location types, return empty rankings or city-level rankings
    if (locationType !== 'city') {
      console.log(`[MarketTrends Rankings API] Rankings not available for ${locationType}, returning empty`);
      return NextResponse.json({
        rankings: null,
        overview: null,
        cached: false,
        message: `Rankings are only available for cities, not ${locationType}`,
      });
    }

    const currentMonth = getCurrentMonth();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'; // Force refresh from API

    // Rankings are the same for all cities (comparison data), so we store them once per month
    // Check MarketRankings table (not MarketTrends) - one record per month for all cities
    let marketRankings = null;
    try {
      marketRankings = await prisma.marketRankings.findUnique({
        where: {
          month: currentMonth,
        },
      });
    } catch (dbError: unknown) {
      const error = dbError as { message?: string; code?: string };
      console.error(`[MarketRankings API] Error reading from MarketRankings table:`, {
        error: error.message,
        code: error.code,
        month: currentMonth,
        hint: 'Make sure the MarketRankings table exists in the database. Run supabase_market_rankings_setup.sql',
      });
      // Continue - will try to fetch from API
    }

    // If not forcing refresh, try to get rankings from database first
    // Return database data if it exists, even if stale (only refresh on manual refresh)
    if (!forceRefresh) {
      // If rankings exist in database, calculate overview dynamically for current city
      if (marketRankings?.rankings) {
        const isDataStale = isStale(marketRankings.lastFetchedAt);
        // Prisma returns JsonValue, so we need to validate and cast it
        const rankingsData = marketRankings.rankings as unknown as RankingData;
        const overview = calculateRankingOverview(rankingsData, cleanName);
        console.log(`[MarketRankings API] Serving database rankings for month ${currentMonth}${isDataStale ? ' (stale, but using cached)' : ''}`);
        return NextResponse.json({
          rankings: rankingsData,
          overview: overview,
          cached: true,
          stale: isDataStale,
          lastFetchedAt: marketRankings.lastFetchedAt,
        });
      }
      
      // If no rankings in database, fetch from API (first time load)
      console.log(`[MarketRankings API] No database rankings found for month ${currentMonth}, fetching from API`);
    } else {
      console.log(`[MarketRankings API] Force refresh requested for month ${currentMonth}`);
    }

    // Rankings are missing or refresh requested - fetch from API
    console.log(`[MarketRankings API] Fetching fresh rankings for month ${currentMonth}`);
    
    // Ensure current city is in the list
    const citiesToCompare = [...GTA_CITIES];
    if (!citiesToCompare.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
      citiesToCompare.push(cleanName);
    }

    // Fetch rankings from API (this can take 60+ seconds due to many API calls)
    // Use a longer timeout (120 seconds) to allow the request to complete
    // Note: getCityRankings now returns null for overview - we calculate it dynamically
    let rankingsResult: { rankings: RankingData; overview: RankingOverviewData } | null = null;
    let _fetchError: Error | null = null;
    
    try {
      const rankingsPromise = RepliersAPI.analytics.getCityRankings(
        citiesToCompare,
        cleanName
      );
      
      // Use a longer timeout (120 seconds) since rankings fetch takes 60+ seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Rankings fetch timeout after 120 seconds'));
        }, 120000); // 120 second timeout
      });

      const raceResult = await Promise.race([rankingsPromise, timeoutPromise]);
      rankingsResult = raceResult as { rankings: RankingData; overview: RankingOverviewData };
      
      // Calculate overview dynamically for current city (overview from API is null)
      if (rankingsResult?.rankings) {
        // rankingsResult.rankings is already RankingData from the type definition
        rankingsResult.overview = calculateRankingOverview(rankingsResult.rankings, cleanName);
      }
    } catch (error: unknown) {
      _fetchError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MarketRankings API] Error fetching rankings:`, {
        error: errorMessage,
        month: currentMonth,
      });
      
      // If timeout or error, try to return stale data if available
      if (marketRankings?.rankings) {
        // Prisma returns JsonValue, so we need to validate and cast it
        const rankingsData = marketRankings.rankings as unknown as RankingData;
        const overview = calculateRankingOverview(rankingsData, cleanName);
        console.log(`[MarketRankings API] API fetch failed/timeout, returning stale database data for month ${currentMonth}`);
        return NextResponse.json({
          rankings: rankingsData,
          overview: overview,
          cached: true,
          stale: true,
          lastFetchedAt: marketRankings.lastFetchedAt,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch rankings data', rankings: null, overview: null },
        { status: 500 }
      );
    }

    if (!rankingsResult) {
      // Try to return stale data if available
      if (marketRankings?.rankings) {
        // Prisma returns JsonValue, so we need to validate and cast it
        const rankingsData = marketRankings.rankings as unknown as RankingData;
        const overview = calculateRankingOverview(rankingsData, cleanName);
        console.log(`[MarketRankings API] No rankings result, returning stale database data for month ${currentMonth}`);
        return NextResponse.json({
          rankings: rankingsData,
          overview: overview,
          cached: true,
          stale: true,
          lastFetchedAt: marketRankings.lastFetchedAt,
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch rankings data', rankings: null, overview: null },
        { status: 500 }
      );
    }

    // Validate rankings data before storing - prevent storing empty/null data
    const hasValidRankings = rankingsResult.rankings && 
      rankingsResult.rankings.price && 
      Array.isArray(rankingsResult.rankings.price) && 
      rankingsResult.rankings.price.length > 0;

    if (!hasValidRankings) {
      console.error(`[MarketRankings API] Invalid rankings data - not storing empty data`, {
        hasRankings: !!rankingsResult.rankings,
        hasPriceData: rankingsResult.rankings?.price?.length > 0,
        month: currentMonth,
      });
      
      // Try to return stale data if available instead of storing empty data
      if (marketRankings?.rankings) {
        // Prisma returns JsonValue, so we need to validate and cast it
        const rankingsData = marketRankings.rankings as unknown as RankingData;
        const overview = calculateRankingOverview(rankingsData, cleanName);
        console.log(`[MarketRankings API] Returning stale database data instead of storing empty data for month ${currentMonth}`);
        return NextResponse.json({
          rankings: rankingsData,
          overview: overview,
          cached: true,
          stale: true,
          lastFetchedAt: marketRankings.lastFetchedAt,
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid rankings data received from API', rankings: null, overview: null },
        { status: 500 }
      );
    }

    // Store rankings in MarketRankings table (one record per month, shared by all cities)
    // Note: We don't store rankingOverview anymore - it's calculated dynamically per city
    // Only store if data is valid
    try {
      const savedRankings = await prisma.marketRankings.upsert({
        where: {
          month: currentMonth,
        },
        update: {
          rankings: rankingsResult.rankings as unknown as Prisma.InputJsonValue,
          rankingOverview: {} as Prisma.InputJsonValue, // Not used - calculated dynamically per city
          lastFetchedAt: new Date(),
        },
        create: {
          month: currentMonth,
          rankings: rankingsResult.rankings as unknown as Prisma.InputJsonValue,
          rankingOverview: {} as Prisma.InputJsonValue, // Not used - calculated dynamically per city
          lastFetchedAt: new Date(),
        },
      });
      console.log(`[MarketRankings API] Successfully saved rankings for month ${currentMonth}`, {
        id: savedRankings.id,
        month: savedRankings.month,
        hasRankings: !!savedRankings.rankings,
        priceDataCount: Array.isArray((savedRankings.rankings as { price?: unknown[] })?.price) 
          ? (savedRankings.rankings as { price: unknown[] }).price.length 
          : 0,
      });
    } catch (dbError: unknown) {
      const error = dbError as { message?: string; code?: string; stack?: string };
      console.error(`[MarketRankings API] Error saving rankings to database:`, {
        error: error.message,
        code: error.code,
        month: currentMonth,
        stack: error.stack,
      });
      // Continue to return the data even if save fails
    }

    // Calculate overview for current city dynamically
    // rankingsResult.rankings is already RankingData from the type definition (line 167)
    const overview = calculateRankingOverview(rankingsResult.rankings, cleanName);

    return NextResponse.json({
      rankings: rankingsResult.rankings,
      overview: overview,
      cached: false,
      lastFetchedAt: new Date(),
    });
  } catch (error) {
    console.error('[MarketRankings API] Error:', error);
    
    // Try to return stale data from database
    try {
      const resolvedParams = await params;
      const _locationType = resolvedParams.locationType as LocationType;
      const locationName = decodeURIComponent(resolvedParams.locationName);
      const cleanName = cleanLocationName(locationName);
      const currentMonth = getCurrentMonth();

      const staleData = await prisma.marketRankings.findUnique({
        where: {
          month: currentMonth,
        },
      });

      if (staleData?.rankings) {
        // Prisma returns JsonValue, so we need to validate and cast it
        const rankingsData = staleData.rankings as unknown as RankingData;
        const overview = calculateRankingOverview(rankingsData, cleanName);
        return NextResponse.json({
          rankings: rankingsData,
          overview: overview,
          cached: true,
          stale: true,
          lastFetchedAt: staleData.lastFetchedAt,
        });
      }
    } catch (dbError) {
      console.error('[MarketRankings API] Database fallback error:', dbError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch rankings data' },
      { status: 500 }
    );
  }
}

