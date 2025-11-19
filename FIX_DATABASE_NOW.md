# 🚨 IMMEDIATE FIX: Database Connection Error

## Current Error
```
Can't reach database server at aws-1-ap-southeast-1.pooler.supabase.com:6543
```

## ✅ SOLUTION: Use DIRECT Connection (Recommended for Development)

### Step 1: Get Your Direct Connection String

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Click **URI** tab (NOT Session mode)
6. Copy the connection string
7. **IMPORTANT**: Add `?sslmode=require` at the end

**Example format:**
```
postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

### Step 2: Update Your .env.local File

Open `.env.local` and update `DATABASE_URL`:

```env
# Replace with your DIRECT connection string (port 5432)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual password
- If password contains special characters, URL-encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - etc.
- Replace `YOUR_PROJECT_REF` with your Supabase project reference

### Step 3: Verify Supabase Project is Active

1. In Supabase Dashboard → **Settings** → **General**
2. Check if project status is **Active**
3. If it shows **Paused**, click **Restore** button

### Step 4: Clear Cache and Restart

```powershell
# 1. Stop your dev server (Ctrl+C)

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next

# 3. Regenerate Prisma client
npx prisma generate

# 4. Test connection (optional)
node scripts/test-db-connection.js

# 5. Start dev server
npm run dev
```

---

## 🔍 Why This Happens

1. **Connection Pooler Issues**: The pooler (port 6543) can be unreliable for development
2. **Project Paused**: Supabase projects pause after inactivity
3. **Network Issues**: Firewall or network blocking the connection
4. **Wrong Connection String**: Missing SSL or PgBouncer parameters

---

## 📊 Connection Types Explained

### DIRECT Connection (Port 5432) ✅ RECOMMENDED FOR DEV
- **Pros**: More reliable, fewer connection issues, simpler setup
- **Cons**: Limited concurrent connections
- **Use When**: Development, local testing
- **Format**: `postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require`

### CONNECTION POOLER (Port 6543) ✅ RECOMMENDED FOR PRODUCTION
- **Pros**: Better for serverless, handles high concurrency
- **Cons**: Can have connection issues, requires `pgbouncer=true`
- **Use When**: Production, serverless deployments
- **Format**: `postgresql://postgres.PROJECT:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true`

---

## ✅ Quick Checklist

- [ ] Updated `DATABASE_URL` in `.env.local` with DIRECT connection (port 5432)
- [ ] Added `?sslmode=require` to connection string
- [ ] Verified Supabase project is **Active** (not paused)
- [ ] Cleared `.next` folder
- [ ] Regenerated Prisma client (`npx prisma generate`)
- [ ] Restarted dev server

---

## 🆘 Still Having Issues?

1. **Test connection manually:**
   ```bash
   node scripts/test-db-connection.js
   ```

2. **Check Supabase Dashboard:**
   - Project status
   - Database connection settings
   - Any error messages

3. **Verify connection string format:**
   - Should start with `postgresql://`
   - Should include `:5432` for direct connection
   - Should end with `?sslmode=require`

4. **Check network:**
   - Try accessing Supabase dashboard
   - Check if firewall is blocking port 5432

---

## 📝 After Fixing

Once your connection works, you can:
- Use DIRECT connection for development
- Switch to POOLER connection for production (when deploying)

The updated `src/lib/prisma.ts` will automatically handle both connection types correctly.

