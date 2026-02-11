-- Migration: Update UserRole enum from BUYER/SELLER/AGENT/ADMIN to SUBSCRIBER/ADMIN/SUPER_ADMIN
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Create the new enum type
CREATE TYPE "UserRole_new" AS ENUM ('SUBSCRIBER', 'ADMIN', 'SUPER_ADMIN');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE "User" ADD COLUMN "role_new" "UserRole_new";

-- Step 3: Migrate existing data
-- Map old roles to new roles:
-- BUYER -> SUBSCRIBER (default for website users)
-- SELLER -> SUBSCRIBER
-- AGENT -> SUBSCRIBER
-- ADMIN -> ADMIN (keep as is)
UPDATE "User" 
SET "role_new" = CASE 
  WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"UserRole_new"
  WHEN "role"::text = 'BUYER' THEN 'SUBSCRIBER'::"UserRole_new"
  WHEN "role"::text = 'SELLER' THEN 'SUBSCRIBER'::"UserRole_new"
  WHEN "role"::text = 'AGENT' THEN 'SUBSCRIBER'::"UserRole_new"
  ELSE 'SUBSCRIBER'::"UserRole_new"
END;

-- Step 4: Set default for any NULL values
UPDATE "User" SET "role_new" = 'SUBSCRIBER'::"UserRole_new" WHERE "role_new" IS NULL;

-- Step 5: Make the new column NOT NULL
ALTER TABLE "User" ALTER COLUMN "role_new" SET NOT NULL;

-- Step 6: Drop the old column
ALTER TABLE "User" DROP COLUMN "role";

-- Step 7: Set the default value for the role column (before renaming)
ALTER TABLE "User" ALTER COLUMN "role_new" SET DEFAULT 'SUBSCRIBER'::"UserRole_new";

-- Step 8: Rename the new column to the original name
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Step 9: Drop the old enum type (only if no other tables use it)
DROP TYPE IF EXISTS "UserRole";

-- Step 10: Rename the new enum type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

COMMIT;

-- Verification query (run this separately to check):
-- SELECT "role", COUNT(*) as count FROM "User" GROUP BY "role";

