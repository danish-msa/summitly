# Repliers API - Code Examples

## 📚 Complete Usage Examples

### Example 1: Fetch and Display Listings

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

export default function ListingsPage() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      const data = await RepliersAPI.listings.fetch();
      setListings(data);
      setLoading(false);
    }
    loadListings();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {listings.map(listing => (
        <ListingCard key={listing.mlsNumber} listing={listing} />
      ))}
    </div>
  );
}
```

### Example 2: Search with Filters

```typescript
import { RepliersAPI, type ListingsParams } from '@/lib/api/repliers';

export default function SearchPage() {
  const [filters, setFilters] = useState<ListingsParams>({
    city: 'Toronto',
    minBedrooms: 2,
    maxBedrooms: 4,
    minPrice: 500000,
    maxPrice: 1000000,
    page: 1,
    resultsPerPage: 25,
  });

  async function handleSearch() {
    const result = await RepliersAPI.listings.getFiltered(filters);
    
    console.log(`Found ${result.count} listings`);
    console.log(`Page ${filters.page} of ${result.numPages}`);
    
    return result.listings;
  }

  return <SearchInterface filters={filters} onSearch={handleSearch} />;
}
```

### Example 3: Market Analytics

```typescript
import { useMarketAnalytics } from '@/hooks/useMarketAnalytics';

export default function AnalyticsChart({ property }) {
  const { marketData, listingsData, loading, error } = useMarketAnalytics({
    latitude: property.map.latitude,
    longitude: property.map.longitude,
    propertyClass: property.class,
    radiusKm: 10,
  });

  if (loading) return <Spinner />;
  if (error) return <div>Using sample data: {error}</div>;

  return (
    <>
      <PriceChart data={marketData} />
      <ListingsChart data={listingsData} />
    </>
  );
}
```

### Example 4: Similar Listings

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

async function getSimilarProperties(currentProperty: PropertyListing) {
  const similar = await RepliersAPI.listings.getSimilar({
    class: currentProperty.class,
    propertyType: currentProperty.details.propertyType,
    bedrooms: currentProperty.details.numBedrooms,
    city: currentProperty.address.city || undefined,
    minPrice: currentProperty.listPrice * 0.8,
    maxPrice: currentProperty.listPrice * 1.2,
    limit: 10,
    excludeMlsNumber: currentProperty.mlsNumber,
  });

  return similar;
}
```

### Example 5: Image Handling

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

function PropertyImage({ imagePath }: { imagePath: string }) {
  // Automatically transforms to CDN URL
  const imageUrl = RepliersAPI.listings.transformImageUrl(imagePath);
  
  // sandbox/image.jpg → https://cdn.repliers.io/sandbox/image.jpg
  
  return <img src={imageUrl} alt="Property" />;
}
```

### Example 6: Performance Monitoring

```typescript
import { repliersClient } from '@/lib/api/repliers';

export function APIMonitor() {
  const [stats, setStats] = useState(repliersClient.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(repliersClient.getStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>API Performance</h3>
      <p>Total Requests: {stats.totalRequests}</p>
      <p>Success Rate: {(stats.successfulRequests / stats.totalRequests * 100).toFixed(1)}%</p>
      <p>Cache Hit Rate: {(stats.cachedRequests / stats.totalRequests * 100).toFixed(1)}%</p>
      <p>Avg Response: {stats.averageResponseTime.toFixed(0)}ms</p>
      <p>Queue Length: {stats.queueLength}</p>
      <p>Cache Size: {stats.cacheSize}</p>
    </div>
  );
}
```

### Example 7: Cache Management

```typescript
import { repliersClient } from '@/lib/api/repliers';

// Clear cache when user updates filters
function handleFilterChange(newFilters: any) {
  repliersClient.clearCache();
  applyFilters(newFilters);
}

// Or configure cache duration
repliersClient.configure({
  defaultCacheDuration: 10 * 60 * 1000, // 10 minutes
});
```

### Example 8: Custom Configuration

```typescript
import { repliersClient } from '@/lib/api/repliers';

// Configure for high-traffic scenarios
repliersClient.configure({
  maxConcurrentRequests: 10,      // More concurrent requests
  rateLimitPerMinute: 120,        // Higher rate limit
  defaultTimeout: 45000,          // Longer timeout
  defaultMaxRetries: 5,           // More retries
  retryDelay: 500,                // Faster retry
});
```

### Example 9: Property Types with Filters

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

async function loadPropertyTypes() {
  const types = await RepliersAPI.propertyTypes.fetch();
  
  // Filter by class
  const condoTypes = types.filter(t => t.class === 'condo');
  const residentialTypes = types.filter(t => t.class === 'residential');
  
  // Sort by count
  const popular = types.sort((a, b) => b.number - a.number);
  
  return { condoTypes, residentialTypes, popular };
}
```

### Example 10: Top Cities Display

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

export default function TopCitiesSection() {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    async function loadCities() {
      const topCities = await RepliersAPI.cities.fetchTop(6);
      setCities(topCities);
    }
    loadCities();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {cities.map(city => (
        <CityCard 
          key={city.id}
          name={city.cityName}
          count={city.numberOfProperties}
          image={city.image}
        />
      ))}
    </div>
  );
}
```

### Example 11: Error Handling

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

async function fetchWithErrorHandling() {
  try {
    const result = await RepliersAPI.listings.getFiltered(params);
    
    if (result.listings.length === 0) {
      toast.info('No listings found matching your criteria');
      return [];
    }
    
    return result.listings;
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    toast.error('Failed to load listings. Please try again.');
    return []; // Return empty array as fallback
  }
}
```

### Example 12: Pagination

```typescript
import { RepliersAPI } from '@/lib/api/repliers';

export default function PaginatedListings() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ listings: [], count: 0, numPages: 0 });

  async function loadPage(pageNum: number) {
    const result = await RepliersAPI.listings.getFiltered({
      page: pageNum,
      resultsPerPage: 25,
      city: 'Toronto',
    });
    
    setData(result);
    setPage(pageNum);
  }

  return (
    <>
      <ListingGrid listings={data.listings} />
      <Pagination 
        current={page}
        total={data.numPages}
        onPageChange={loadPage}
      />
    </>
  );
}
```

### Example 13: Real-time Stats Dashboard

```typescript
import { repliersClient } from '@/lib/api/repliers';

function APIDebugPanel() {
  const [stats, setStats] = useState(repliersClient.getStats());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(repliersClient.getStats());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <div>📊 API Stats</div>
      <div>Requests: {stats.totalRequests}</div>
      <div>Success: {stats.successfulRequests}</div>
      <div>Cached: {stats.cachedRequests} ({(stats.cachedRequests/stats.totalRequests*100).toFixed(0)}%)</div>
      <div>Avg Time: {stats.averageResponseTime.toFixed(0)}ms</div>
      <div>Queue: {stats.queueLength}</div>
      <div>Rate: {stats.rateLimitUsage}</div>
      <button onClick={() => repliersClient.clearCache()}>Clear Cache</button>
    </div>
  );
}
```

---

## 🎓 Learning Path

1. **Start here**: `src/lib/api/repliers/README.md`
2. **Learn architecture**: `REPLIERS_API_ARCHITECTURE.md`
3. **See diagrams**: `src/lib/api/ARCHITECTURE.md`
4. **Try examples**: This file
5. **Read source**: `src/lib/api/repliers/client.ts`

---

## 💡 Tips

1. **Always import from unified interface**:
   ```typescript
   import { RepliersAPI } from '@/lib/api/repliers';
   ```

2. **Use TypeScript types**:
   ```typescript
   import type { ListingsParams } from '@/lib/api/repliers';
   ```

3. **Monitor in development**:
   ```typescript
   repliersClient.logStats(); // In console
   ```

4. **Clear cache strategically**:
   ```typescript
   // After user changes filters
   repliersClient.clearCache();
   ```

5. **Handle errors gracefully**:
   ```typescript
   if (!result) {
     // Show fallback UI or message
   }
   ```

---

**Happy coding! 🚀**

