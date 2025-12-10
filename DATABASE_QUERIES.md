# Market Trends Database Queries

## SQL CREATE TABLE (PostgreSQL)

If you need to create the table manually (Prisma migrations handle this automatically):

```sql
-- Create MarketTrends table
CREATE TABLE "MarketTrends" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "priceOverview" JSONB,
    "averageSoldPrice" JSONB,
    "salesVolumeByType" JSONB,
    "priceByBedrooms" JSONB,
    "inventoryOverview" JSONB,
    "newClosedAvailable" JSONB,
    "daysOnMarket" JSONB,
    "rankings" JSONB,
    "rankingOverview" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketTrends_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "MarketTrends_city_month_key" ON "MarketTrends"("city", "month");

-- Create indexes for fast queries
CREATE INDEX "MarketTrends_city_idx" ON "MarketTrends"("city");
CREATE INDEX "MarketTrends_month_idx" ON "MarketTrends"("month");
CREATE INDEX "MarketTrends_city_month_idx" ON "MarketTrends"("city", "month");
CREATE INDEX "MarketTrends_lastFetchedAt_idx" ON "MarketTrends"("lastFetchedAt");
```

## Example SQL Queries

### 1. Get Latest Market Trends for a Location
```sql
SELECT 
    id,
    "locationType",
    "locationName",
    "parentCity",
    "parentArea",
    "parentNeighbourhood",
    month,
    "priceOverview",
    "averageSoldPrice",
    "salesVolumeByType",
    "inventoryOverview",
    "newClosedAvailable",
    "daysOnMarket",
    "rankings",
    "rankingOverview",
    "lastFetchedAt",
    "createdAt",
    "updatedAt"
FROM "MarketTrends"
WHERE "locationType" = 'city'
  AND "locationName" = 'Oakville'
ORDER BY month DESC
LIMIT 1;
```

### 2. Get All Locations with Market Trends Data (by type)
```sql
-- Get all cities
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'city'
ORDER BY "locationName";

-- Get all areas
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'area'
ORDER BY "locationName";

-- Get all neighbourhoods
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'neighbourhood'
ORDER BY "locationName";
```

### 3. Get Market Trends for Multiple Locations (Current Month)
```sql
-- Get all cities for current month
SELECT 
    "locationType",
    "locationName",
    month,
    "priceOverview",
    "inventoryOverview",
    "lastFetchedAt"
FROM "MarketTrends"
WHERE "locationType" = 'city'
  AND month = '2025-01'  -- Replace with current month
ORDER BY "locationName";

-- Get all locations (any type) for current month
SELECT 
    "locationType",
    "locationName",
    "parentCity",
    month,
    "priceOverview",
    "inventoryOverview",
    "lastFetchedAt"
FROM "MarketTrends"
WHERE month = '2025-01'
ORDER BY "locationType", "locationName";
```

### 4. Get Historical Data for a Location (Last 12 Months)
```sql
SELECT 
    month,
    "priceOverview",
    "averageSoldPrice",
    "inventoryOverview",
    "lastFetchedAt"
FROM "MarketTrends"
WHERE "locationType" = 'city'
  AND "locationName" = 'Toronto'
ORDER BY month DESC
LIMIT 12;
```

### 5. Find Stale Data (Older than 25 days)
```sql
SELECT 
    "locationType",
    "locationName",
    month,
    "lastFetchedAt",
    CURRENT_DATE - "lastFetchedAt"::date AS days_old
FROM "MarketTrends"
WHERE "lastFetchedAt" < CURRENT_DATE - INTERVAL '25 days'
ORDER BY "lastFetchedAt" ASC;
```

### 6. Get Average Price from Price Overview (JSON)
```sql
SELECT 
    "locationType",
    "locationName",
    month,
    "priceOverview"->'current'->>'avgPrice' AS current_avg_price,
    "priceOverview"->'current'->>'salesCount' AS current_sales_count,
    "priceOverview"->'current'->>'monthlyChange' AS monthly_change,
    "priceOverview"->'past'->>'avgPrice' AS past_avg_price
FROM "MarketTrends"
WHERE "locationType" = 'city'
  AND "locationName" = 'Oakville'
ORDER BY month DESC
LIMIT 1;
```

### 7. Count Records per Location Type
```sql
-- Count by location type
SELECT 
    "locationType",
    COUNT(*) AS record_count,
    COUNT(DISTINCT "locationName") AS unique_locations,
    MAX(month) AS latest_month,
    MIN(month) AS earliest_month
FROM "MarketTrends"
GROUP BY "locationType"
ORDER BY record_count DESC;

-- Count by location name (within a type)
SELECT 
    "locationType",
    "locationName",
    COUNT(*) AS record_count,
    MAX(month) AS latest_month,
    MIN(month) AS earliest_month
FROM "MarketTrends"
WHERE "locationType" = 'city'
GROUP BY "locationType", "locationName"
ORDER BY record_count DESC;
```

### 8. Get Rankings Data for a City
```sql
SELECT 
    city,
    month,
    "rankingOverview"->>'mostExpensive' AS most_expensive_rank,
    "rankingOverview"->>'fastestGrowing' AS fastest_growing_rank,
    "rankingOverview"->>'fastestSelling' AS fastest_selling_rank,
    "rankingOverview"->>'highestTurnover' AS highest_turnover_rank,
    "lastFetchedAt"
FROM "MarketTrends"
WHERE city = 'Vaughan'
    AND "rankingOverview" IS NOT NULL
ORDER BY month DESC
LIMIT 1;
```

### 9. Delete Old Data (Keep only last 12 months)
```sql
DELETE FROM "MarketTrends"
WHERE month < (
    SELECT TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
);
```

### 10. Update Last Fetched Time (Manual Refresh)
```sql
UPDATE "MarketTrends"
SET "lastFetchedAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE city = 'Oakville' 
    AND month = '2025-01';  -- Replace with current month
```

## Prisma Queries (TypeScript)

### 1. Get Latest Market Trends for a Location
```typescript
import { prisma } from '@/lib/prisma';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

const getMarketTrends = async (
  locationType: LocationType,
  locationName: string
) => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  return await prisma.marketTrends.findUnique({
    where: {
      locationType_locationName_month: {
        locationType: locationType,
        locationName: locationName,
        month: currentMonth,
      },
    },
  });
};
```

### 2. Get All Cities with Data
```typescript
const getAllCities = async () => {
  return await prisma.marketTrends.findMany({
    select: {
      city: true,
    },
    distinct: ['city'],
    orderBy: {
      city: 'asc',
    },
  });
};
```

### 3. Get Historical Data (Last 12 Months)
```typescript
const getHistoricalData = async (city: string) => {
  return await prisma.marketTrends.findMany({
    where: {
      city: city,
    },
    orderBy: {
      month: 'desc',
    },
    take: 12,
  });
};
```

### 4. Find Stale Data
```typescript
const getStaleData = async () => {
  const twentyFiveDaysAgo = new Date();
  twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);
  
  return await prisma.marketTrends.findMany({
    where: {
      lastFetchedAt: {
        lt: twentyFiveDaysAgo,
      },
    },
    orderBy: {
      lastFetchedAt: 'asc',
    },
  });
};
```

### 5. Upsert Market Trends (Create or Update)
```typescript
const upsertMarketTrends = async (
  city: string,
  month: string,
  data: {
    priceOverview?: any;
    averageSoldPrice?: any;
    salesVolumeByType?: any;
    inventoryOverview?: any;
    newClosedAvailable?: any;
    daysOnMarket?: any;
    rankings?: any;
    rankingOverview?: any;
  }
) => {
  return await prisma.marketTrends.upsert({
    where: {
      city_month: {
        city: city,
        month: month,
      },
    },
    update: {
      ...data,
      lastFetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      city: city,
      month: month,
      ...data,
      lastFetchedAt: new Date(),
    },
  });
};
```

### 6. Get Rankings for Multiple Cities
```typescript
const getCityRankings = async (cities: string[]) => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  return await prisma.marketTrends.findMany({
    where: {
      city: {
        in: cities,
      },
      month: currentMonth,
      rankingOverview: {
        not: null,
      },
    },
    select: {
      city: true,
      rankingOverview: true,
      rankings: true,
    },
  });
};
```

### 7. Delete Old Data (Keep Last N Months)
```typescript
const deleteOldData = async (keepMonths: number = 12) => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - keepMonths);
  const cutoffMonth = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;
  
  return await prisma.marketTrends.deleteMany({
    where: {
      month: {
        lt: cutoffMonth,
      },
    },
  });
};
```

### 8. Get Statistics Summary
```typescript
const getStatisticsSummary = async () => {
  const result = await prisma.marketTrends.groupBy({
    by: ['city'],
    _count: {
      id: true,
    },
    _max: {
      month: true,
      lastFetchedAt: true,
    },
    _min: {
      month: true,
    },
  });
  
  return result.map(r => ({
    city: r.city,
    recordCount: r._count.id,
    latestMonth: r._max.month,
    earliestMonth: r._min.month,
    lastFetched: r._max.lastFetchedAt,
  }));
};
```

## JSON Field Queries (PostgreSQL)

### Extract Specific Fields from JSON

```sql
-- Get current average price
SELECT "priceOverview"->'current'->>'avgPrice' AS avg_price
FROM "MarketTrends"
WHERE city = 'Oakville';

-- Get sales count
SELECT "priceOverview"->'current'->>'salesCount' AS sales_count
FROM "MarketTrends"
WHERE city = 'Oakville';

-- Get monthly change percentage
SELECT "priceOverview"->'current'->>'monthlyChange' AS monthly_change
FROM "MarketTrends"
WHERE city = 'Oakville';

-- Get average sold price data (array)
SELECT 
    "averageSoldPrice"->>'months' AS months,
    "averageSoldPrice"->>'prices' AS prices,
    "averageSoldPrice"->>'counts' AS counts
FROM "MarketTrends"
WHERE city = 'Oakville';
```

## Useful Admin Queries

### Check Database Size
```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('"MarketTrends"')) AS total_size,
    pg_size_pretty(pg_relation_size('"MarketTrends"')) AS table_size,
    pg_size_pretty(pg_total_relation_size('"MarketTrends"') - pg_relation_size('"MarketTrends"')) AS indexes_size;
```

### Count Total Records
```sql
SELECT COUNT(*) AS total_records FROM "MarketTrends";
```

### Get Most Recent Updates
```sql
SELECT 
    city,
    month,
    "lastFetchedAt",
    "updatedAt"
FROM "MarketTrends"
ORDER BY "lastFetchedAt" DESC
LIMIT 20;
```

