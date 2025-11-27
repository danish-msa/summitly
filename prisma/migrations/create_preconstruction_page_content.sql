-- Create PreConstructionPageContent table
-- This table stores custom content for filtered pre-construction pages (property type, status, completion year, city)

CREATE TABLE IF NOT EXISTS "PreConstructionPageContent" (
    "id" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "pageValue" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "heroImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "customContent" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConstructionPageContent_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on pageType and pageValue
CREATE UNIQUE INDEX IF NOT EXISTS "PreConstructionPageContent_pageType_pageValue_key" 
ON "PreConstructionPageContent"("pageType", "pageValue");

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "PreConstructionPageContent_pageType_idx" 
ON "PreConstructionPageContent"("pageType");

CREATE INDEX IF NOT EXISTS "PreConstructionPageContent_pageValue_idx" 
ON "PreConstructionPageContent"("pageValue");

CREATE INDEX IF NOT EXISTS "PreConstructionPageContent_isPublished_idx" 
ON "PreConstructionPageContent"("isPublished");

