# Project Ratings Database Setup

> **⚠️ NOTE**: This file is outdated. Please use `DATABASE_SETUP_PRECON_AND_RATINGS.md` instead, which includes:
> - Pre-Construction Projects table
> - Pre-Construction Units table  
> - Generic Property Ratings table (works for all property types)

## 📋 Step 1: Create the Database Table

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/omsefyactufffyqaxowx
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button

3. **Copy and Paste SQL**
   - Copy the SQL from `prisma/migrations/create_preconstruction_and_ratings.sql`
   - Paste it into the Supabase SQL Editor

4. **Run the Migration**
   - Click **Run** button (or press `Ctrl+Enter`)
   - Wait for it to complete

5. **Verify Table Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see the `ProjectRating` table

### Option B: Using Prisma Migrate

If you have direct database access:

```bash
# Generate Prisma client with new model
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_project_ratings
```

## 📝 SQL Query (Alternative - if you prefer to run directly)

```sql
-- Create project_ratings table for storing pre-construction project ratings
CREATE TABLE IF NOT EXISTS "ProjectRating" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRating_pkey" PRIMARY KEY ("id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "ProjectRating_projectId_idx" ON "ProjectRating"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectRating_userId_idx" ON "ProjectRating"("userId");
CREATE INDEX IF NOT EXISTS "ProjectRating_projectId_rating_idx" ON "ProjectRating"("projectId", "rating");
CREATE INDEX IF NOT EXISTS "ProjectRating_projectId_sessionId_idx" ON "ProjectRating"("projectId", "sessionId");

-- Add comments for documentation
COMMENT ON TABLE "ProjectRating" IS 'Stores user ratings for pre-construction projects';
COMMENT ON COLUMN "ProjectRating"."projectId" IS 'The ID of the pre-construction project (matches property.mlsNumber)';
COMMENT ON COLUMN "ProjectRating"."userId" IS 'Optional user ID if user is logged in, null for anonymous ratings';
COMMENT ON COLUMN "ProjectRating"."sessionId" IS 'Session ID for anonymous users to prevent duplicate ratings';
COMMENT ON COLUMN "ProjectRating"."rating" IS 'Rating value from 1 to 5 stars';
```

## 🔄 Step 2: Generate Prisma Client

After creating the table, generate the Prisma client:

```bash
npx prisma generate
```

## ✅ Step 3: Verify Setup

1. **Check API Route**
   - The API route is at: `/api/projects/[projectId]/ratings`
   - GET: Fetches rating statistics
   - POST: Saves/updates a rating

2. **Test the API**
   - You can test using the browser console or Postman
   - Example:
     ```javascript
     // Get ratings
     fetch('/api/projects/luxury-heights-condominiums/ratings')
       .then(r => r.json())
       .then(console.log);
     
     // Save rating
     fetch('/api/projects/luxury-heights-condominiums/ratings', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ rating: 5 })
     })
       .then(r => r.json())
       .then(console.log);
     ```

## 📊 Features

- ✅ **User Ratings**: Logged-in users can rate projects
- ✅ **Anonymous Ratings**: Anonymous users can also rate (tracked by session)
- ✅ **One Rating Per User**: Each user can only rate once per project (can update)
- ✅ **Average Calculation**: Automatically calculates average rating
- ✅ **Real-time Updates**: Ratings update immediately after submission

## 🔐 Security Notes

- Ratings are validated (1-5 stars only)
- User authentication is optional (supports anonymous ratings)
- Session-based tracking for anonymous users prevents spam
- All database operations are server-side only

## 🚀 Next Steps

After setting up the database:

1. The `ProjectRatingDisplay` component will automatically use the API
2. The `PreConstructionPropertyCardV3` component will show ratings from the database
3. All ratings are now shared across all users and devices

