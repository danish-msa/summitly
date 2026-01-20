-- Migration: Change beds and baths from Int to String in PreConstructionUnit table
-- This allows storing formats like "1+1", "2+1", etc.

-- For PostgreSQL
ALTER TABLE "PreConstructionUnit" 
ALTER COLUMN "beds" TYPE VARCHAR(50) USING "beds"::text;

ALTER TABLE "PreConstructionUnit" 
ALTER COLUMN "baths" TYPE VARCHAR(50) USING "baths"::text;
