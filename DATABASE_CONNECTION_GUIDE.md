# Optimal Database Connection Setup for Prisma + Supabase

## 🎯 Recommended Approach

### For Development (Current Setup)
**Use DIRECT connection** (port 5432) - More reliable, fewer connection issues

### For Production
**Use CONNECTION POOLER** (port 6543) - Better for serverless/high concurrency

---

## 📋 Step-by-Step Setup

### Step 1: Get Your Connection Strings from Supabase

1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
2. Click **Settings** → **Database**
3. Scroll to **Connection string** section

You'll see two options:

#### Option A: Direct Connection (RECOMMENDED for Development)
- Click **URI** tab
- Copy the connection string
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- **Add SSL parameter**: Append `?sslmode=require` at the end

#### Option B: Connection Pooler (For Production)
- Click **Session mode** tab (NOT Transaction mode)
- Copy the connection string
- Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[REGION].pooler.supabase.com:6543/postgres`
- **Add PgBouncer parameter**: Append `?pgbouncer=true` at the end

---

### Step 2: Update Your .env File

**For Development (.env.local):**
```env
# Use DIRECT connection (more reliable for development)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

**For Production (.env.production):**
```env
# Use CONNECTION POOLER (better for production/serverless)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with your actual password (URL-encode special characters)
- Replace `YOUR_PROJECT_REF` with your Supabase project reference
- Replace `REGION` with your actual region (e.g., `ap-southeast-1`, `us-east-1`)

---

### Step 3: Verify Your Supabase Project Status

1. Check if your project is **Active** (not paused)
2. Go to **Settings** → **General** → Check project status
3. If paused, click **Restore** to activate it

---

### Step 4: Test Connection

```bash
# Test Prisma connection
npx prisma db pull

# If successful, generate client
npx prisma generate
```

---

## 🔧 Troubleshooting

### Error: "Can't reach database server"
**Causes:**
1. Project is paused → Restore it in Supabase dashboard
2. Wrong connection string → Verify in Supabase dashboard
3. Network/firewall blocking → Check your network settings
4. Wrong port → Use 5432 for direct, 6543 for pooler

### Error: "prepared statement does not exist"
**Solution:** Use `?pgbouncer=true` with connection pooler, or use direct connection

### Error: "SSL connection required"
**Solution:** Add `?sslmode=require` to direct connection string

---

## ✅ Best Practices

1. **Development**: Always use DIRECT connection (port 5432)
2. **Production**: Use CONNECTION POOLER (port 6543) with `pgbouncer=true`
3. **Connection Limits**: Prisma handles this automatically
4. **Error Handling**: The Prisma client includes retry logic
5. **Caching**: Clear `.next` folder after connection string changes

---

## 🚀 Quick Fix Commands

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next  # Windows PowerShell
# OR
rm -rf .next  # Mac/Linux

# 3. Regenerate Prisma client
npx prisma generate

# 4. Test connection
npx prisma db pull

# 5. Restart dev server
npm run dev
```

