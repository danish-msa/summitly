-- CreateTable: PropertyWatchlist
-- This migration adds the PropertyWatchlist table for user alerts

CREATE TABLE IF NOT EXISTS "PropertyWatchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mlsNumber" TEXT,
    "cityName" TEXT,
    "neighborhood" TEXT,
    "propertyType" TEXT,
    "watchProperty" BOOLEAN NOT NULL DEFAULT false,
    "newProperties" BOOLEAN NOT NULL DEFAULT false,
    "soldListings" BOOLEAN NOT NULL DEFAULT false,
    "expiredListings" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PropertyWatchlist_userId_idx" ON "PropertyWatchlist"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PropertyWatchlist_mlsNumber_idx" ON "PropertyWatchlist"("mlsNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PropertyWatchlist_cityName_neighborhood_idx" ON "PropertyWatchlist"("cityName", "neighborhood");

-- AddForeignKey
ALTER TABLE "PropertyWatchlist" ADD CONSTRAINT "PropertyWatchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

