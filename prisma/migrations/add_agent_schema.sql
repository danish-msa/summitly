-- Agent schema migration
-- Run this when your database is reachable (e.g. from a machine that can access RDS, or after fixing network/VPN).

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE "AgentType" AS ENUM ('COMMERCIAL', 'RESIDENTIAL', 'BOTH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Agent table (userId is optional; add FK to User later if that table exists)
CREATE TABLE IF NOT EXISTS "Agent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "job_title" TEXT NOT NULL,
  "agent_type" "AgentType" NOT NULL,
  "profile_image" TEXT,
  "cover_image" TEXT,
  "slug" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "about_agent" TEXT,
  "tagline" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website_url" TEXT,
  "allow_contact_form" BOOLEAN NOT NULL DEFAULT true,
  "allow_reviews" BOOLEAN NOT NULL DEFAULT true,
  "response_time" TEXT,
  "verified_agent" BOOLEAN NOT NULL DEFAULT false,
  "overall_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_reviews_count" INTEGER NOT NULL DEFAULT 0,
  "primary_focus" TEXT,
  "property_specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "industry_role" TEXT,
  "languages_spoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Agent_userId_key" UNIQUE ("userId"),
  CONSTRAINT "Agent_slug_key" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "Agent_slug_idx" ON "Agent"("slug");
CREATE INDEX IF NOT EXISTS "Agent_status_idx" ON "Agent"("status");
CREATE INDEX IF NOT EXISTS "Agent_agent_type_idx" ON "Agent"("agent_type");

-- 3. AgentStats
CREATE TABLE IF NOT EXISTS "AgentStats" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "years_experience" INTEGER NOT NULL DEFAULT 0,
  "total_properties_sold" INTEGER NOT NULL DEFAULT 0,
  "active_listings_count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentStats_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentStats_agentId_key" UNIQUE ("agentId"),
  CONSTRAINT "AgentStats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. AgentSocialLinks
CREATE TABLE IF NOT EXISTS "AgentSocialLinks" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "linkedin" TEXT,
  "facebook" TEXT,
  "instagram" TEXT,
  "twitter" TEXT,
  "youtube" TEXT,
  "other" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentSocialLinks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentSocialLinks_agentId_key" UNIQUE ("agentId"),
  CONSTRAINT "AgentSocialLinks_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. AgentServiceArea
CREATE TABLE IF NOT EXISTS "AgentServiceArea" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "area_name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgentServiceArea_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentServiceArea_agentId_area_name_key" UNIQUE ("agentId", "area_name"),
  CONSTRAINT "AgentServiceArea_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentServiceArea_agentId_idx" ON "AgentServiceArea"("agentId");

-- 6. AgentFeaturedListing
CREATE TABLE IF NOT EXISTS "AgentFeaturedListing" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "mlsNumber" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentFeaturedListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentFeaturedListing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentFeaturedListing_agentId_idx" ON "AgentFeaturedListing"("agentId");
CREATE INDEX IF NOT EXISTS "AgentFeaturedListing_mlsNumber_idx" ON "AgentFeaturedListing"("mlsNumber");

-- 7. AgentMarketStats
CREATE TABLE IF NOT EXISTS "AgentMarketStats" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "top_cities" JSONB,
  "property_type_distribution" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentMarketStats_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentMarketStats_agentId_key" UNIQUE ("agentId"),
  CONSTRAINT "AgentMarketStats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. AgentActivitySummary
CREATE TABLE IF NOT EXISTS "AgentActivitySummary" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "activity_period" TEXT NOT NULL DEFAULT 'last_12_months',
  "total_transactions" INTEGER NOT NULL DEFAULT 0,
  "active_listings" INTEGER NOT NULL DEFAULT 0,
  "worked_with_buyers" INTEGER NOT NULL DEFAULT 0,
  "worked_with_sellers" INTEGER NOT NULL DEFAULT 0,
  "for_sale_count" INTEGER NOT NULL DEFAULT 0,
  "sold_count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentActivitySummary_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentActivitySummary_agentId_key" UNIQUE ("agentId"),
  CONSTRAINT "AgentActivitySummary_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. AgentReview
CREATE TABLE IF NOT EXISTS "AgentReview" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "reviewer_name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "review_text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentReview_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentReview_agentId_idx" ON "AgentReview"("agentId");
