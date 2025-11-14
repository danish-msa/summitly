-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('IN_PERSON', 'VIDEO_CHAT');

-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "tourType" "TourType" NOT NULL DEFAULT 'IN_PERSON',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "preApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" "TourStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tour_userId_idx" ON "Tour"("userId");

-- CreateIndex
CREATE INDEX "Tour_mlsNumber_idx" ON "Tour"("mlsNumber");

-- CreateIndex
CREATE INDEX "Tour_scheduledDate_idx" ON "Tour"("scheduledDate");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

