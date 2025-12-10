-- Market Rankings Table
-- Stores GTA city rankings (same data for all cities, stored once per month)
-- This is more efficient than storing rankings in MarketTrends for each city

CREATE TABLE IF NOT EXISTS "MarketRankings" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "rankings" JSONB NOT NULL,
  "rankingOverview" JSONB NOT NULL,
  "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MarketRankings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on month (one ranking per month)
CREATE UNIQUE INDEX IF NOT EXISTS "MarketRankings_month_key" ON "MarketRankings"("month");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "MarketRankings_month_idx" ON "MarketRankings"("month");
CREATE INDEX IF NOT EXISTS "MarketRankings_lastFetchedAt_idx" ON "MarketRankings"("lastFetchedAt");

-- Add comments for documentation
COMMENT ON TABLE "MarketRankings" IS 'Stores GTA city rankings - one record per month, shared by all cities';
COMMENT ON COLUMN "MarketRankings"."month" IS 'Format: YYYY-MM (e.g., "2025-01")';
COMMENT ON COLUMN "MarketRankings"."rankings" IS 'JSON: RankingData - contains rankings for all cities';
COMMENT ON COLUMN "MarketRankings"."rankingOverview" IS 'JSON: RankingOverviewData - contains overview stats';

