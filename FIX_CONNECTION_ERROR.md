# Fix: "prepared statement does not exist" Error

This error occurs after database schema changes. Follow these steps:

## Solution Steps

1. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Restart Your Development Server**
   - Stop your Next.js dev server (Ctrl+C)
   - Start it again:
   ```bash
   npm run dev
   ```

3. **If the error persists, try:**
   - Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```
   Or on Windows:
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

4. **Verify Database Connection**
   - Check your `DATABASE_URL` in `.env` is correct
   - Ensure Supabase connection is active

## Why This Happens

After adding new columns to the database, Prisma's generated client becomes out of sync. The "prepared statement" error indicates the client is trying to use a query plan that no longer exists in the database connection pool.

## Quick Fix Command Sequence

```bash
# 1. Regenerate Prisma client
npx prisma generate

# 2. Clear Next.js cache and restart
rm -rf .next  # or Remove-Item -Recurse -Force .next on Windows
npm run dev
```

After these steps, the error should be resolved.

