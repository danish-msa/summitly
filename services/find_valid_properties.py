#!/usr/bin/env python3
"""
Search for valid Canadian residential properties with complete data
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.repliers_valuation_api import fetch_property_details

# Test multiple MLS IDs to find valid ones
test_mls_ids = [
    "X12506968",
    "X12481568", 
    "X12515894",
    "X12032791",
    "W9876543",  # Try different patterns
    "C9876543",
    "N9876543"
]

print("=" * 80)
print("SEARCHING FOR VALID CANADIAN RESIDENTIAL PROPERTIES")
print("=" * 80)

valid_properties = []
invalid_properties = []

for mls_id in test_mls_ids:
    print(f"\n📡 Testing MLS {mls_id}...")
    
    try:
        prop = fetch_property_details(mls_id)
        
        if prop:
            # Check if property has sufficient data
            is_valid = (
                prop.sqft > 0 and
                prop.city not in ["Out of Area", "Unknown", "N/A"] and
                prop.property_type not in ["Vacant Land", "Commercial"] and
                prop.latitude is not None and
                prop.longitude is not None and
                prop.address != "Unknown Address"
            )
            
            if is_valid:
                print(f"   ✅ VALID - {prop.property_type} in {prop.city}, {prop.sqft} sqft")
                valid_properties.append({
                    'mls_id': mls_id,
                    'address': prop.address,
                    'city': prop.city,
                    'property_type': prop.property_type,
                    'sqft': prop.sqft,
                    'beds': prop.bedrooms,
                    'baths': prop.bathrooms
                })
            else:
                print(f"   ⚠️ INCOMPLETE - {prop.property_type} in {prop.city}")
                invalid_properties.append({
                    'mls_id': mls_id,
                    'city': prop.city,
                    'sqft': prop.sqft,
                    'property_type': prop.property_type
                })
        else:
            print(f"   ❌ NOT FOUND")
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

if valid_properties:
    print(f"\n✅ Found {len(valid_properties)} VALID properties:\n")
    for prop in valid_properties:
        print(f"   MLS {prop['mls_id']}")
        print(f"   {prop['address']}, {prop['city']}")
        print(f"   {prop['property_type']} - {prop['beds']}bed/{prop['baths']}bath, {prop['sqft']} sqft")
        print()
else:
    print("\n❌ No valid properties found in the test set")

if invalid_properties:
    print(f"\n⚠️ Found {len(invalid_properties)} INCOMPLETE properties:\n")
    for prop in invalid_properties:
        print(f"   MLS {prop['mls_id']}: {prop['property_type']} in {prop['city']}, {prop['sqft']} sqft")

print("\n" + "=" * 80)
print("RECOMMENDATION")
print("=" * 80)

if valid_properties:
    best = valid_properties[0]
    print(f"\n💡 Use this MLS ID for testing:\n")
    print(f"   MLS {best['mls_id']}")
    print(f"   {best['address']}, {best['city']}")
    print(f"   {best['property_type']} - {best['beds']}bed/{best['baths']}bath, {best['sqft']} sqft")
    print(f"\n   Test with: \"What's the value of MLS {best['mls_id']}?\"")
else:
    print("\n💡 The Repliers API might not have active Canadian residential properties")
    print("   with complete data in their database right now.")
    print("\n   Alternative solutions:")
    print("   1. Contact Repliers support to get valid test MLS IDs")
    print("   2. Use properties from major cities (Toronto, Vancouver, Ottawa)")
    print("   3. Check if your API key has access to Canadian MLS data")

print("\n" + "=" * 80)
