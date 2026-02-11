# 🚀 Switch to Supabase Connection Pooler (FIXES CONNECTION TIMEOUTS)

## ⚠️ Why Switch?

Your current **direct connection** (port 5432) is causing:
- ❌ DbHandler process termination
- ❌ Connection timeouts
- ❌ "Unable to check out process from the pool" errors

**Connection Pooler** (port 6543) fixes these issues by:
- ✅ Handling serverless/Next.js environments better
- ✅ Preventing connection exhaustion
- ✅ More stable connection management

---

## 📋 Step-by-Step Instructions

### Step 1: Get Your Pooler Connection String

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **summitly**

2. **Navigate to Database Settings**
   - Click **Settings** (gear icon) → **Database**
   - Scroll to **Connection string** section

3. **Copy Pooler Connection String**
   - **Recommended**: Click **Session mode** tab (better for Prisma)
   - **Alternative**: Transaction mode also works but Session mode is preferred
   - Copy the connection string
   - Your pooler URL format:
     ```
     postgresql://postgres.omsefyactufffyqaxowx:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
     ```

4. **Your Specific Pooler URL**
   - You already have: `postgresql://postgres.omsefyactufffyqaxowx:OHmK2KTxlfGyA2KH@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`
   - **Note**: This is Transaction mode. For best Prisma compatibility, use **Session mode** from Supabase Dashboard
   - Our code will auto-add `pgbouncer=true` if missing

5. **Add PgBouncer Parameter** (if not already present)
   - Add `?pgbouncer=true` at the end (our code will auto-add this, but you can add it manually)
   - Final URL format:
     ```
     postgresql://postgres.omsefyactufffyqaxowx:OHmK2KTxlfGyA2KH@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

---

### Step 2: Update Environment Variables

#### For Local Development (.env.local)

```env
# Replace your current DATABASE_URL with the pooler URL
# Using your Transaction pooler URL (Session mode recommended but Transaction works too)
DATABASE_URL="postgresql://postgres.omsefyactufffyqaxowx:OHmK2KTxlfGyA2KH@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Note**: The code will auto-add `pgbouncer=true` if missing, so you can omit it from the URL.

#### For Production (Vercel)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Update it with the pooler URL from Step 1
4. **Important**: Make sure to select the correct environment (Production, Preview, Development)

---

### Step 3: Verify the Change

After updating `DATABASE_URL`, restart your dev server and check the console logs:

**You should see:**
```
🔍 Prisma DB URL preview: postgresql://postgres.omsefyactufffyqaxowx:****@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
🔍 Connection type: ✅ POOLER (recommended)
🔒 SSL Configuration: Enabled
```

**You should NOT see:**
```
⚠️  WARNING: Using DIRECT connection (port 5432)
```

---

### Step 4: Test the Connection

1. **Restart your dev server**
   ```bash
   # Stop server (Ctrl+C)
   # Clear cache
   rm -rf .next
   # Restart
   npm run dev
   ```

2. **Test User Management Module**
   - Navigate to `/dashboard/admin/users`
   - Should load without timeout errors

3. **Check Console Logs**
   - Look for: `✅ PostgreSQL connection established`
   - No errors about "Connection terminated" or "timeout"

---

## 🔍 Troubleshooting

### Issue: "Can't reach database server at pooler.supabase.com"

**Solution:**
- Verify your Supabase project is **Active** (not paused)
- Check if your region is correct in the pooler URL
- Try copying the pooler URL directly from Supabase Dashboard again

### Issue: Still seeing direct connection warnings

**Solution:**
- Double-check your `.env.local` file has the pooler URL (port 6543)
- Make sure you're not overriding `DATABASE_URL` elsewhere
- Restart your dev server after changing `.env.local`

### Issue: Connection still timing out

**Solution:**
- Verify `pgbouncer=true` is in the connection string
- Check Supabase Dashboard → Database → Connection Pooling is enabled
- Try the **Transaction mode** pooler URL instead (though Session mode is recommended)

---

## ✅ Expected Behavior After Switch

- ✅ No more "Connection terminated" errors
- ✅ No more "Unable to check out process" errors
- ✅ User Management module loads successfully
- ✅ All API routes (`/api/admin/users`, `/api/tours`, etc.) work without timeouts
- ✅ Console shows "✅ POOLER (recommended)" instead of warnings

---

## 📚 Reference

- **Supabase Docs**: https://supabase.com/docs/guides/database/connecting-to-postgres
- **Prisma + Supabase**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

