# Repliers API - Quick Reference

## 🚀 Quick Start

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

// Fetch listings
const listings = await RepliersAPI.listings.fetch();

// Search with filters
const results = await RepliersAPI.listings.getFiltered({
  city: 'Toronto',
  minBedrooms: 2,
  page: 1,
});
```

## 📚 API Reference

### Listings

```typescript
// All listings
RepliersAPI.listings.fetch()

// Filtered search
RepliersAPI.listings.getFiltered(params: ListingsParams)

// Similar listings
RepliersAPI.listings.getSimilar(params)

// Single listing
RepliersAPI.listings.getDetails(mlsNumber: string)

// Transform image URL
RepliersAPI.listings.transformImageUrl(path: string)
```

### Property Types

```typescript
// All property types
RepliersAPI.propertyTypes.fetch()

// Property classes (aggregated)
RepliersAPI.propertyTypes.fetchClasses()
```

### Cities

```typescript
// Top cities by count
RepliersAPI.cities.fetchTop(limit: number)
```

### Analytics

```typescript
// Market trends
RepliersAPI.analytics.getMarketTrends({
  latitude: number,
  longitude: number,
  radiusKm?: number,
  propertyClass?: string,
})

// Listings activity
RepliersAPI.analytics.getListingsActivity(params)
```

### Client Utilities

```typescript
// Get statistics
RepliersAPI.client.getStats()

// Clear cache
RepliersAPI.client.clearCache()

// Configure
RepliersAPI.client.configure({ maxConcurrentRequests: 10 })
```

## ⚙️ Configuration

Add to `.env.local`:
```
NEXT_PUBLIC_REPLIERS_API_KEY=your_key_here
```

## 📦 Files

- `client.ts` - Core API client
- `services/listings.ts` - Listings operations
- `services/property-types.ts` - Property types & classes
- `services/cities.ts` - Cities data
- `services/analytics.ts` - Market analytics
- `index.ts` - Main exports

## ✨ Features

- ✅ Auto rate limiting (60 req/min)
- ✅ Response caching (2-24hrs TTL)
- ✅ Auto retry on failures
- ✅ Dual auth methods
- ✅ Full TypeScript support
- ✅ Performance monitoring

For full documentation, see `REPLIERS_API_ARCHITECTURE.md`.

