#!/usr/bin/env python3
"""
Direct test of Repliers API using the EXACT same code from voice_assistant_clean.py
"""

import requests
import json

# Use the correct purchased API key
REPLIERS_API_KEY = 'tVbura2ggfQb1yEdnz0lmP8cEAaL7n'
REPLIERS_BASE_URL = 'https://api.repliers.io'

# Ontario map (broad search area)
ontario_map = {
    "type": "Polygon",
    "coordinates": [[
        [-95.1562, 41.6765],
        [-74.3204, 41.6765],
        [-74.3204, 56.8597],
        [-95.1562, 56.8597],
        [-95.1562, 41.6765]
    ]]
}

print("=" * 80)
print("DIRECT REPLIERS API TEST")
print("=" * 80)
print()
print(f"API Key: {REPLIERS_API_KEY[:10]}...")
print(f"Base URL: {REPLIERS_BASE_URL}")
print()

# Test 1: Search for MLS property using the exact working pattern
print("TEST 1: Searching for MLS #E12580230")
print("-" * 80)

url = f"{REPLIERS_BASE_URL}/listings"
params = {
    'fields': 'boardId,mlsNumber,map,class,status,listPrice,listDate,soldPrice,soldDate,updatedOn,address,lastStatus,details.numBathrooms,details.numBathroomsPlus,details.numBedrooms,details.numBedroomsPlus,details.propertyType,details.sqft,lot,images,imagesScore,imageInsights',
    'key': REPLIERS_API_KEY,
    'map': json.dumps([ontario_map]),
    'mlsNumber': 'E12580230'
}

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': REPLIERS_API_KEY
}

print(f"URL: {url}")
print(f"Headers (X-API-Key): {headers['X-API-Key'][:10]}...")
print(f"Params keys: {list(params.keys())}")
print()

# Try with header first (without 'key' param)
params_no_key = {k: v for k, v in params.items() if k != 'key'}
print("Attempting request with X-API-Key header (no key in params)...")
response = requests.get(url, params=params_no_key, headers=headers, timeout=15)

print(f"Response Status: {response.status_code}")

if response.status_code == 401:
    print("❌ Header auth failed, trying query parameter fallback...")
    headers_basic = {'Content-Type': 'application/json'}
    response = requests.get(url, params=params, headers=headers_basic, timeout=15)
    print(f"Fallback Response Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    
    if isinstance(data, list):
        listings = data
    else:
        listings = data.get('listings', data.get('results', []))
    
    print(f"✅ SUCCESS! Found {len(listings)} listings")
    
    if listings:
        print()
        print("First listing details:")
        print("-" * 80)
        listing = listings[0]
        print(f"MLS Number: {listing.get('mlsNumber')}")
        print(f"Status: {listing.get('status')}")
        print(f"List Price: ${listing.get('listPrice', 0):,}")
        
        address = listing.get('address', {})
        print(f"Address: {address.get('streetNumber')} {address.get('streetName')}, {address.get('city')}")
        
        details = listing.get('details', {})
        print(f"Bedrooms: {details.get('numBedrooms')}")
        print(f"Bathrooms: {details.get('numBathrooms')}")
        print(f"Sqft: {details.get('sqft')}")
        print(f"Property Type: {details.get('propertyType')}")
else:
    print(f"❌ FAILED")
    print(f"Response: {response.text[:500]}")

print()
print("=" * 80)
print()

# Test 2: Just search for any listings in Toronto
print("TEST 2: Search for any active listings (map only, no MLS filter)")
print("-" * 80)

params2 = {
    'fields': 'boardId,mlsNumber,map,class,status,listPrice,address,details',
    'key': REPLIERS_API_KEY,
    'map': json.dumps([ontario_map]),
    'limit': 3
}

headers2 = {
    'Content-Type': 'application/json',
    'X-API-Key': REPLIERS_API_KEY
}

params2_no_key = {k: v for k, v in params2.items() if k != 'key'}
print("Attempting request with X-API-Key header...")
response2 = requests.get(url, params=params2_no_key, headers=headers2, timeout=15)

print(f"Response Status: {response2.status_code}")

if response2.status_code == 401:
    print("❌ Header auth failed, trying query parameter fallback...")
    headers_basic = {'Content-Type': 'application/json'}
    response2 = requests.get(url, params=params2, headers=headers_basic, timeout=15)
    print(f"Fallback Response Status: {response2.status_code}")

if response2.status_code == 200:
    data2 = response2.json()
    
    if isinstance(data2, list):
        listings2 = data2
    else:
        listings2 = data2.get('listings', data2.get('results', []))
    
    print(f"✅ SUCCESS! Found {len(listings2)} listings")
    
    for i, listing in enumerate(listings2[:3], 1):
        print(f"\n  Listing {i}:")
        print(f"    MLS: {listing.get('mlsNumber')}")
        print(f"    Price: ${listing.get('listPrice', 0):,}")
        address = listing.get('address', {})
        print(f"    City: {address.get('city', 'N/A')}")
else:
    print(f"❌ FAILED")
    print(f"Response: {response2.text[:500]}")

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
