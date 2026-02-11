# Migration: Add developmentTeamOverview Field

## Quick Steps

### Step 1: Run SQL in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Run the Migration SQL**
   ```sql
   -- Add developmentTeamOverview field to PreConstructionProject table
   ALTER TABLE "PreConstructionProject" 
   ADD COLUMN IF NOT EXISTS "developmentTeamOverview" TEXT;
   ```

3. **Verify the Column Was Added**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'PreConstructionProject'
   AND column_name = 'developmentTeamOverview';
   ```

### Step 2: Mark Migration as Applied (Optional)

If you want Prisma to recognize this migration, run this in Supabase SQL Editor:

```sql
INSERT INTO "_prisma_migrations" (
  id, 
  checksum, 
  finished_at, 
  migration_name, 
  logs, 
  rolled_back_at, 
  started_at, 
  applied_steps_count
)
VALUES (
  gen_random_uuid(),
  '',
  NOW(),
  'add_development_team_overview',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Step 3: Regenerate Prisma Client

After running the SQL, regenerate Prisma client:

```bash
npx prisma generate
```

## What This Does

- Adds `developmentTeamOverview` TEXT column to `PreConstructionProject` table
- Allows storing overview text about the development team
- Field is nullable (optional)

## Verification

After migration, test by:
1. Creating/editing a pre-con project in dashboard
2. Filling in the "Team Overview" field
3. Saving - it should save successfully
4. Reloading the edit page - the field should retain its value

