# Market Trends API Optimization

## Overview

This document describes the optimization implemented to reduce API calls and improve performance for the market trends page.

## Problem

Previously, each component (`HousingPricesSection`, `HousingInventorySection`, `MarketStats`) was making separate API calls to `/api/market-trends/[locationType]/[locationName]`:

- **3+ API calls** per page load
- **3+ API calls** every time filters changed
- Redundant requests with identical parameters
- Slower page load times
- Higher server load

## Solution

Implemented a centralized data fetching pattern using a custom React hook (`useMarketTrends`) that:

1. **Fetches all data once** at the page level
2. **Deduplicates requests** - prevents multiple components from making the same API call
3. **Passes data down** to child components as props
4. **Only refetches** when filters actually change

## Architecture

### 1. Centralized Hook (`src/hooks/useMarketTrends.ts`)

- Single source of truth for market trends data
- Request deduplication using `useRef` to track ongoing requests
- Automatic refetch when filter parameters change
- Manual refresh capability
- Loading and error states

### 2. Page-Level Data Fetching (`LocationTrendsPage.tsx`)

- Uses `useMarketTrends` hook to fetch all data once
- Passes `marketTrendsData` and `onRefresh` to child components
- Handles loading and error states at the page level

### 3. Child Components (Props-Based)

All child components now accept data as props instead of fetching:

- `HousingPricesSection` - receives `marketTrendsData` prop
- `HousingInventorySection` - receives `marketTrendsData` prop  
- `MarketStats` - receives `marketTrendsData` prop (optional for backward compatibility)

## Benefits

### Performance Improvements

- **Reduced API calls**: From 3+ calls to **1 call** per filter change
- **Faster page loads**: Single request instead of multiple parallel requests
- **Better caching**: Single cache entry per filter combination
- **Reduced server load**: Fewer requests to process

### Code Quality

- **Single source of truth**: All data comes from one place
- **Easier debugging**: One place to check API calls
- **Better maintainability**: Changes to API structure only need to be made in one place
- **Type safety**: Shared `MarketTrendsData` interface ensures consistency

## Data Flow

```
LocationTrendsPage
  └─ useMarketTrends() → Single API call
      └─ marketTrendsData
          ├─ HousingPricesSection (receives as prop)
          ├─ HousingInventorySection (receives as prop)
          └─ MarketStats (receives as prop)
```

## Request Deduplication

The hook uses a `useRef` to track ongoing requests:

```typescript
// If there's an ongoing request with the same parameters, wait for it
if (ongoingRequestRef.current && requestKeyRef.current === requestKey) {
  await ongoingRequestRef.current;
  return;
}
```

This ensures that even if multiple components try to use the hook simultaneously, only one API call is made.

## Backward Compatibility

`MarketStats` component maintains backward compatibility - if `marketTrendsData` is not provided, it falls back to fetching data itself. This allows it to be used in other contexts where the centralized hook isn't available.

## Filter Changes

When filters change (location, property type, community, years), the hook automatically refetches data because the parameters change. All child components receive the updated data automatically through props.

## Future Improvements

1. **React Query Integration**: Consider using React Query or SWR for more advanced caching, background refetching, and optimistic updates
2. **Request Batching**: If multiple pages need data, batch requests together
3. **Prefetching**: Prefetch data for likely filter combinations
4. **Optimistic Updates**: Update UI immediately while refetching in the background

## Testing

To verify the optimization:

1. Open browser DevTools → Network tab
2. Navigate to a trends page
3. Change filters (location, property type, years)
4. Verify only **1 API call** is made per filter change
5. Check that all components update correctly with the new data

## Migration Notes

If you need to add new components that use market trends data:

1. **Don't** create new API calls in the component
2. **Do** accept `marketTrendsData` as a prop from `LocationTrendsPage`
3. **Do** use the `useMarketTrends` hook if the component is used outside of `LocationTrendsPage`

