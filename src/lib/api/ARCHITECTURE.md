# API Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUMMITLY APPLICATION                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REACT COMPONENTS                             │
│  • MarketAnalytics.tsx                                              │
│  • Listings.tsx                                                     │
│  • Properties.tsx                                                   │
│  • SimilarListings.tsx                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOM HOOKS                                │
│  • useMarketAnalytics.ts                                            │
│  • usePropertySearch.ts                                             │
│  • useLocationData.ts                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED API INTERFACE                            │
│                   RepliersAPI (repliers/index.ts)                   │
│                                                                     │
│  listings.fetch()                                                   │
│  listings.getFiltered()                                             │
│  listings.getSimilar()                                              │
│  propertyTypes.fetch()                                              │
│  cities.fetchTop()                                                  │
│  analytics.getMarketTrends()                                        │
│  analytics.getListingsActivity()                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                │
│                   (repliers/services/*.ts)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Listings   │  │ PropertyTypes│  │    Cities    │            │
│  │   Service    │  │   Service    │  │   Service    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  Analytics   │  │  (Future     │                               │
│  │   Service    │  │   Services)  │                               │
│  └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE API CLIENT                              │
│                    (repliers/client.ts)                             │
│                                                                     │
│  Features:                                                          │
│  ├─ Rate Limiting (60 req/min)                                     │
│  ├─ Request Queuing & Prioritization                               │
│  ├─ Response Caching (TTL-based)                                   │
│  ├─ Retry Logic (Exponential Backoff)                              │
│  ├─ Dual Authentication (Header + Query)                           │
│  ├─ Error Handling                                                 │
│  └─ Performance Monitoring                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REPLIERS API                                │
│                   https://api.repliers.io                           │
│                                                                     │
│  Endpoints:                                                         │
│  • /listings                    - Property listings                │
│  • /listings/property-types     - Property types & classes         │
│  • /locations                   - Areas, cities, neighborhoods     │
│  • /statistics                  - Market statistics                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REPLIERS CDN                                │
│                   https://cdn.repliers.io                           │
│                                                                     │
│  • Property images                                                  │
│  • Media assets                                                     │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

DATA FLOW EXAMPLE - Fetching Filtered Listings:

1. Component calls hook:
   usePropertySearch({ city: 'Toronto', minBedrooms: 2 })

2. Hook calls API:
   RepliersAPI.listings.getFiltered({ city: 'Toronto', minBedrooms: 2 })

3. Service layer processes:
   ListingsService.getListings() → transforms params

4. Core client handles:
   - Check cache (hit? return cached)
   - Check rate limit (exceeded? queue)
   - Add to queue with priority
   - Execute request with auth header
   - Retry if fails (3x with backoff)
   - Cache response (2min TTL)
   - Return transformed data

5. Data flows back up:
   Client → Service → Hook → Component

═══════════════════════════════════════════════════════════════════════

CACHING STRATEGY:

Resource         │ Cache Duration │ Reason
─────────────────┼────────────────┼─────────────────────────────
Property Types   │ 24 hours       │ Rarely changes
Cities           │ 10 minutes     │ Slow-changing aggregates
Listings         │ 2 minutes      │ Frequently updated
Analytics        │ 5 minutes      │ Moderate update frequency
Locations        │ 1 hour         │ Static geographic data

═══════════════════════════════════════════════════════════════════════

ERROR HANDLING FLOW:

Error Occurs
    │
    ▼
Is Retryable? ──No──> Return Error to Hook
    │
    Yes
    │
    ▼
Attempts < Max? ──No──> Return Error to Hook
    │
    Yes
    │
    ▼
Wait (Exponential Backoff)
    │
    ▼
Retry Request
    │
    ▼
Success? ──Yes──> Return Data
    │
    No
    │
    ▼
Increment Attempts → Loop back

═══════════════════════════════════════════════════════════════════════

