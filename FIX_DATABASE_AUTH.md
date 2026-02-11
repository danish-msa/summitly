# 🔐 Database Authentication Fix

## Problem
Your application is failing with this error:
```
Authentication failed against the database server, the provided database credentials for `user` are not valid
```

**Root Cause:** The `DATABASE_URL` in `.env.local` is using placeholder credentials (`postgres:your_postgres_password`) instead of your actual PostgreSQL password.

---

## ✅ Solution

### Option 1: Automated Setup (Recommended)

Run this script and enter your PostgreSQL password when prompted:

```powershell
.\set-db-password.ps1
```

The script will:
- Prompt for your PostgreSQL password securely
- Update `.env.local` with the correct credentials
- Test the database connection
- Confirm everything works

---

### Option 2: Manual Setup

#### Step 1: Find Your PostgreSQL Password

Your PostgreSQL password is the one you set during PostgreSQL installation. Common defaults:
- `postgres`
- `admin`
- Or the custom password you chose

#### Step 2: Test the Connection

Test your password with this command:
```powershell
psql -U postgres -d summitly -c "\dt"
```

It will prompt for your password. If it works, you'll see a list of tables.

#### Step 3: Update .env.local

Edit `.env.local` and replace `your_postgres_password` with your actual password:

**Before:**
```env
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/summitly?schema=public&sslmode=disable"
```

**After:**
```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/summitly?schema=public&sslmode=disable"
```

**⚠️ Important:** If your password contains special characters (`@`, `#`, `%`, etc.), URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `!` → `%21`
- `space` → `%20`

Example: `my@pass#word` becomes `my%40pass%23word`

#### Step 4: Restart Services

```powershell
.\stop.ps1
.\start.ps1
```

---

## 🧪 Verify the Fix

After updating your password, you should see:
- ✅ No more "Authentication failed" errors
- ✅ Pre-construction projects load on homepage
- ✅ Development teams load in navigation
- ✅ All Prisma database queries work

---

## ❓ Troubleshooting

### "psql: command not found"
PostgreSQL command-line tools aren't in your PATH. Either:
1. Add PostgreSQL bin directory to PATH: `C:\Program Files\PostgreSQL\16\bin`
2. Or use pgAdmin to verify your password

### "database 'summitly' does not exist"
Create the database first:
```powershell
psql -U postgres -c "CREATE DATABASE summitly;"
```

Then run migrations:
```powershell
npx prisma migrate deploy
```

### "Connection refused"
PostgreSQL service isn't running. Start it:
```powershell
Start-Service postgresql-x64-16  # Adjust version number if different
```

Or use Services app (services.msc) to start "PostgreSQL" service.

---

## 📝 What Was Changed

### Files Updated:
1. **`.env.local`** - Changed default username from `user` to `postgres`
2. **`start.ps1`** - Updated DATABASE_URL example
3. **`src/lib/prisma.ts`** - Fixed SSL detection logic (already done)

### Why This Fix Works:
- PostgreSQL on Windows uses `postgres` as the default superuser, not `user`
- Your actual password must replace the placeholder
- The connection string now properly disables SSL for local development

---

## 🔒 Security Note

**Never commit `.env.local` to Git!** It contains your database password.

The file is already in `.gitignore`, but double-check:
```powershell
git status
```

If `.env.local` appears, remove it:
```powershell
git rm --cached .env.local
```

---

## 🚀 Next Steps

After fixing the database password:

1. **Test the homepage**: http://localhost:3000
   - Pre-construction projects should load
   - No 500 errors in console

2. **Test listings page**: http://localhost:3000/listings
   - Property listings load
   - Map displays with clusters
   - Filters work

3. **Check pre-construction**: http://localhost:3000/pre-construction
   - Projects display by city
   - Developer filters work

All database-dependent features should now work correctly!
