#!/usr/bin/env python3
"""
Get ANY listings from Repliers API to see what's available
"""

import sys
import os
import requests
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')
REPLIERS_BASE_URL = "https://api.repliers.io"

print("=" * 80)
print("FETCHING AVAILABLE LISTINGS FROM REPLIERS API")
print("=" * 80)

try:
    url = f"{REPLIERS_BASE_URL}/listings"
    headers = {"REPLIERS-API-KEY": REPLIERS_API_KEY}
    params = {"limit": 50}  # Get up to 50 listings
    
    print(f"\n📡 Requesting: {url}")
    print(f"   Params: {params}\n")
    
    response = requests.get(url, headers=headers, params=params, timeout=15)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Check if response has listings array
        if isinstance(data, dict) and 'listings' in data:
            listings = data['listings']
            total_count = data.get('count', len(listings))
            print(f"✅ API has {total_count:,} total listings")
            print(f"✅ Received {len(listings)} listings in this page\n")
            data = listings  # Use the listings array
        
        if isinstance(data, list):
            print(f"✅ Received {len(data)} listings\n")
            
            # Analyze the listings
            valid_for_valuation = []
            
            for listing in data:
                mls_id = listing.get('mlsNumber', 'N/A')
                address = listing.get('address', {})
                street = address.get('streetAddress', 'Unknown')
                city = address.get('city', 'Unknown')
                province = address.get('province', 'Unknown')
                
                building = listing.get('building', {})
                sqft = building.get('sqft', 0)
                
                details = listing.get('details', {})
                beds = details.get('numBedrooms', 0)
                baths = details.get('numBathrooms', 0)
                
                prop_type = listing.get('propertyType', 'Unknown')
                price = listing.get('listPrice', 0)
                
                # Check if suitable for valuation
                is_residential = prop_type in ['Detached', 'Semi-Detached', 'Att/Row/Twnhouse', 'Condo Apt', 'Condo Townhouse']
                has_sqft = sqft > 0
                has_location = city not in ['Unknown', 'Out of Area', 'N/A']
                has_address = street != 'Unknown'
                
                is_valid = is_residential and has_sqft and has_location and has_address
                
                if is_valid:
                    valid_for_valuation.append({
                        'mls_id': mls_id,
                        'address': street,
                        'city': city,
                        'province': province,
                        'type': prop_type,
                        'beds': beds,
                        'baths': baths,
                        'sqft': sqft,
                        'price': price
                    })
            
            print("="  * 80)
            print(f"VALID PROPERTIES FOR VALUATION: {len(valid_for_valuation)}")
            print("=" * 80)
            
            if valid_for_valuation:
                print("\n✅ These MLS IDs should work for valuation:\n")
                
                for i, prop in enumerate(valid_for_valuation[:10], 1):
                    print(f"{i}. MLS {prop['mls_id']}")
                    print(f"   {prop['address']}, {prop['city']}, {prop['province']}")
                    print(f"   {prop['type']} - {prop['beds']}bed/{prop['baths']}bath, {prop['sqft']:,}sqft")
                    print(f"   Listed at: ${prop['price']:,}")
                    print()
                
                print("=" * 80)
                print("TEST COMMANDS")
                print("=" * 80)
                
                for prop in valid_for_valuation[:3]:
                    print(f"\n💬 What's the value of MLS {prop['mls_id']}?")
                
            else:
                print("\n⚠️ None of the {len(data)} listings have complete data for valuation")
                print("\nShowing sample of what we got:")
                
                for i, listing in enumerate(data[:5], 1):
                    print(f"\n{i}. MLS {listing.get('mlsNumber', 'N/A')}")
                    print(f"   City: {listing.get('address', {}).get('city', 'N/A')}")
                    print(f"   Type: {listing.get('propertyType', 'N/A')}")
                    print(f"   Sqft: {listing.get('building', {}).get('sqft', 0)}")
                
        else:
            print(f"❌ Unexpected response format:")
            print(json.dumps(data, indent=2)[:500])
    
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
