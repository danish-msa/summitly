-- Migration: Rename Developer model to DevelopmentTeam
-- This renames the table and all related indexes

-- Rename the table
ALTER TABLE "Developer" RENAME TO "DevelopmentTeam";

-- Rename indexes
ALTER INDEX IF EXISTS "Developer_type_idx" RENAME TO "DevelopmentTeam_type_idx";
ALTER INDEX IF EXISTS "Developer_name_idx" RENAME TO "DevelopmentTeam_name_idx";

