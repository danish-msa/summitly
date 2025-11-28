-- Migration: Rename completionDate to occupancyDate
-- Run this query in your Supabase SQL Editor

-- Step 1: Add the new column
ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "occupancyDate" TEXT;

-- Step 2: Copy data from completionDate to occupancyDate
UPDATE "PreConstructionProject" 
SET "occupancyDate" = "completionDate" 
WHERE "completionDate" IS NOT NULL;

-- Step 3: Make the new column NOT NULL (if completionDate was NOT NULL)
-- Note: Only run this if you're sure all rows have data
-- ALTER TABLE "PreConstructionProject" 
-- ALTER COLUMN "occupancyDate" SET NOT NULL;

-- Step 4: Drop the old column
ALTER TABLE "PreConstructionProject" 
DROP COLUMN IF EXISTS "completionDate";

-- Verify the migration
SELECT 
  "id", 
  "projectName", 
  "occupancyDate" 
FROM "PreConstructionProject" 
LIMIT 10;

