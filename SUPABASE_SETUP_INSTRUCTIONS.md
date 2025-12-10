# Supabase Setup Instructions for Market Trends

## Quick Setup

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the SQL Script**
   - Copy the contents of `supabase_market_trends_setup.sql`
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Table Creation**
   - Go to **Table Editor** in the left sidebar
   - You should see `MarketTrends` table listed
   - Click on it to view the structure

### Option 2: Using Prisma Migrate (Alternative)

If you prefer using Prisma migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_market_trends

# Apply to Supabase
npx prisma migrate deploy
```

**Note**: Make sure your `.env` file has the correct Supabase connection string:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## What Gets Created

### Table: `MarketTrends`
- **Primary Key**: `id` (TEXT, auto-generated CUID)
- **Unique Constraint**: `city` + `month` (one record per city per month)
- **JSONB Fields**: All market data stored as JSONB for flexible querying
- **Timestamps**: `createdAt`, `updatedAt`, `lastFetchedAt`

### Indexes Created
1. `MarketTrends_city_month_key` - Unique index for city+month
2. `MarketTrends_city_idx` - Fast city lookups
3. `MarketTrends_month_idx` - Fast month filtering
4. `MarketTrends_city_month_idx` - Composite index for combined queries
5. `MarketTrends_lastFetchedAt_idx` - For finding stale data
6. `MarketTrends_priceOverview_idx` - GIN index for JSON queries
7. `MarketTrends_rankings_idx` - GIN index for JSON queries

### Triggers
- **Auto-update `updatedAt`**: Automatically updates timestamp on record updates

## Verification

After running the SQL script, verify the table was created:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'MarketTrends';

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'MarketTrends'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'MarketTrends';
```

## Sample Data Insert (For Testing)

```sql
-- Insert sample record (for testing)
INSERT INTO "MarketTrends" (
    "id",
    "city",
    "month",
    "priceOverview",
    "lastFetchedAt",
    "createdAt",
    "updatedAt"
) VALUES (
    'test-id-123',
    'Oakville',
    '2025-01',
    '{"current": {"avgPrice": 1200000, "salesCount": 45, "monthlyChange": 2.5}}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verify insert
SELECT * FROM "MarketTrends" WHERE city = 'Oakville';
```

## Troubleshooting

### Error: "relation already exists"
- The table already exists. You can either:
  - Drop it first: `DROP TABLE IF EXISTS "MarketTrends" CASCADE;`
  - Or skip the CREATE TABLE and only run the index/trigger parts

### Error: "permission denied"
- Make sure you're using the correct database user (usually `postgres`)
- Check your connection string has proper permissions

### Error: "syntax error"
- Make sure you're using PostgreSQL (Supabase uses PostgreSQL)
- Check for any copy-paste issues with quotes

## Next Steps

After the table is created:

1. **Update Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Test the API Routes**
   - Visit a city trends page
   - Check Supabase table editor to see data being inserted

3. **Monitor Data**
   - Use the queries in `DATABASE_QUERIES.md` to monitor your data

## Connection String Format

Your Supabase connection string should look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

You can find this in:
- Supabase Dashboard → Settings → Database → Connection String

