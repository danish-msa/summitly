#!/usr/bin/env python3
"""
Test to see ANY listings in Repliers API (no filters)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.repliers_valuation_api import _make_api_request
import json

print("=" * 80)
print("TESTING ANY AVAILABLE LISTINGS (NO FILTERS)")
print("=" * 80)
print()

# Use the same Ontario map from voice_assistant_clean.py
ontario_map = [[-82.93036962053748, 42.07088416140104], [-88.07379550946587, 42.07088416140104], [-88.07379550946587, 16.242913731111116], [-82.93036962053748, 16.242913731111116]]

print("TEST: Fetch ANY 10 listings (no filters except map)")
print("-" * 80)

params = {
    'map': json.dumps([ontario_map]),
    'fields': 'boardId,mlsNumber,status,listPrice,address,details,lastStatus',
    'limit': 10
}

response = _make_api_request('/listings', params=params, use_cache=False)

if response:
    print(f"Response type: {type(response)}")
    print(f"Response keys: {response.keys() if isinstance(response, dict) else 'N/A'}")
    print()
    
    if isinstance(response, list):
        listings = response
    else:
        listings = response.get('listings', response.get('results', []))
    
    print(f"✅ Found {len(listings)} listings")
    print()
    
    if listings:
        for i, listing in enumerate(listings[:10], 1):
            mls = listing.get('mlsNumber', 'N/A')
            status = listing.get('status', 'N/A')
            last_status = listing.get('lastStatus', 'N/A')
            price = listing.get('listPrice', 0)
            address = listing.get('address', {})
            city = address.get('city', 'N/A')
            street = f"{address.get('streetNumber', '')} {address.get('streetName', '')}".strip()
            
            details = listing.get('details', {})
            beds = details.get('numBedrooms', 'N/A')
            baths = details.get('numBathrooms', 'N/A')
            sqft = details.get('sqft', 'N/A')
            prop_type = details.get('propertyType', 'N/A')
            
            print(f"  {i}. MLS#{mls} (Status: {status}, Last: {last_status})")
            print(f"     Address: {street}, {city}")
            print(f"     Price: ${price:,}" if price else "     Price: N/A")
            print(f"     Type: {prop_type} | {beds} beds | {baths} baths | {sqft} sqft")
            print()
        
        # Export first 3 MLS numbers to test
        print("=" * 80)
        print("AVAILABLE MLS NUMBERS TO TEST:")
        print("-" * 80)
        for i in range(min(3, len(listings))):
            print(f"  {i+1}. MLS# {listings[i].get('mlsNumber')}")
        print("=" * 80)
    else:
        print("No listings returned in response")
        print(f"Full response: {json.dumps(response, indent=2)[:500]}")
else:
    print("❌ No response from API")

print()
