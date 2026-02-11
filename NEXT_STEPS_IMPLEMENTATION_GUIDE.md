# Next Steps Implementation Guide - Performance Optimization

## 🎯 Priority Order (Biggest Impact First)

### **Step 1: Add API Response Caching** ⚡ (HIGHEST PRIORITY)
**Expected Impact**: 50-70% reduction in API response times

#### 1.1 Fix `/api/pre-con-projects` Route

**Current Issue**: No caching, takes 6+ seconds per request

**Solution**: Add Next.js caching with revalidation

```typescript
// src/app/api/pre-con-projects/route.ts

// Add at the top of the file, after imports
export const dynamic = 'force-dynamic'; // Keep dynamic for real-time data
export const revalidate = 60; // Cache for 60 seconds

// In your GET function, wrap the response:
export async function GET(request: NextRequest) {
  // ... existing code ...
  
  // At the end, before returning:
  return NextResponse.json(
    { projects: transformedProjects, total: totalCount },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
```

#### 1.2 Fix `/api/property-categories` Route

**Current Status**: Already has `revalidate = 300` ✅, but can be optimized

**Improvement**: Reduce revalidation time and add better cache headers

```typescript
// src/app/api/property-categories/route.ts

// Change from:
export const revalidate = 300; // 5 minutes

// To:
export const revalidate = 60; // 1 minute (more frequent updates)

// Add cache headers in response:
return NextResponse.json(categories, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  },
});
```

#### 1.3 Fix `/api/development-team` Route

**Current Issue**: No caching, called multiple times

**Solution**: Add caching

```typescript
// src/app/api/development-team/route.ts

// Add at the top:
export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes (teams don't change often)

// In GET function, before return:
return NextResponse.json(
  {
    teams: result,
    total: filteredMembers.length,
  },
  {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  }
);
```

---

### **Step 2: Optimize Database Queries** 🗄️ (HIGH PRIORITY)
**Expected Impact**: 30-50% reduction in query time

#### 2.1 Optimize `/api/pre-con-projects` Query

**Current Issue**: Fetching all fields, no indexes mentioned

**Solution**: Select only needed fields

```typescript
// In src/app/api/pre-con-projects/route.ts

// Find the prisma query (around line 150-200)
// Change from:
const projects = await prisma.preConstructionProject.findMany({
  where: { AND: whereConditions },
  include: {
    developer: true, // This might be causing slowness
  },
  // ... rest
});

// To (select only what you need):
const projects = await prisma.preConstructionProject.findMany({
  where: { AND: whereConditions },
  select: {
    id: true,
    mlsNumber: true,
    projectName: true,
    city: true,
    propertyType: true,
    images: true,
    status: true,
    featured: true,
    developer: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    // Only select fields you actually use
  },
  // ... rest
});
```

#### 2.2 Optimize `/api/development-team` Query

**Current Issue**: N+1 query problem (counting projects for each team member)

**Solution**: Use aggregation or batch queries

```typescript
// In src/app/api/development-team/route.ts

// Replace the Promise.all with project counts (around line 32-49)
// Current (SLOW - N+1 queries):
const teamMembersWithCounts = await Promise.all(
  teamMembers.map(async (member) => {
    const projectCount = await prisma.preConstructionProject.count({
      where: { /* ... */ },
    });
    return { ...member, projectCount };
  })
);

// Better (FAST - Single query with groupBy):
// First, get all project counts in one query
const projectCounts = await prisma.preConstructionProject.groupBy({
  by: ['developer'],
  where: { isPublished: true },
  _count: { developer: true },
});

// Create a map for quick lookup
const countMap = new Map(
  projectCounts.map(pc => [pc.developer, pc._count.developer])
);

// Then map team members with counts
const teamMembersWithCounts = teamMembers.map(member => ({
  ...member,
  projectCount: countMap.get(member.id) || 0,
}));
```

#### 2.3 Add Database Indexes

**Create a migration file**:

```sql
-- prisma/migrations/add_performance_indexes/migration.sql

-- Index for pre-construction projects
CREATE INDEX IF NOT EXISTS idx_precon_published ON "PreConstructionProject"("isPublished");
CREATE INDEX IF NOT EXISTS idx_precon_featured ON "PreConstructionProject"("featured");
CREATE INDEX IF NOT EXISTS idx_precon_status ON "PreConstructionProject"("status");
CREATE INDEX IF NOT EXISTS idx_precon_city ON "PreConstructionProject"("city");
CREATE INDEX IF NOT EXISTS idx_precon_property_type ON "PreConstructionProject"("propertyType");
CREATE INDEX IF NOT EXISTS idx_precon_developer ON "PreConstructionProject"("developer");

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_precon_published_featured ON "PreConstructionProject"("isPublished", "featured");

-- Index for development team
CREATE INDEX IF NOT EXISTS idx_devteam_type ON "DevelopmentTeam"("type");
CREATE INDEX IF NOT EXISTS idx_devteam_name ON "DevelopmentTeam"("name");
```

**Or use Prisma migration**:

```bash
# Create migration
npx prisma migrate dev --name add_performance_indexes

# Then add indexes to schema.prisma:
model PreConstructionProject {
  // ... existing fields ...
  
  @@index([isPublished])
  @@index([featured])
  @@index([status])
  @@index([city])
  @@index([propertyType])
  @@index([developer])
  @@index([isPublished, featured])
}

model DevelopmentTeam {
  // ... existing fields ...
  
  @@index([type])
  @@index([name])
}
```

---

### **Step 3: Implement React Query for Client-Side Caching** 🔄 (MEDIUM PRIORITY)
**Expected Impact**: Eliminates duplicate API calls, better UX

#### 3.1 Install React Query (if not already installed)

```bash
npm install @tanstack/react-query
```

#### 3.2 Create Query Hooks

**Create**: `src/hooks/usePreConProjects.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

interface PreConProjectsParams {
  limit?: number;
  featured?: boolean;
  status?: string;
  city?: string;
}

export function usePreConProjects(params: PreConProjectsParams = {}) {
  return useQuery({
    queryKey: ['preConProjects', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.featured) searchParams.set('featured', 'true');
      if (params.status) searchParams.set('status', params.status);
      if (params.city) searchParams.set('city', params.city);
      
      const response = await fetch(`/api/pre-con-projects?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
```

**Create**: `src/hooks/usePropertyCategories.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

export function usePropertyCategories() {
  return useQuery({
    queryKey: ['propertyCategories'],
    queryFn: async () => {
      const response = await fetch('/api/property-categories');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
```

#### 3.3 Update Components to Use React Query

**Update**: `src/components/Home/PreConstruction/PreConstruction.tsx`

```typescript
// Replace useEffect with React Query
import { usePreConProjects } from '@/hooks/usePreConProjects';

const PreConstruction: React.FC = () => {
  const { data, isLoading, error } = usePreConProjects({ 
    limit: 4, 
    featured: true 
  });

  // Remove the useEffect and useState for projects
  // Use data.projects instead
  const projects = data?.projects || [];
  
  // ... rest of component
};
```

**Update**: `src/components/Home/PropertyCategories/PropertyCategories.tsx`

```typescript
import { usePropertyCategories } from '@/hooks/usePropertyCategories';

const PropertyCategories = () => {
  const { data: categoriesData, isLoading } = usePropertyCategories();
  
  // Remove useEffect and useState
  // Use categoriesData directly
  const categories = propertyCategoriesConfig.map(cat => ({
    ...cat,
    count: categoriesData?.[cat.apiKey]?.count || 0,
  }));
  
  // ... rest of component
};
```

---

### **Step 4: Additional Optimizations** 🚀 (LOW PRIORITY)

#### 4.1 Optimize Image Loading

**Add priority to above-fold images**:

```typescript
// In Hero component
<Image
  src="/images/HeroImage.jpg"
  fill
  priority // Add this for LCP image
  sizes="100vw"
  alt="Hero"
/>
```

#### 4.2 Reduce Bundle Size

**Lazy load heavy libraries**:

```typescript
// Instead of:
import AOS from 'aos';

// Use:
const AOS = lazy(() => import('aos'));
```

#### 4.3 Add Loading States

**Improve perceived performance**:

```typescript
// Show skeleton loaders instead of blank screens
if (isLoading) {
  return <PropertyCardSkeleton />;
}
```

---

## 📋 Implementation Checklist

### Phase 1: Quick Wins (Do First - 1-2 hours)
- [ ] Add caching to `/api/pre-con-projects` (Step 1.1)
- [ ] Optimize `/api/property-categories` cache headers (Step 1.2)
- [ ] Add caching to `/api/development-team` (Step 1.3)

### Phase 2: Database Optimization (2-3 hours)
- [ ] Add database indexes (Step 2.3)
- [ ] Optimize pre-con-projects query (Step 2.1)
- [ ] Fix N+1 query in development-team (Step 2.2)

### Phase 3: Client-Side Caching (3-4 hours)
- [ ] Install React Query
- [ ] Create query hooks
- [ ] Update components to use React Query

### Phase 4: Polish (1-2 hours)
- [ ] Add priority to hero images
- [ ] Add loading skeletons
- [ ] Test and measure improvements

---

## 🧪 Testing After Implementation

1. **Measure Before/After**:
   ```bash
   # Use Chrome DevTools Network tab
   # Or Lighthouse
   npm run build
   npm run start
   # Run Lighthouse audit
   ```

2. **Expected Results**:
   - API response times: < 500ms (from 6+ seconds)
   - Page load time: < 3 seconds (from 26 seconds)
   - Time to Interactive: < 5 seconds
   - Lighthouse Performance: 90+ (from current)

3. **Monitor in Production**:
   - Set up error tracking
   - Monitor API response times
   - Track Core Web Vitals

---

## 🆘 Troubleshooting

### If caching doesn't work:
- Check `dynamic` export is set correctly
- Verify `revalidate` value
- Check Next.js version (needs 13.4+)

### If queries are still slow:
- Check database connection pooling
- Verify indexes were created
- Use Prisma query logging to see actual queries

### If React Query causes issues:
- Check QueryClient is properly set up
- Verify staleTime and gcTime values
- Check for query key mismatches

---

## 📚 Resources

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 🎯 Success Metrics

After implementing all steps, you should see:
- ✅ 70-80% reduction in API response times
- ✅ 50-60% faster page load
- ✅ No duplicate API calls
- ✅ Better user experience with loading states
- ✅ Reduced server load

