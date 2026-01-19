#!/usr/bin/env python3
"""
Quick test of new condo_assistant.py search
"""
import sys
sys.path.insert(0, 'app')

from condo_assistant import search_condo_properties

print("\n" + "="*80)
print("TESTING NEW CONDO ASSISTANT SEARCH")
print("="*80 + "\n")

# Test search
result = search_condo_properties(
    city='Toronto',
    bedrooms=2,
    max_price=700000,
    listing_type='sale',
    limit=10
)

print(f"\n✅ Success: {result['success']}")
print(f"✅ Total Properties: {result['total']}")
print(f"✅ Properties Returned: {len(result['properties'])}")

if result['success'] and result['properties']:
    print(f"\n📋 First Property:")
    prop = result['properties'][0]
    print(f"  MLS: {prop.get('mlsNumber', 'N/A')}")
    print(f"  Price: ${prop.get('listPrice', 0):,}")
    print(f"  Beds: {prop.get('bedrooms', 'N/A')}")
    print(f"  Baths: {prop.get('bathrooms', 'N/A')}")
    print(f"  Floor: {prop.get('level', 'N/A')}")

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80 + "\n")
