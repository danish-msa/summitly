-- Migration: Make all fields optional except projectName in PreConstructionProject
-- This allows projects to be saved as drafts with minimal information

-- Make developer optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "developer" DROP NOT NULL;

-- Make startingPrice optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "startingPrice" DROP NOT NULL;

-- Make endingPrice optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "endingPrice" DROP NOT NULL;

-- Make status optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "status" DROP NOT NULL;

-- Make city optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "city" DROP NOT NULL;

-- Make state optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "state" DROP NOT NULL;

-- Make country optional (it has a default, but we'll allow null)
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "country" DROP NOT NULL;

-- Make propertyType optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "propertyType" DROP NOT NULL;

-- Make bedroomRange optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "bedroomRange" DROP NOT NULL;

-- Make bathroomRange optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "bathroomRange" DROP NOT NULL;

-- Make sqftRange optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "sqftRange" DROP NOT NULL;

-- Make totalUnits optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "totalUnits" DROP NOT NULL;

-- Make availableUnits optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "availableUnits" DROP NOT NULL;

-- Make occupancyDate optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "occupancyDate" DROP NOT NULL;

-- Make completionProgress optional
ALTER TABLE "PreConstructionProject" 
ALTER COLUMN "completionProgress" DROP NOT NULL;

