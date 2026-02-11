-- Add metaTitle, metaDescription, and keywords columns to PreConstructionProject table
-- These fields are used for SEO purposes

ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "metaTitle" TEXT,
ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments to columns
COMMENT ON COLUMN "PreConstructionProject"."metaTitle" IS 'SEO meta title for search engines';
COMMENT ON COLUMN "PreConstructionProject"."metaDescription" IS 'SEO meta description for search engines';
COMMENT ON COLUMN "PreConstructionProject"."keywords" IS 'SEO keywords array for search engines';

