-- Migration: Update PreConstructionPageContent to support location hierarchy
-- This migration:
-- 1. Updates existing 'city' pageType to 'by-location' with locationType='by-city'
-- 2. Adds locationType column
-- 3. Adds parentId column for hierarchy
-- 4. Adds indexes

-- Step 1: Add new columns (nullable first)
ALTER TABLE "PreConstructionPageContent" 
ADD COLUMN IF NOT EXISTS "locationType" TEXT,
ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Step 2: Update existing 'city' records to 'by-location' with locationType='by-city'
UPDATE "PreConstructionPageContent"
SET 
  "pageType" = 'by-location',
  "locationType" = 'by-city'
WHERE "pageType" = 'city';

-- Step 3: Add foreign key constraint for parentId (self-referential)
-- Note: This will fail if there are existing parentId values that don't reference valid IDs
-- We'll add it after ensuring data integrity
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'PreConstructionPageContent_parentId_fkey'
  ) THEN
    ALTER TABLE "PreConstructionPageContent"
    ADD CONSTRAINT "PreConstructionPageContent_parentId_fkey"
    FOREIGN KEY ("parentId") 
    REFERENCES "PreConstructionPageContent"("id") 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS "PreConstructionPageContent_locationType_idx" 
ON "PreConstructionPageContent"("locationType");

CREATE INDEX IF NOT EXISTS "PreConstructionPageContent_parentId_idx" 
ON "PreConstructionPageContent"("parentId");

