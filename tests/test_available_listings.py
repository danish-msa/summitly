#!/usr/bin/env python3
"""
Test to see what MLS listings are actually available in the Repliers API
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.repliers_valuation_api import _make_api_request
import json

print("=" * 80)
print("TESTING AVAILABLE REPLIERS LISTINGS")
print("=" * 80)
print()

# Use the same Ontario map
ontario_map = [[-82.93036962053748, 42.07088416140104], [-88.07379550946587, 42.07088416140104], [-88.07379550946587, 16.242913731111116], [-82.93036962053748, 16.242913731111116]]

# Test 1: Get ANY active listings
print("TEST 1: Fetch 5 active listings from Toronto")
print("-" * 80)

params = {
    'city': 'Toronto',
    'map': json.dumps([ontario_map]),
    'fields': 'boardId,mlsNumber,status,listPrice,address,details',
    'limit': 5,
    'status': 'A'  # Active listings
}

response = _make_api_request('/listings', params=params)

if response:
    if isinstance(response, list):
        listings = response
    else:
        listings = response.get('listings', response.get('results', []))
    
    print(f"✅ Found {len(listings)} active listings")
    print()
    
    for i, listing in enumerate(listings[:5], 1):
        mls = listing.get('mlsNumber', 'N/A')
        price = listing.get('listPrice', 0)
        address = listing.get('address', {})
        city = address.get('city', 'N/A')
        street = f"{address.get('streetNumber', '')} {address.get('streetName', '')}".strip()
        
        details = listing.get('details', {})
        beds = details.get('numBedrooms', 'N/A')
        baths = details.get('numBathrooms', 'N/A')
        sqft = details.get('sqft', 'N/A')
        prop_type = details.get('propertyType', 'N/A')
        
        print(f"  {i}. MLS#{mls}")
        print(f"     Address: {street}, {city}")
        print(f"     Price: ${price:,}")
        print(f"     Type: {prop_type} | {beds} beds | {baths} baths | {sqft} sqft")
        print()
else:
    print("❌ No response from API")

print("=" * 80)
print()

# Test 2: Try searching by one of the returned MLS numbers
if response and listings:
    test_mls = listings[0].get('mlsNumber')
    print(f"TEST 2: Search for specific MLS# {test_mls}")
    print("-" * 80)
    
    params2 = {
        'mlsNumber': test_mls,
        'map': json.dumps([ontario_map]),
        'fields': 'boardId,mlsNumber,status,listPrice,address,details',
        'limit': 1
    }
    
    response2 = _make_api_request('/listings', params=params2)
    
    if response2:
        if isinstance(response2, list):
            listings2 = response2
        else:
            listings2 = response2.get('listings', response2.get('results', []))
        
        if listings2:
            print(f"✅ Successfully found MLS#{test_mls} by direct search!")
            listing = listings2[0]
            print(f"   Address: {listing.get('address', {}).get('streetName', 'N/A')}")
            print(f"   Price: ${listing.get('listPrice', 0):,}")
        else:
            print(f"❌ Could not find MLS#{test_mls} even though it was just returned!")
    else:
        print("❌ No response from API")
    
    print("=" * 80)

print()
print("SUGGESTION: Use one of the MLS numbers above to test the valuation system!")
print("=" * 80)
