# Database Role Migration Guide

## 📋 Overview

This migration updates the `UserRole` enum in your Supabase database from the old values (`BUYER`, `SELLER`, `AGENT`, `ADMIN`) to the new values (`SUBSCRIBER`, `ADMIN`, `SUPER_ADMIN`).

## 🚨 Important Notes

- **Backup First**: Always backup your database before running migrations
- **Downtime**: This migration should be quick (< 1 second), but consider running during low-traffic periods
- **Data Migration**: Existing users will be migrated as follows:
  - `BUYER` → `SUBSCRIBER`
  - `SELLER` → `SUBSCRIBER`
  - `AGENT` → `SUBSCRIBER`
  - `ADMIN` → `ADMIN` (unchanged)

## 📝 Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard

1. Visit your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query** button

### Step 2: Run the Migration

1. Open the file: `prisma/migrations/update_user_role_enum.sql`
2. Copy **ALL** the SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** button (or press `Ctrl+Enter`)
5. Wait for it to complete (should be very fast)

### Step 3: Verify the Migration

Run this verification query in Supabase SQL Editor:

```sql
-- Check role distribution
SELECT "role", COUNT(*) as count 
FROM "User" 
GROUP BY "role"
ORDER BY count DESC;
```

You should see:
- Most users with `SUBSCRIBER` role
- Some users with `ADMIN` role (if any existed)
- No users with old roles (`BUYER`, `SELLER`, `AGENT`)

### Step 4: Set Your First Super Admin

After the migration, you'll need to manually set a user as SUPER_ADMIN:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE "User" 
SET "role" = 'SUPER_ADMIN' 
WHERE "email" = 'your-email@example.com';
```

### Step 5: Generate Prisma Client

After the migration, regenerate your Prisma client:

```bash
npx prisma generate
```

## ✅ What This Migration Does

1. **Creates new enum type** with values: `SUBSCRIBER`, `ADMIN`, `SUPER_ADMIN`
2. **Migrates existing data**:
   - All `BUYER`, `SELLER`, `AGENT` users → `SUBSCRIBER`
   - Existing `ADMIN` users → `ADMIN` (unchanged)
3. **Updates default value** to `SUBSCRIBER` for new users
4. **Removes old enum type** and replaces it with the new one

## 🔍 Troubleshooting

### Error: "type UserRole already exists"
If you get this error, the migration might have partially run. Check if the new enum exists:

```sql
SELECT typname FROM pg_type WHERE typname = 'UserRole_new';
```

If it exists, you may need to manually complete the migration or rollback first.

### Error: "column role_new does not exist"
The migration might have already completed. Check the current state:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'role';
```

### Rollback (if needed)

If something goes wrong, you can rollback:

```sql
BEGIN;

-- Restore old enum if needed
CREATE TYPE "UserRole_old" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'ADMIN');

-- Restore old column (you'll need to adjust based on your backup)
-- This is a simplified rollback - you should have a backup!

COMMIT;
```

## 🎯 After Migration

1. ✅ All existing users will have valid roles
2. ✅ New users will default to `SUBSCRIBER`
3. ✅ You can now use the admin dashboard features
4. ✅ Set your first SUPER_ADMIN user manually

## 📚 Related Files

- Migration SQL: `prisma/migrations/update_user_role_enum.sql`
- Prisma Schema: `prisma/schema.prisma`
- Role Utilities: `src/lib/roles.ts`

---

**Need Help?** If you encounter any issues, check the Supabase logs or contact support.

