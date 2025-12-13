#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from services.listings_service import listings_service
import json

# Test with exact params from logs
result = listings_service.search_listings(
    city='Toronto',
    property_style='condo',
    min_bedrooms=2,
    max_bedrooms=2,
    max_price=800000,
    status='A',
    transaction_type='sale',
    page=1,
    page_size=20
)

print("=" * 70)
print("API Response Structure:")
print("=" * 70)
print(f"Type: {type(result)}")
print(f"Keys: {list(result.keys())}")
print()

for key in result.keys():
    value = result[key]
    if isinstance(value, list):
        print(f"{key}: list with {len(value)} items")
    elif isinstance(value, dict):
        print(f"{key}: dict with keys {list(value.keys())[:5]}")
    else:
        print(f"{key}: {value}")

print()
print("=" * 70)

# Check what enhanced_mls_service is looking for
if 'results' in result:
    print("✅ Has 'results' key")
    print(f"   Count: {len(result['results'])}")
elif 'listings' in result:
    print("✅ Has 'listings' key")
    print(f"   Count: {len(result['listings'])}")
else:
    print("❌ No 'results' or 'listings' key found!")
    
if 'total' in result:
    print(f"✅ Has 'total' key: {result['total']}")
elif 'count' in result:
    print(f"✅ Has 'count' key: {result['count']}")
else:
    print("❌ No 'total' or 'count' key found!")
