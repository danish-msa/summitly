# PropertyWatchlist Table Migration

## Problem
The `PropertyWatchlist` table is missing from your database, causing errors when trying to save alerts.

## Solution
Run the migration SQL in your Supabase database to create the `PropertyWatchlist` table.

## Steps to Fix

### Option 1: Run the Standalone Migration (Recommended)
1. **Go to Supabase Dashboard**
   - Visit your Supabase project dashboard
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button

3. **Copy and Paste SQL**
   - Open `prisma/migration_property_watchlist.sql` file
   - Copy **ALL** the SQL content
   - Paste it into the Supabase SQL Editor

4. **Run the Migration**
   - Click **Run** button (or press `Ctrl+Enter`)
   - Wait for it to complete

5. **Verify Table Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see the `PropertyWatchlist` table

### Option 2: Use Prisma Migrate (If Database Connection Works)
If your Prisma can connect to the database, you can run:

```bash
npx prisma migrate dev --name add_property_watchlist
```

## What This Migration Does

Creates the `PropertyWatchlist` table with:
- ✅ All required fields (id, userId, mlsNumber, cityName, etc.)
- ✅ Boolean flags for different alert types
- ✅ Indexes for performance (userId, mlsNumber, cityName+neighborhood)
- ✅ Foreign key relationship to User table with CASCADE delete

## After Running the Migration

1. The alerts saving functionality should work immediately
2. Users can now:
   - Watch specific properties
   - Set alerts for new properties in an area
   - Get notified about sold listings
   - Get notified about expired listings

## Verification

After running the migration, test by:
1. Going to a property page
2. Opening the PropertyAlerts component
3. Toggling any alert option
4. It should save successfully without errors

