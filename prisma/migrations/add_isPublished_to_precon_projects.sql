-- Migration: Add isPublished field to PreConstructionProject
-- This allows projects to be saved as drafts
-- Run this script directly in your database

-- Add isPublished column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'PreConstructionProject' 
    AND column_name = 'isPublished'
  ) THEN
    ALTER TABLE "PreConstructionProject" 
    ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS "PreConstructionProject_isPublished_idx" 
    ON "PreConstructionProject"("isPublished");
    
    RAISE NOTICE 'Column isPublished added successfully';
  ELSE
    RAISE NOTICE 'Column isPublished already exists';
  END IF;
END $$;
