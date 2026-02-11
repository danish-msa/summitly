-- Migration: Change developmentLevies from Float to Text
-- Run this query in your PostgreSQL database

-- Step 1: Alter the column type (PostgreSQL will automatically convert numeric values to text)
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "developmentLevies" TYPE TEXT USING 
  CASE 
    WHEN "developmentLevies" IS NULL THEN NULL
    ELSE "developmentLevies"::TEXT
  END;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PreConstructionProject' 
AND column_name = 'developmentLevies';

