# Database Connection Troubleshooting Guide

## Issue: Pre-con projects not showing on website

## Step 1: Test Database Connection

I've created a test endpoint to verify your database connection:

**Visit this URL on your deployed site:**
```
https://your-site.vercel.app/api/test-db
```

This will show you:
- ✅ If database connection works
- ✅ How many published projects exist
- ✅ How many condos exist
- ❌ Any connection errors

## Step 2: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set for **Production** environment
3. Make sure it matches your AWS RDS connection string

**For AWS RDS, the format should be:**
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]?sslmode=require
```

**Important:**
- Replace `[PASSWORD]` with your actual password (URL-encode special characters)
- Replace `[HOST]` with your RDS endpoint
- Replace `[DATABASE]` with your database name (usually `summitly`)
- Keep `?sslmode=require` for SSL connection

## Step 3: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project → **Functions** tab
2. Look for errors in the `/api/pre-con-projects` function
3. Check for these log messages:
   - `[API] Database connection: ✅ Connected` - Connection works
   - `[API] Query successful, found X projects` - Query works
   - `[API] Total published projects in database: X` - Shows if projects exist

## Step 4: Verify Projects Are Published

The API only returns projects where `isPublished: true`. Check your database:

```sql
-- Check total projects
SELECT COUNT(*) FROM "PreConstructionProject";

-- Check published projects
SELECT COUNT(*) FROM "PreConstructionProject" WHERE "isPublished" = true;

-- Check published condos
SELECT COUNT(*) FROM "PreConstructionProject" 
WHERE "isPublished" = true 
AND "propertyType" IN ('Condos', 'condos', 'CONDOS', 'Condominium');
```

## Step 5: Common Issues

### Issue 1: DATABASE_URL not set in Vercel
**Solution:** Add `DATABASE_URL` in Vercel environment variables for Production

### Issue 2: Wrong DATABASE_URL format
**Solution:** Ensure it includes:
- Correct host/endpoint
- Correct port (5432 for AWS RDS)
- `?sslmode=require` at the end
- URL-encoded password if it has special characters

### Issue 3: Database not accessible from Vercel
**Solution:** 
- Check AWS RDS security group allows connections from Vercel IPs
- Verify RDS is publicly accessible (or use VPC if needed)

### Issue 4: No published projects
**Solution:** 
- Check `isPublished` field in database
- Update projects to set `isPublished = true`

### Issue 5: PropertyType mismatch
**Solution:**
- Check what values are actually in your database
- The API now checks: 'Condos', 'condos', 'CONDOS', 'Condominium'
- Update your database if values don't match

## Step 6: Test Locally

1. Make sure your `.env.local` has the correct `DATABASE_URL`
2. Test the API locally:
   ```bash
   npm run dev
   ```
3. Visit: `http://localhost:3000/api/test-db`
4. Visit: `http://localhost:3000/api/pre-con-projects?propertyType=Condos`

## Step 7: Check Network Tab

In your browser's Developer Tools:
1. Open **Network** tab
2. Visit `/pre-con/condos`
3. Look for the `/api/pre-con-projects` request
4. Check:
   - Status code (should be 200, not 500)
   - Response body (should have `projects` array)
   - Error messages in response

## Debugging Commands

### Check if DATABASE_URL is set (in Vercel)
The test endpoint will show this in the response.

### Check database connection (local)
```bash
node scripts/test-db-connection.js
```

### Check Prisma client
```bash
npx prisma generate
npx prisma db pull
```

## Next Steps

After checking the test endpoint (`/api/test-db`), share:
1. What the test endpoint returns
2. Any errors from Vercel function logs
3. The response from `/api/pre-con-projects?propertyType=Condos`

This will help identify the exact issue.

