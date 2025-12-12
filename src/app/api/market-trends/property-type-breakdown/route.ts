import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RepliersAPI } from '@/lib/api/repliers';
import { Prisma } from '@prisma/client';
import type { StatisticsRequest } from '@/lib/api/repliers/services/analytics';

// Revalidate every 30 days (monthly data) - 2592000 seconds
export const revalidate = 2592000;

interface PropertyTypeBreakdownData {
  propertyType: string;
  avgPrice: number;
  medianPrice: number;
  avgPriceOneMonthChange: number;
  avgPriceOneYearChange: number;
  transactions: number;
  transactionsOneMonthChange: number;
  transactionsOneYearChange: number;
}

// Check if data is stale (older than 25 days)
function isStale(lastFetchedAt: Date): boolean {
  const now = new Date();
  const daysSinceFetch = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceFetch > 25;
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneMonthAgoDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const oneMonthAgoEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    const oneYearAgoDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const oneYearAgoEndDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
    
    // Format month as "YYYY-MM"
    const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Check for refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const city = searchParams.get('city') || null;
    
    // Check database for cached data
    const cacheKey = city ? `${currentMonth}-${city}` : currentMonth;
    const cachedBreakdown = await prisma.propertyTypeBreakdown.findUnique({
      where: { month: cacheKey },
    });

    // If we have cached data and it's not stale, and not forcing refresh, return it
    if (cachedBreakdown && !isStale(cachedBreakdown.lastFetchedAt) && !forceRefresh) {
      console.log(`[PropertyTypeBreakdown API] Serving cached breakdown for ${cacheKey}`);
      return NextResponse.json({
        month: currentMonth,
        breakdownData: cachedBreakdown.breakdownData as unknown as PropertyTypeBreakdownData[],
        cached: true,
      });
    }

    // Fetch fresh data from API
    console.log(`[PropertyTypeBreakdown API] Fetching fresh breakdown data for ${cacheKey}`);
    
    const currentMonthStart = currentMonthDate.toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const oneMonthAgoStart = oneMonthAgoDate.toISOString().split('T')[0];
    const oneMonthAgoEnd = oneMonthAgoEndDate.toISOString().split('T')[0];
    const oneYearAgoStart = oneYearAgoDate.toISOString().split('T')[0];
    const oneYearAgoEnd = oneYearAgoEndDate.toISOString().split('T')[0];

    // Build base request params
    const baseParams: StatisticsRequest = {
      statistics: ['avg-soldPrice', 'med-soldPrice', 'cnt-closed'],
      status: 'U',
      lastStatus: 'Sld',
      aggregateStatistics: true,
      aggregates: 'details.propertyType',
      listings: false,
    };

    if (city) {
      baseParams.city = city;
    }

    // Fetch current month, one month ago, and one year ago data
    const [currentStats, oneMonthAgoStats, oneYearAgoStats] = await Promise.all([
      RepliersAPI.analytics.getStatistics({
        ...baseParams,
        minSoldDate: currentMonthStart,
        maxSoldDate: currentMonthEnd,
      } as StatisticsRequest),
      RepliersAPI.analytics.getStatistics({
        ...baseParams,
        minSoldDate: oneMonthAgoStart,
        maxSoldDate: oneMonthAgoEnd,
      } as StatisticsRequest),
      RepliersAPI.analytics.getStatistics({
        ...baseParams,
        minSoldDate: oneYearAgoStart,
        maxSoldDate: oneYearAgoEnd,
      } as StatisticsRequest),
    ]);

    if (!currentStats || !oneMonthAgoStats || !oneYearAgoStats) {
      // If API fails, try to return stale data if available
      if (cachedBreakdown) {
        console.log(`[PropertyTypeBreakdown API] API fetch failed, returning stale cached data for ${cacheKey}`);
        return NextResponse.json({
          month: currentMonth,
          breakdownData: cachedBreakdown.breakdownData as unknown as PropertyTypeBreakdownData[],
          cached: true,
          stale: true,
        });
      }
      throw new Error('Failed to fetch property type breakdown data from API');
    }

    // Process current stats
    const currentAggregates = (currentStats?.statistics?.soldPrice?.aggregates as {
      details?: { propertyType?: Record<string, { avg?: number; med?: number }> }
    })?.details?.propertyType;

    const currentClosedAggregates = (currentStats?.statistics?.closed?.aggregates as {
      details?: { propertyType?: Record<string, number> }
    })?.details?.propertyType ||
    (currentStats?.statistics?.closed?.yr?.[new Date().getFullYear().toString()]?.aggregates as {
      details?: { propertyType?: Record<string, { count?: number }> }
    })?.details?.propertyType;

    // Process one month ago stats
    const oneMonthAgoAggregates = (oneMonthAgoStats?.statistics?.soldPrice?.aggregates as {
      details?: { propertyType?: Record<string, { avg?: number; med?: number }> }
    })?.details?.propertyType;

    const oneMonthAgoClosedAggregates = (oneMonthAgoStats?.statistics?.closed?.aggregates as {
      details?: { propertyType?: Record<string, number> }
    })?.details?.propertyType ||
    (oneMonthAgoStats?.statistics?.closed?.yr?.[new Date(now.getFullYear(), now.getMonth() - 1).getFullYear().toString()]?.aggregates as {
      details?: { propertyType?: Record<string, { count?: number }> }
    })?.details?.propertyType;

    // Process one year ago stats
    const oneYearAgoAggregates = (oneYearAgoStats?.statistics?.soldPrice?.aggregates as {
      details?: { propertyType?: Record<string, { avg?: number; med?: number }> }
    })?.details?.propertyType;

    const oneYearAgoClosedAggregates = (oneYearAgoStats?.statistics?.closed?.aggregates as {
      details?: { propertyType?: Record<string, number> }
    })?.details?.propertyType ||
    (oneYearAgoStats?.statistics?.closed?.yr?.[(now.getFullYear() - 1).toString()]?.aggregates as {
      details?: { propertyType?: Record<string, { count?: number }> }
    })?.details?.propertyType;

    const propertyTypeDataMap = new Map<string, PropertyTypeBreakdownData>();

    // Process current month data
    if (currentAggregates && typeof currentAggregates === 'object') {
      Object.keys(currentAggregates).forEach((propertyType) => {
        const currentData = currentAggregates[propertyType];
        const avgPrice = Math.round(currentData?.avg || 0);
        const medPrice = Math.round(currentData?.med || 0);
        
        // Handle both number and object formats for closed aggregates
        let transactions = 0;
        const closedData = currentClosedAggregates?.[propertyType];
        if (typeof closedData === 'number') {
          transactions = closedData;
        } else if (closedData && typeof closedData === 'object' && 'count' in closedData) {
          transactions = (closedData as { count?: number }).count || 0;
        }

        // Get one month ago data
        const oneMonthAgoData = oneMonthAgoAggregates?.[propertyType];
        const oneMonthAgoAvg = oneMonthAgoData?.avg || 0;
        let oneMonthAgoTransactions = 0;
        const oneMonthAgoClosedData = oneMonthAgoClosedAggregates?.[propertyType];
        if (typeof oneMonthAgoClosedData === 'number') {
          oneMonthAgoTransactions = oneMonthAgoClosedData;
        } else if (oneMonthAgoClosedData && typeof oneMonthAgoClosedData === 'object' && 'count' in oneMonthAgoClosedData) {
          oneMonthAgoTransactions = (oneMonthAgoClosedData as { count?: number }).count || 0;
        }

        // Get one year ago data
        const oneYearAgoData = oneYearAgoAggregates?.[propertyType];
        const oneYearAgoAvg = oneYearAgoData?.avg || 0;
        let oneYearAgoTransactions = 0;
        const oneYearAgoClosedData = oneYearAgoClosedAggregates?.[propertyType];
        if (typeof oneYearAgoClosedData === 'number') {
          oneYearAgoTransactions = oneYearAgoClosedData;
        } else if (oneYearAgoClosedData && typeof oneYearAgoClosedData === 'object' && 'count' in oneYearAgoClosedData) {
          oneYearAgoTransactions = (oneYearAgoClosedData as { count?: number }).count || 0;
        }

        // Calculate percentage changes
        const avgPriceOneMonthChange = oneMonthAgoAvg > 0 
          ? ((avgPrice - oneMonthAgoAvg) / oneMonthAgoAvg) * 100 
          : 0;
        const avgPriceOneYearChange = oneYearAgoAvg > 0 
          ? ((avgPrice - oneYearAgoAvg) / oneYearAgoAvg) * 100 
          : 0;
        const transactionsOneMonthChange = oneMonthAgoTransactions > 0
          ? ((transactions - oneMonthAgoTransactions) / oneMonthAgoTransactions) * 100
          : 0;
        const transactionsOneYearChange = oneYearAgoTransactions > 0
          ? ((transactions - oneYearAgoTransactions) / oneYearAgoTransactions) * 100
          : 0;

        if (avgPrice > 0 && transactions > 0) {
          propertyTypeDataMap.set(propertyType, {
            propertyType,
            avgPrice,
            medianPrice: medPrice,
            avgPriceOneMonthChange,
            avgPriceOneYearChange,
            transactions,
            transactionsOneMonthChange,
            transactionsOneYearChange,
          });
        }
      });
    }

    // Convert to array and sort by average price (descending)
    const breakdownData: PropertyTypeBreakdownData[] = Array.from(propertyTypeDataMap.values())
      .filter(data => data.avgPrice > 0 && data.transactions > 0)
      .sort((a, b) => b.avgPrice - a.avgPrice);

    // Store in database
    try {
      await prisma.propertyTypeBreakdown.upsert({
        where: { month: cacheKey },
        update: {
          breakdownData: breakdownData as unknown as Prisma.InputJsonValue,
          lastFetchedAt: new Date(),
        },
        create: {
          month: cacheKey,
          breakdownData: breakdownData as unknown as Prisma.InputJsonValue,
          lastFetchedAt: new Date(),
        },
      });
      console.log(`[PropertyTypeBreakdown API] Cached breakdown data for ${cacheKey}`);
    } catch (dbError) {
      console.error('[PropertyTypeBreakdown API] Database error:', dbError);
      // Continue even if database write fails
    }

    return NextResponse.json({
      month: currentMonth,
      breakdownData,
      cached: false,
    });
  } catch (error) {
    console.error('[PropertyTypeBreakdown API] Error:', error);
    
    // Try to return stale data if available
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || null;
    const cacheKey = city ? `${currentMonth}-${city}` : currentMonth;
    
    try {
      const staleData = await prisma.propertyTypeBreakdown.findUnique({
        where: { month: cacheKey },
      });
      
      if (staleData) {
        console.log(`[PropertyTypeBreakdown API] Error occurred, returning stale cached data for ${cacheKey}`);
        return NextResponse.json({
          month: currentMonth,
          breakdownData: staleData.breakdownData as unknown as PropertyTypeBreakdownData[],
          cached: true,
          stale: true,
        });
      }
    } catch (fallbackError) {
      console.error('[PropertyTypeBreakdown API] Fallback error:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch property type breakdown data' },
      { status: 500 }
    );
  }
}

