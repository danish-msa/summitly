# Database Setup: Pre-Construction Projects & Property Ratings

## 📋 Overview

This setup creates:
1. **PreConstructionProject** table - Stores pre-construction project data
2. **PreConstructionUnit** table - Stores individual units within projects
3. **PropertyRating** table - Generic ratings table for ALL property types (regular listings, pre-cons, etc.)

## 🗄️ Step 1: Create Database Tables

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/omsefyactufffyqaxowx
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button

3. **Copy and Paste SQL**
   - Open `prisma/migrations/create_preconstruction_and_ratings.sql`
   - Copy **ALL** the SQL content
   - Paste it into the Supabase SQL Editor

4. **Run the Migration**
   - Click **Run** button (or press `Ctrl+Enter`)
   - Wait for it to complete

5. **Verify Tables Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see these new tables:
     - `PreConstructionProject`
     - `PreConstructionUnit`
     - `PropertyRating`

### Option B: Using Prisma Migrate

If you have direct database access:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_preconstruction_and_ratings
```

## 📝 SQL Query (Complete)

The complete SQL is in `prisma/migrations/create_preconstruction_and_ratings.sql`. It includes:

- **PreConstructionProject** table with all project fields
- **PreConstructionUnit** table for individual units
- **PropertyRating** table (generic for all property types)

## 🔄 Step 2: Generate Prisma Client

After creating the tables, generate the Prisma client:

```bash
npx prisma generate
```

## ✅ Step 3: API Routes

### For Pre-Construction Projects:
- **GET/POST**: `/api/projects/[projectId]/ratings?propertyType=pre-construction`

### For Regular Properties:
- **GET/POST**: `/api/properties/[propertyId]/ratings?propertyType=regular`

Both routes work the same way, just different paths for clarity.

## 📊 Features

### Pre-Construction Projects Table:
- ✅ Stores complete project information
- ✅ Links to units via foreign key
- ✅ Supports all property types (Condo, Detached, Semi-Detached, Townhome)
- ✅ Stores development team info (as JSON)

### Property Ratings Table:
- ✅ **Works for ALL property types**: regular listings, pre-construction, etc.
- ✅ **User Ratings**: Logged-in users can rate
- ✅ **Anonymous Ratings**: Anonymous users can also rate (tracked by session)
- ✅ **One Rating Per User**: Each user can only rate once per property (can update)
- ✅ **Average Calculation**: Automatically calculates average rating
- ✅ **Real-time Updates**: Ratings update immediately after submission

## 🔐 Security Notes

- Ratings are validated (1-5 stars only)
- PropertyType is validated ('regular' or 'pre-construction')
- User authentication is optional (supports anonymous ratings)
- Session-based tracking for anonymous users prevents spam
- All database operations are server-side only

## 🚀 Usage Examples

### For Pre-Construction Projects:
```typescript
import { getPropertyRating, savePropertyRating } from '@/lib/api/project-ratings';

// Get ratings
const ratings = await getPropertyRating('luxury-heights-condominiums', 'pre-construction');

// Save rating
await savePropertyRating('luxury-heights-condominiums', 5, 'pre-construction');
```

### For Regular Properties:
```typescript
import { getPropertyRating, savePropertyRating } from '@/lib/api/project-ratings';

// Get ratings
const ratings = await getPropertyRating('ML123456', 'regular');

// Save rating
await savePropertyRating('ML123456', 4, 'regular');
```

## 📋 Next Steps

1. Run the SQL migration in Supabase
2. Generate Prisma client: `npx prisma generate`
3. Update components to use the new API (already done for pre-construction)
4. Add rating functionality to regular property listings

