# Migration Instructions: Add Pre-Construction Additional Fields

## Problem
Prisma 7.0.0 requires a `prisma.config.ts` file, but the Prisma CLI is unable to parse it, preventing `prisma migrate dev` from running.

## Solution: Manual SQL Migration

Since Prisma CLI is having issues with the config file, we'll apply the migration directly using SQL.

### Step 1: Run SQL Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire contents of `prisma/migrations/add_precon_additional_fields.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Migration**
   - After running, verify the columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'PreConstructionProject'
   AND column_name IN (
     'avgPricePerSqft',
     'parkingPrice',
     'parkingPriceDetail',
     'lockerPrice',
     'lockerPriceDetail',
     'assignmentFee',
     'developmentLevies',
     'developmentCharges',
     'height',
     'maintenanceFeesPerSqft',
     'maintenanceFeesDetail',
     'floorPremiums',
     'salesMarketingCompany'
   )
   ORDER BY column_name;
   ```

### Step 2: Mark Migration as Applied (Optional)

If you want Prisma to recognize this migration, you can manually create a migration record:

```sql
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '',
  NOW(),
  'add_precon_additional_fields',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Step 3: Regenerate Prisma Client

After the migration is complete, regenerate the Prisma client:

```bash
npm run prisma:generate
```

## Fields Added

The following fields are added to the `PreConstructionProject` table:

- `avgPricePerSqft` (DOUBLE PRECISION) - Average price per square foot
- `parkingPrice` (DOUBLE PRECISION) - Parking price
- `parkingPriceDetail` (TEXT) - Parking price details
- `lockerPrice` (DOUBLE PRECISION) - Locker price
- `lockerPriceDetail` (TEXT) - Locker price details
- `assignmentFee` (DOUBLE PRECISION) - Assignment fee
- `developmentLevies` (DOUBLE PRECISION) - Development levies
- `developmentCharges` (DOUBLE PRECISION) - Development charges
- `height` (DOUBLE PRECISION) - Height in meters
- `maintenanceFeesPerSqft` (DOUBLE PRECISION) - Maintenance fees per square foot
- `maintenanceFeesDetail` (TEXT) - Maintenance fees details
- `floorPremiums` (TEXT) - Floor premiums information
- `salesMarketingCompany` (TEXT) - Sales & Marketing Company ID

All fields are nullable to maintain compatibility with existing records.

## Troubleshooting

If you encounter any issues:

1. **Check if columns already exist**: The migration script uses `DO $$` blocks to check if columns exist before adding them, so it's safe to run multiple times.

2. **Verify Prisma Schema**: Ensure `prisma/schema.prisma` has all the fields defined (it should already have them).

3. **Regenerate Client**: Always run `npm run prisma:generate` after database changes.

## Future Migrations

For future migrations, you may need to:
- Fix the `prisma.config.ts` parsing issue, OR
- Continue using manual SQL migrations for Prisma 7.0.0
