# Supabase Database Setup Guide

## ✅ Your Supabase Details
- **Project Name**: summitly
- **Project URL**: https://omsefyactufffyqaxowx.supabase.co
- **Project Reference**: omsefyactufffyqaxowx
- **Database Password**: summitly@123

## 🔧 Step 1: Get Your Database Connection String

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **summitly**

2. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll down to **Connection string**
   - Select **URI** tab
   - Copy the connection string (it should look like):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.omsefyactufffyqaxowx.supabase.co:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with: `summitly@123`
   - **Important**: If your password contains special characters like `@`, you may need to URL-encode it (`@` becomes `%40`)

3. **Alternative: Construct it manually**
   ```
   postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres
   ```
   Note: `@` is URL-encoded as `%40` in the connection string

## 📝 Step 2: Create/Update .env.local File

Create a `.env.local` file in your project root with:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres"

# NextAuth.js (Generated secret - keep this secure!)
NEXTAUTH_SECRET="bzi69MGCprBP4wVZGa4jiR2kz2HMTAx7A5K58naSNtc="
NEXTAUTH_URL="http://localhost:3000"

# Supabase (if you want to use Supabase client features)
NEXT_PUBLIC_SUPABASE_URL="https://omsefyactufffyqaxowx.supabase.co"
SUPABASE_KEY="your-supabase-anon-key-here"

# Google OAuth (optional - add when ready)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# API Keys (keep your existing ones)
NEXT_PUBLIC_REPLIERS_API_KEY="your_repliers_api_key_here"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
```

## 🚀 Step 3: Run Database Migrations

After setting up `.env.local`, run:

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init
```

## 🔍 Step 4: Verify Connection

Test the connection:

```bash
npx prisma db pull
```

If successful, you should see your database schema.

## 📋 Quick Checklist

- [ ] Get connection string from Supabase dashboard
- [ ] Create `.env.local` file with DATABASE_URL
- [ ] Add NEXTAUTH_SECRET (already generated above)
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Verify connection works

## 🐛 Troubleshooting

### Issue: "Can't reach database server"
**Solution:**
- Check that your password is URL-encoded correctly (`@` → `%40`)
- Verify the connection string format
- Make sure your Supabase project is active

### Issue: "Password authentication failed"
**Solution:**
- Double-check your password: `summitly@123`
- Try URL-encoding special characters
- Verify password in Supabase dashboard

### Issue: "Connection timeout"
**Solution:**
- Check your internet connection
- Verify Supabase project is not paused
- Try using connection pooling URL (add `?pgbouncer=true`)

### Issue: "SSL required"
**Solution:**
- Add `?sslmode=require` to connection string
- Or use Supabase's connection pooling URL

## 🔐 Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Keep NEXTAUTH_SECRET secure** - Don't share it publicly
3. **Use connection pooling** - For production, use Supabase's connection pooler
4. **Rotate secrets** - Change passwords periodically

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/using-prisma-with-supabase)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

