# Google Maps API Cost Optimization Guide

## 🚨 Current Cost Analysis

### APIs Being Used:
1. **Places API Nearby Search**: $32 per 1,000 requests
2. **Places API Place Details**: $17 per 1,000 requests  
3. **Distance Matrix API**: $5 per 1,000 elements
4. **Geocoding API**: $5 per 1,000 requests

### Current Usage Pattern:
- **Neighborhood Amenities**: Multiple Nearby Search calls per category (one per type)
  - Example: Schools category with 5 types = 5 API calls per property page
  - If you have 10 categories with average 5 types each = 50 API calls per property page load
- **Place Details**: Called when user clicks on amenity
- **Distance Matrix**: Called for travel time calculations (2 calls per batch: walking + driving)

### Cost Estimate (Without Caching):
- **100 property page views/day** = 5,000 Nearby Search calls/day = **150,000/month**
- **Cost**: ~$4,800/month just for Nearby Search
- **Plus Place Details**: ~$500-1,000/month
- **Plus Distance Matrix**: ~$200-500/month
- **Total**: **~$5,500-6,300/month** 😱

---

## ✅ Optimizations Implemented

### 1. **API Response Caching** (Just Added)
- **Neighborhood Amenities**: Cache for 7 days
- **Place Details**: Cache for 30 days
- **Impact**: 95-99% reduction in API calls for repeated locations

### 2. **Next.js Route Caching**
- Added `revalidate` exports to cache responses
- Added `Cache-Control` headers for CDN caching

---

## 📊 Expected Cost After Optimization

### With Caching:
- **First request**: Makes API calls (cached for 7-30 days)
- **Subsequent requests**: Served from cache (FREE)
- **New properties**: Only new locations trigger API calls

### Realistic Monthly Costs:
- **100 unique properties/month**: ~5,000 Nearby Search calls = **$160/month**
- **500 Place Details views**: ~$8.50/month
- **Distance Matrix**: ~$50/month
- **Total**: **~$220/month** (96% reduction!) 🎉

---

## 🎯 Additional Optimization Recommendations

### 1. **Database Caching** (High Priority)
Store amenity data in database to avoid repeated API calls:

```typescript
// Create table: NeighborhoodAmenities
// Fields: lat, lng, category, data (JSON), updatedAt
// Cache for 7 days, refresh automatically
```

**Impact**: Eliminates API calls for cached locations entirely

### 2. **Request Deduplication**
Prevent multiple simultaneous requests for same location:

```typescript
// Use a Map to track in-flight requests
const pendingRequests = new Map<string, Promise<Response>>();
```

**Impact**: Prevents duplicate API calls during page loads

### 3. **Batch Optimization**
- Use Places API Text Search instead of multiple Nearby Search calls (if possible)
- Combine multiple types in single request where supported

**Impact**: 50-80% reduction in Nearby Search calls

### 4. **Lazy Loading**
- Only fetch amenities when user clicks on category tab
- Don't pre-fetch all categories on page load

**Impact**: 80-90% reduction in initial API calls

### 5. **Rate Limiting & Monitoring**
- Set up Google Cloud billing alerts
- Monitor API usage in Google Cloud Console
- Implement daily/monthly limits

---

## 📈 Monitoring Your Costs

### Google Cloud Console:
1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** > **Dashboard**
3. Check: **Places API**, **Distance Matrix API**, **Geocoding API** usage

### Set Up Billing Alerts:
1. Go to: **Billing** > **Budgets & alerts**
2. Create budget: Set monthly limit (e.g., $500)
3. Add alert: Email when 50%, 90%, 100% reached

---

## 🚀 Quick Wins (Do These First)

### ✅ Already Done:
- [x] Added caching to `/api/neighborhood-amenities`
- [x] Added caching to `/api/amenity-details`

### 🔜 Next Steps (Priority Order):

1. **Add Database Caching** (2-3 hours)
   - Store amenity data in database
   - Check database before making API calls
   - Refresh weekly via cron job

2. **Implement Lazy Loading** (1 hour)
   - Only fetch amenities when tab is clicked
   - Don't pre-fetch all categories

3. **Add Request Deduplication** (30 minutes)
   - Prevent duplicate simultaneous requests

4. **Set Up Billing Alerts** (10 minutes)
   - Monitor costs in Google Cloud Console

---

## 💡 Cost-Saving Tips

1. **Use Free Tier**: Google provides $200/month credit for new accounts
2. **Optimize Radius**: Use smaller radius (e.g., 2km instead of 5km) to reduce results
3. **Limit Results**: Only fetch top 10-20 amenities instead of all
4. **Cache Aggressively**: Amenities don't change often - cache for weeks
5. **Use Static Maps**: For simple map displays, use Static Maps API (cheaper)

---

## 📞 Need Help?

If costs are still high:
1. Check Google Cloud Console for actual usage
2. Review which endpoints are called most
3. Consider alternative APIs (OpenStreetMap, Mapbox) for some features
4. Implement database caching as priority #1

---

## Summary

**Before**: ~$5,500-6,300/month  
**After Caching**: ~$220/month  
**After Full Optimization**: ~$50-100/month

**Savings**: 98% reduction in costs! 🎉
