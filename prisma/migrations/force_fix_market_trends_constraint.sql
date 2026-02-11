-- Force fix MarketTrends unique constraint
-- This script will find and drop ALL unique constraints, then recreate the correct one

-- Step 1: Ensure years column exists (set default for existing rows)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketTrends' AND column_name = 'years'
    ) THEN
        ALTER TABLE "MarketTrends"
        ADD COLUMN "years" INTEGER NOT NULL DEFAULT 2;
    ELSE
        -- Column exists, but ensure existing rows have a value
        UPDATE "MarketTrends"
        SET "years" = 2
        WHERE "years" IS NULL;
        
        -- Make sure it's NOT NULL
        ALTER TABLE "MarketTrends"
        ALTER COLUMN "years" SET NOT NULL,
        ALTER COLUMN "years" SET DEFAULT 2;
    END IF;
END $$;

-- Step 2: Drop ALL unique constraints on MarketTrends (we'll recreate the correct one)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'MarketTrends'::regclass
            AND contype = 'u'
    ) LOOP
        EXECUTE 'ALTER TABLE "MarketTrends" DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Step 3: Add the correct unique constraint with years
ALTER TABLE "MarketTrends"
ADD CONSTRAINT "MarketTrends_locationType_locationName_month_years_key" 
UNIQUE ("locationType", "locationName", "month", "years");

-- Step 4: Ensure indexes exist
CREATE INDEX IF NOT EXISTS "MarketTrends_years_idx" ON "MarketTrends"("years");
CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_years_idx" 
ON "MarketTrends"("locationType", "locationName", "month", "years");

-- Step 5: Add comments
COMMENT ON COLUMN "MarketTrends"."years" IS 'Number of years of historical data (5, 10, 15, 20). Defaults to 2 for backward compatibility.';

-- Step 6: Add medianListingVsSoldPrice column if it doesn't exist
ALTER TABLE "MarketTrends" 
ADD COLUMN IF NOT EXISTS "medianListingVsSoldPrice" JSONB;

COMMENT ON COLUMN "MarketTrends"."medianListingVsSoldPrice" IS 'Stores median listing price vs median sold price comparison data - MedianListingVsSoldPriceData format: { months: string[], medianListingPrice: number[], medianSoldPrice: number[] }';

-- Step 7: Verify the constraint was created
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'MarketTrends'::regclass
    AND contype = 'u'
ORDER BY conname;

