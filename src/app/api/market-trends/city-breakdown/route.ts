import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RepliersAPI } from '@/lib/api/repliers';
import { Prisma } from '@prisma/client';
import type { StatisticsRequest } from '@/lib/api/repliers/services/analytics';

// Revalidate every 30 days (monthly data) - 2592000 seconds
export const revalidate = 2592000;

interface CityBreakdownData {
  city: string;
  averagePrice: number;
  medianPrice: number;
  averageOneYearChange: number; // 1-year change for average prices
  medianOneYearChange: number; // 1-year change for median prices
  totalTransactions: number;
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
    const oneYearAgoDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const oneYearAgoEndDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
    
    // Format month as "YYYY-MM"
    const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Check for refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Check database for cached data
    const cachedBreakdown = await prisma.cityBreakdown.findUnique({
      where: { month: currentMonth },
    });

    // If we have cached data and it's not stale, and not forcing refresh, return it
    if (cachedBreakdown && !isStale(cachedBreakdown.lastFetchedAt) && !forceRefresh) {
      console.log(`[CityBreakdown API] Serving cached breakdown for month ${currentMonth}`);
      return NextResponse.json({
        month: currentMonth,
        breakdownData: cachedBreakdown.breakdownData as CityBreakdownData[],
        cached: true,
      });
    }

    // Fetch fresh data from API
    console.log(`[CityBreakdown API] Fetching fresh breakdown data for month ${currentMonth}`);
    
    const currentMonthStart = currentMonthDate.toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const historicalStart = oneYearAgoDate.toISOString().split('T')[0];
    const historicalEnd = oneYearAgoEndDate.toISOString().split('T')[0];

    const [currentStats, historicalStats] = await Promise.all([
      RepliersAPI.analytics.getStatistics({
        statistics: ['avg-soldPrice', 'med-soldPrice', 'cnt-closed'],
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: currentMonthStart,
        maxSoldDate: currentMonthEnd,
        aggregateStatistics: true,
        aggregates: 'address.city',
        listings: false,
      } as StatisticsRequest),
      RepliersAPI.analytics.getStatistics({
        statistics: ['avg-soldPrice', 'med-soldPrice'],
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: historicalStart,
        maxSoldDate: historicalEnd,
        aggregateStatistics: true,
        aggregates: 'address.city',
        listings: false,
      } as StatisticsRequest),
    ]);

    if (!currentStats || !historicalStats) {
      // If API fails, try to return stale data if available
      if (cachedBreakdown) {
        console.log(`[CityBreakdown API] API fetch failed, returning stale cached data for month ${currentMonth}`);
        return NextResponse.json({
          month: currentMonth,
          breakdownData: cachedBreakdown.breakdownData as CityBreakdownData[],
          cached: true,
          stale: true,
        });
      }
      throw new Error('Failed to fetch city breakdown data from API');
    }

    // Process current stats
    const currentSoldPriceAggregates = (currentStats?.statistics?.soldPrice?.aggregates as { 
      address?: { city?: Record<string, { avg?: number; med?: number }> } 
    })?.address?.city;
    
    const currentClosedAggregates = (currentStats?.statistics?.closed?.aggregates as {
      address?: { city?: Record<string, number> }
    })?.address?.city || 
    (currentStats?.statistics?.closed?.yr?.[new Date().getFullYear().toString()]?.aggregates as {
      address?: { city?: Record<string, { count?: number }> }
    })?.address?.city;

    // Process historical stats
    const historicalSoldPriceAggregates = (historicalStats?.statistics?.soldPrice?.aggregates as { 
      address?: { city?: Record<string, { avg?: number; med?: number }> } 
    })?.address?.city;

    const cityDataMap = new Map<string, CityBreakdownData>();

    // Process current month data
    if (currentSoldPriceAggregates && typeof currentSoldPriceAggregates === 'object') {
      Object.keys(currentSoldPriceAggregates).forEach((city) => {
        const cityData = currentSoldPriceAggregates[city];
        const avgPrice = Math.round(cityData?.avg || 0);
        const medPrice = Math.round(cityData?.med || 0);
        
        // Handle both number and object formats for closed aggregates
        let transactions = 0;
        const closedData = currentClosedAggregates?.[city];
        if (typeof closedData === 'number') {
          transactions = closedData;
        } else if (closedData && typeof closedData === 'object' && 'count' in closedData) {
          transactions = (closedData as { count?: number }).count || 0;
        }

        // Get historical prices for 1-year change calculation
        const historicalData = historicalSoldPriceAggregates?.[city];
        const historicalAvg = historicalData?.avg || 0;
        const historicalMed = historicalData?.med || 0;

        // Calculate 1-year change percentages for both average and median
        const avgOneYearChange = historicalAvg > 0 
          ? ((avgPrice - historicalAvg) / historicalAvg) * 100 
          : 0;
        const medOneYearChange = historicalMed > 0 
          ? ((medPrice - historicalMed) / historicalMed) * 100 
          : 0;

        if (avgPrice > 0 && transactions > 0) {
          cityDataMap.set(city, {
            city,
            averagePrice: avgPrice,
            medianPrice: medPrice,
            averageOneYearChange: avgOneYearChange,
            medianOneYearChange: medOneYearChange,
            totalTransactions: transactions,
          });
        }
      });
    }

    // Convert to array and sort by average price (descending)
    const breakdownData: CityBreakdownData[] = Array.from(cityDataMap.values())
      .filter(data => data.averagePrice > 0 && data.totalTransactions > 0)
      .sort((a, b) => b.averagePrice - a.averagePrice);

    // Store in database
    try {
      await prisma.cityBreakdown.upsert({
        where: { month: currentMonth },
        update: {
          breakdownData: breakdownData as Prisma.InputJsonValue,
          lastFetchedAt: new Date(),
        },
        create: {
          month: currentMonth,
          breakdownData: breakdownData as Prisma.InputJsonValue,
          lastFetchedAt: new Date(),
        },
      });
      console.log(`[CityBreakdown API] Cached breakdown data for month ${currentMonth}`);
    } catch (dbError) {
      console.error('[CityBreakdown API] Database error:', dbError);
      // Continue even if database write fails
    }

    return NextResponse.json({
      month: currentMonth,
      breakdownData,
      cached: false,
    });
  } catch (error) {
    console.error('[CityBreakdown API] Error:', error);
    
    // Try to return stale data if available
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      const staleData = await prisma.cityBreakdown.findUnique({
        where: { month: currentMonth },
      });
      
      if (staleData) {
        console.log(`[CityBreakdown API] Error occurred, returning stale cached data for month ${currentMonth}`);
        return NextResponse.json({
          month: currentMonth,
          breakdownData: staleData.breakdownData as CityBreakdownData[],
          cached: true,
          stale: true,
        });
      }
    } catch (fallbackError) {
      console.error('[CityBreakdown API] Fallback error:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch city breakdown data' },
      { status: 500 }
    );
  }
}

