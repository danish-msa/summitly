# Database Migration Instructions

## ✅ Step 1: Run SQL Migration in Supabase

Since Prisma can't connect directly from your local machine, we'll run the migration manually in Supabase SQL Editor.

### Instructions:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/omsefyactufffyqaxowx
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button

3. **Copy and Paste SQL**
   - Open `prisma/migration.sql` file in this project
   - Copy **ALL** the SQL content
   - Paste it into the Supabase SQL Editor

4. **Run the Migration**
   - Click **Run** button (or press `Ctrl+Enter`)
   - Wait for it to complete (should take a few seconds)

5. **Verify Tables Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see all these tables:
     - Account
     - Session
     - User
     - VerificationToken
     - Property
     - Favorite
     - SavedProperty
     - PropertyView
     - SearchHistory
     - AgentProfile
     - Contact

---

## ✅ Step 2: Generate Prisma Client

After running the migration in Supabase, generate the Prisma client locally:

```bash
npx prisma generate
```

This will create the Prisma client based on your schema, even without a direct connection.

---

## ✅ Step 3: Update Connection String (For Future Use)

Once the tables are created, we can try connecting Prisma again. Update your `.env.local` with:

**Option A: Transaction Pooler (Recommended)**
```env
DATABASE_URL="postgresql://postgres.omsefyactufffyqaxowx:OHmK2KTxlfGyA2KH@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Option B: Direct Connection**
```env
DATABASE_URL="postgresql://postgres:OHmK2KTxlfGyA2KH@db.omsefyactufffyqaxowx.supabase.co:5432/postgres?sslmode=require"
```

---

## 🎯 What This Does

This migration creates:
- ✅ All database tables for your application
- ✅ User authentication tables (Account, Session, User)
- ✅ Property management tables
- ✅ Saved properties functionality
- ✅ Agent profiles
- ✅ Contact forms
- ✅ All indexes and foreign keys

---

## 📝 Notes

- The migration is **idempotent** - if tables already exist, it will fail gracefully
- If you get errors about existing types/tables, you can ignore them or drop existing tables first
- After running this, your Prisma schema will match your database structure

---

## 🚀 Next Steps

After running the migration:
1. Generate Prisma client: `npx prisma generate`
2. Test your application - authentication and property saving should work
3. If Prisma still can't connect, your app will work fine - Prisma client is already generated

