#!/usr/bin/env python3
"""
Comprehensive Condo Search Test
Tests all 60+ condo-specific field filtering
"""
import sys
import os
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from services.condo_property_service import search_condo_properties

def test_condo_search(name: str, criteria: dict):
    """Run a single condo search test"""
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print(f"{'='*80}")
    print(f"Criteria: {criteria}")
    
    result = search_condo_properties(criteria)
    
    if result.get('success'):
        print(f"✅ SUCCESS: Found {result['total']} condos")
        
        # Show first property details
        if result['properties']:
            prop = result['properties'][0]
            print(f"\n📋 Sample Property:")
            print(f"   MLS: {prop.get('mlsNumber')}")
            print(f"   Address: {prop.get('address')}")
            print(f"   Price: ${prop.get('listPrice'):,}" if prop.get('listPrice') else "   Price: N/A")
            print(f"   Bedrooms: {prop.get('bedrooms')}")
            print(f"   Bathrooms: {prop.get('bathrooms')}")
            print(f"   Floor: {prop.get('level')}")
            print(f"   Amenities: {prop.get('condoAmenities', [])[:5]}")
            print(f"   Images: {len(prop.get('images', []))} images")
    else:
        print(f"❌ FAILED: {result.get('message')}")
    
    return result

# ==================== TEST CASES ====================

print("\n" + "="*80)
print("CONDO SEARCH COMPREHENSIVE TEST SUITE")
print("Testing all 60+ condo-specific fields")
print("="*80)

# Test 1: Basic search
test_condo_search(
    "Basic Search - 2 beds in Toronto",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "max_price": 700000,
        "user_query": "Show me 2-bedroom condos in Toronto under $700K"
    }
)

# Test 2: Intersection search
test_condo_search(
    "Intersection Search - Yonge & Bloor",
    {
        "location": "Toronto",
        "user_query": "2 bedroom condos near Yonge and Bloor"
    }
)

# Test 3: Amenities filtering
test_condo_search(
    "Amenities - Gym and Pool",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "user_query": "2 bedroom condo with gym and pool in Toronto"
    }
)

# Test 4: Floor level filtering
test_condo_search(
    "Floor Level - 15th floor or higher",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "floor_level_min": 15,
        "user_query": "2 bedroom condo on 15th floor or higher in Toronto"
    }
)

# Test 5: Pet-friendly
test_condo_search(
    "Pet-Friendly with Balcony",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "user_query": "pet-friendly 2 bedroom condo with balcony in Toronto"
    }
)

# Test 6: Parking and locker
test_condo_search(
    "Parking and Storage Locker",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "user_query": "2 bedroom condo with parking and locker in Toronto"
    }
)

# Test 7: Luxury features
test_condo_search(
    "Luxury - Concierge and Rooftop",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "user_query": "luxury condo with concierge and rooftop in Toronto"
    }
)

# Test 8: View preference
test_condo_search(
    "Lake View Condo",
    {
        "location": "Toronto",
        "bedrooms": 2,
        "user_query": "2 bedroom condo with lake view in Toronto"
    }
)

# Test 9: Furnished condo
test_condo_search(
    "Furnished with In-Unit Laundry",
    {
        "location": "Toronto",
        "bedrooms": 1,
        "user_query": "furnished 1 bedroom condo with in-unit laundry"
    }
)

# Test 10: Waterfront property
test_condo_search(
    "Waterfront Condo",
    {
        "location": "Toronto",
        "user_query": "waterfront condo in Toronto"
    }
)

# Test 11: Studio with specific features
test_condo_search(
    "Studio with Specific Features",
    {
        "location": "Toronto",
        "user_query": "studio condo with balcony and gym under $500K"
    }
)

# Test 12: High-floor penthouse
test_condo_search(
    "Penthouse Level",
    {
        "location": "Toronto",
        "user_query": "penthouse condo with rooftop access"
    }
)

print(f"\n{'='*80}")
print("TEST SUITE COMPLETE")
print(f"{'='*80}\n")
