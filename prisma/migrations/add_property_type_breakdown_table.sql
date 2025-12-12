-- Create PropertyTypeBreakdown table for caching property type breakdown data
CREATE TABLE IF NOT EXISTS "PropertyTypeBreakdown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL UNIQUE,
    "breakdownData" JSONB NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "PropertyTypeBreakdown_month_idx" ON "PropertyTypeBreakdown"("month");
CREATE INDEX IF NOT EXISTS "PropertyTypeBreakdown_lastFetchedAt_idx" ON "PropertyTypeBreakdown"("lastFetchedAt");

-- Add comment
COMMENT ON TABLE "PropertyTypeBreakdown" IS 'Stores property type breakdown data - one record per month per city';

