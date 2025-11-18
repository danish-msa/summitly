-- Create PreConstructionProject table
CREATE TABLE IF NOT EXISTS "PreConstructionProject" (
    "id" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "startingPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "streetNumber" TEXT,
    "streetName" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Canada',
    "neighborhood" TEXT,
    "majorIntersection" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "propertyType" TEXT NOT NULL,
    "bedroomRange" TEXT NOT NULL,
    "bathroomRange" TEXT NOT NULL,
    "sqftRange" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "storeys" INTEGER,
    "completionDate" TEXT NOT NULL,
    "completionProgress" INTEGER NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depositStructure" TEXT,
    "description" TEXT,
    "developerInfo" TEXT,
    "architectInfo" TEXT,
    "builderInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConstructionProject_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on mlsNumber
CREATE UNIQUE INDEX IF NOT EXISTS "PreConstructionProject_mlsNumber_key" ON "PreConstructionProject"("mlsNumber");

-- Create indexes for PreConstructionProject
CREATE INDEX IF NOT EXISTS "PreConstructionProject_city_idx" ON "PreConstructionProject"("city");
CREATE INDEX IF NOT EXISTS "PreConstructionProject_status_idx" ON "PreConstructionProject"("status");
CREATE INDEX IF NOT EXISTS "PreConstructionProject_propertyType_idx" ON "PreConstructionProject"("propertyType");

-- Create PreConstructionUnit table
CREATE TABLE IF NOT EXISTS "PreConstructionUnit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "sqft" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "maintenanceFee" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "floorplanImage" TEXT,
    "description" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConstructionUnit_pkey" PRIMARY KEY ("id")
);

-- Create foreign key for PreConstructionUnit
ALTER TABLE "PreConstructionUnit" ADD CONSTRAINT "PreConstructionUnit_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "PreConstructionProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for PreConstructionUnit
CREATE INDEX IF NOT EXISTS "PreConstructionUnit_projectId_idx" ON "PreConstructionUnit"("projectId");
CREATE INDEX IF NOT EXISTS "PreConstructionUnit_status_idx" ON "PreConstructionUnit"("status");

-- Create PropertyRating table (generic for all property types)
CREATE TABLE IF NOT EXISTS "PropertyRating" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyRating_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PropertyRating
CREATE INDEX IF NOT EXISTS "PropertyRating_propertyId_idx" ON "PropertyRating"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyRating_propertyType_idx" ON "PropertyRating"("propertyType");
CREATE INDEX IF NOT EXISTS "PropertyRating_userId_idx" ON "PropertyRating"("userId");
CREATE INDEX IF NOT EXISTS "PropertyRating_propertyId_propertyType_idx" ON "PropertyRating"("propertyId", "propertyType");
CREATE INDEX IF NOT EXISTS "PropertyRating_propertyId_rating_idx" ON "PropertyRating"("propertyId", "rating");
CREATE INDEX IF NOT EXISTS "PropertyRating_propertyId_sessionId_idx" ON "PropertyRating"("propertyId", "sessionId");

-- Add comments for documentation
COMMENT ON TABLE "PreConstructionProject" IS 'Stores pre-construction project data';
COMMENT ON TABLE "PreConstructionUnit" IS 'Stores individual units within pre-construction projects';
COMMENT ON TABLE "PropertyRating" IS 'Stores user ratings for all property types (regular listings, pre-construction, etc.)';
COMMENT ON COLUMN "PropertyRating"."propertyId" IS 'The ID of the property (mlsNumber for regular properties, projectId for pre-cons)';
COMMENT ON COLUMN "PropertyRating"."propertyType" IS 'Type of property: regular, pre-construction, etc.';
COMMENT ON COLUMN "PropertyRating"."rating" IS 'Rating value from 1 to 5 stars';

