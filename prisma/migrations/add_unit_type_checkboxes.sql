-- Add unit type checkbox fields to PreConstructionProject table
-- Migration: add_unit_type_checkboxes
-- Description: Adds boolean fields to track unit types (Den, Studio, Loft, Work/Live Loft)

ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "hasDen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasStudio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasLoft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasWorkLiveLoft" BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN "PreConstructionProject"."hasDen" IS 'Unit has den available';
COMMENT ON COLUMN "PreConstructionProject"."hasStudio" IS 'Studio units available';
COMMENT ON COLUMN "PreConstructionProject"."hasLoft" IS 'Loft units available';
COMMENT ON COLUMN "PreConstructionProject"."hasWorkLiveLoft" IS 'Work/Live Loft units available';

