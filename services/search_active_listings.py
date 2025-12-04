#!/usr/bin/env python3
"""
Search for ACTIVE MLS listings in Repliers API
Since you have the Standard paid version, let's find currently active listings
"""

import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')
REPLIERS_BASE_URL = "https://api.repliers.io"

print("=" * 80)
print("SEARCHING FOR ACTIVE MLS LISTINGS (Standard API Access)")
print("=" * 80)

# Search for active listings in major Canadian cities
cities_to_search = [
    {"city": "Toronto", "province": "ON"},
    {"city": "Vancouver", "province": "BC"},
    {"city": "Ottawa", "province": "ON"},
    {"city": "Mississauga", "province": "ON"},
    {"city": "Brampton", "province": "ON"},
]

print("\n🔍 Searching for active residential listings...\n")

active_listings = []

for location in cities_to_search:
    city = location["city"]
    province = location["province"]
    
    print(f"📍 Searching {city}, {province}...")
    
    try:
        # Search for active listings using the /listings endpoint
        url = f"{REPLIERS_BASE_URL}/listings"
        
        headers = {
            "REPLIERS-API-KEY": REPLIERS_API_KEY,
            "Content-Type": "application/json"
        }
        
        params = {
            "city": city,
            "province": province,
            "status": "A",  # A = Active, U = Under Contract
            "class": "Residential",  # Residential class
            "limit": 10  # Get 10 listings per city
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list) and len(data) > 0:
                print(f"   ✅ Found {len(data)} active listings!")
                
                for listing in data[:5]:  # Show first 5
                    mls_id = listing.get('mlsNumber', 'N/A')
                    address = listing.get('address', {}).get('streetAddress', 'Unknown')
                    price = listing.get('listPrice', 0)
                    prop_type = listing.get('propertyType', 'Unknown')
                    beds = listing.get('details', {}).get('numBedrooms', 0)
                    baths = listing.get('details', {}).get('numBathrooms', 0)
                    sqft = listing.get('building', {}).get('sqft', 0)
                    
                    if mls_id != 'N/A' and sqft > 0:
                        print(f"      • MLS {mls_id}: {prop_type}, {beds}bed/{baths}bath, {sqft}sqft - ${price:,}")
                        active_listings.append({
                            'mls_id': mls_id,
                            'city': city,
                            'address': address,
                            'price': price,
                            'type': prop_type,
                            'beds': beds,
                            'baths': baths,
                            'sqft': sqft
                        })
            else:
                print(f"   ⚠️ No active listings found")
        else:
            print(f"   ❌ API Error: {response.status_code}")
            print(f"      Response: {response.text[:200]}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
print("ACTIVE LISTINGS FOUND")
print("=" * 80)

if active_listings:
    print(f"\n✅ Found {len(active_listings)} active MLS listings with complete data!\n")
    
    # Show top 10
    for i, listing in enumerate(active_listings[:10], 1):
        print(f"{i}. MLS {listing['mls_id']}")
        print(f"   {listing['address']}, {listing['city']}")
        print(f"   {listing['type']} - {listing['beds']}bed/{listing['baths']}bath")
        print(f"   {listing['sqft']:,} sqft - ${listing['price']:,}")
        print()
    
    print("=" * 80)
    print("TEST THESE MLS IDs IN YOUR CHATBOT")
    print("=" * 80)
    
    best_listings = active_listings[:3]
    for listing in best_listings:
        print(f"\n💬 \"What's the value of MLS {listing['mls_id']}?\"")
        print(f"   ({listing['type']} in {listing['city']}, ${listing['price']:,})")
else:
    print("\n⚠️ No active listings found in the search.")
    print("\nThis might mean:")
    print("1. The API search parameters need adjustment")
    print("2. Need to use different endpoint for listing search")
    print("3. The 'status' or 'class' filters might not be supported")
    
    print("\n💡 Let's try a broader search without filters...")
    
    # Try without filters
    try:
        url = f"{REPLIERS_BASE_URL}/listings"
        headers = {"REPLIERS-API-KEY": REPLIERS_API_KEY}
        params = {"limit": 20}
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n   ✅ Got {len(data) if isinstance(data, list) else 'some'} listings")
            
            if isinstance(data, list) and len(data) > 0:
                print("\n   Sample listings:")
                for listing in data[:5]:
                    mls_id = listing.get('mlsNumber', 'N/A')
                    city = listing.get('address', {}).get('city', 'Unknown')
                    print(f"      • MLS {mls_id} in {city}")
        else:
            print(f"\n   API returned: {response.status_code}")
    except Exception as e:
        print(f"\n   Error: {e}")

print("\n" + "=" * 80)
