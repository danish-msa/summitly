# Database Migration: Add Videos Field to PreConstructionProject

## Overview
This migration adds a `videos` field to the `PreConstructionProject` table to support video URLs for pre-construction projects.

## Migration Steps

### 1. Update Prisma Schema
The Prisma schema has been updated to include:
```prisma
// Videos
videos String[] @default([])
```

### 2. Run Database Migration
Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Add videos field to PreConstructionProject table
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];

```

Or use the migration file:
```bash
# The SQL script is located at:
prisma/migrations/add_videos_field.sql
```

### 3. Regenerate Prisma Client
After applying the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

## Verification

After running the migration, verify that:
1. The `videos` column exists in the `PreConstructionProject` table
2. The column type is `TEXT[]` (array of text)
3. The default value is an empty array `[]`

## Notes

- The `videos` field stores an array of video URLs (YouTube, Vimeo, or direct video URLs)
- Videos are displayed in the admin dashboard alongside images
- The public API endpoint includes videos in the project response
- Video URLs are automatically converted to embed URLs for YouTube and Vimeo when displayed

