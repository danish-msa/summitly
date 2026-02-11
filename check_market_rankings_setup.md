# MarketRankings Table Setup Checklist

## Issue: Data not being stored in MarketRankings table

Follow these steps to fix the issue:

### Step 1: Create the Table in Database

Run the SQL script in Supabase SQL Editor:
```sql
-- Run: supabase_market_rankings_setup.sql
```

Or manually run:
```sql
CREATE TABLE IF NOT EXISTS "MarketRankings" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "rankings" JSONB NOT NULL,
  "rankingOverview" JSONB NOT NULL,
  "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketRankings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketRankings_month_key" ON "MarketRankings"("month");
CREATE INDEX IF NOT EXISTS "MarketRankings_month_idx" ON "MarketRankings"("month");
CREATE INDEX IF NOT EXISTS "MarketRankings_lastFetchedAt_idx" ON "MarketRankings"("lastFetchedAt");
```

### Step 2: Regenerate Prisma Client

After creating the table, regenerate Prisma client:
```bash
npx prisma generate
```

### Step 3: Verify Table Exists

Check in Supabase Dashboard:
1. Go to Table Editor
2. Look for `MarketRankings` table
3. Verify it has these columns:
   - id (TEXT, Primary Key)
   - month (TEXT, Unique)
   - rankings (JSONB)
   - rankingOverview (JSONB)
   - lastFetchedAt (TIMESTAMP)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)

### Step 4: Test the API

1. Open browser console
2. Navigate to a city trends page (e.g., `/oakville/trends`)
3. Click refresh on Rankings section
4. Check server logs for:
   - `[MarketRankings API] Successfully saved rankings for month...`
   - Or any error messages

### Step 5: Check Server Logs

Look for these log messages:
- ✅ `[MarketRankings API] Successfully saved rankings for month...` - Success!
- ❌ `Error reading from MarketRankings table` - Table doesn't exist or Prisma client not regenerated
- ❌ `Error saving rankings to database` - Check error details

### Common Issues:

1. **Table doesn't exist**: Run the SQL script in Supabase
2. **Prisma client not updated**: Run `npx prisma generate`
3. **Column mismatch**: Make sure table structure matches Prisma schema
4. **Permission issues**: Check database user has INSERT/UPDATE permissions

