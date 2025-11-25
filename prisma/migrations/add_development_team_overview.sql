-- Add developmentTeamOverview field to PreConstructionProject table
ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "developmentTeamOverview" TEXT;

