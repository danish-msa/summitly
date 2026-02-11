-- Create DeveloperType enum
DO $$ BEGIN
  CREATE TYPE "DeveloperType" AS ENUM ('DEVELOPER', 'ARCHITECT', 'INTERIOR_DESIGNER', 'BUILDER', 'LANDSCAPE_ARCHITECT', 'MARKETING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Developer table
CREATE TABLE IF NOT EXISTS "Developer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DeveloperType" NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "image" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Developer_type_idx" ON "Developer"("type");
CREATE INDEX IF NOT EXISTS "Developer_name_idx" ON "Developer"("name");

