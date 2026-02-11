-- Add studio field to PreConstructionUnit table
ALTER TABLE "PreConstructionUnit" 
ADD COLUMN IF NOT EXISTS "studio" BOOLEAN NOT NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN "PreConstructionUnit"."studio" IS 'Indicates if the unit is a studio unit';

