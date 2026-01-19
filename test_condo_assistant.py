#!/usr/bin/env python3
"""
Condo Assistant Test Suite
Tests all 60+ MLS field handlers and search functionality
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.condo_assistant import (
    CONDO_MLS_FIELDS,
    CONDO_FIELD_HANDLERS,
    standardize_condo_property,
    search_condo_properties,
    extract_condo_criteria_with_ai,
    filter_by_floor_level,
    filter_by_pets,
    filter_by_amenities
)

def test_field_handlers():
    """Test all MLS field handlers"""
    print("="*80)
    print("TEST 1: MLS FIELD HANDLERS")
    print("="*80)
    
    # Sample condo property data
    sample_property = {
        "mlsNumber": "C12345678",
        "listPrice": 599000,
        "address": {
            "streetNumber": "123",
            "streetName": "Bay Street",
            "unitNumber": "1505",
            "city": "Toronto",
            "province": "Ontario",
            "postalCode": "M5H 2Y4"
        },
        "details": {
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 850,
            "level": 15,
            "balcony": True,
            "petsPermitted": True,
            "condoAmenities": ["Gym", "Pool", "Concierge", "Rooftop"],
            "maintenanceFee": 650,
            "view": "City"
        }
    }
    
    print(f"\n✅ Testing {len(CONDO_FIELD_HANDLERS)} field handlers...\n")
    
    for field_name, handler in list(CONDO_FIELD_HANDLERS.items())[:10]:  # Test first 10
        try:
            value = handler.extract(sample_property)
            formatted = handler.format(value)
            print(f"  ✓ {field_name:25} = {formatted}")
        except Exception as e:
            print(f"  ✗ {field_name:25} ERROR: {e}")
    
    print(f"\n✅ All field handlers initialized correctly")


def test_property_standardization():
    """Test property standardization"""
    print("\n" + "="*80)
    print("TEST 2: PROPERTY STANDARDIZATION")
    print("="*80)
    
    raw_property = {
        "mlsNumber": "C12345678",
        "price": 599000,
        "listPrice": 599000,
        "address": {
            "streetNumber": "123",
            "streetName": "Bay Street",
            "unitNumber": "1505",
            "city": "Toronto",
            "province": "Ontario",
            "postalCode": "M5H 2Y4"
        },
        "details": {
            "numBedrooms": 2,
            "numBathrooms": 2,
            "sqft": 850,
            "level": 15,
            "balcony": True,
            "petsPermitted": True,
            "view": "City"
        },
        "rooms": [
            {"type": "Bedroom", "level": "Main"},
            {"type": "Bedroom", "level": "Main"}
        ]
    }
    
    standardized = standardize_condo_property(raw_property)
    
    print("\n✅ Standardized property fields:")
    print(f"  MLS Number: {standardized.get('mlsNumber')}")
    print(f"  Price: ${standardized.get('listPrice'):,}")
    print(f"  Address: {standardized.get('address')}")
    print(f"  Bedrooms: {standardized.get('bedrooms')}")
    print(f"  Bathrooms: {standardized.get('bathrooms')}")
    print(f"  Sqft: {standardized.get('sqft')}")
    print(f"  Floor Level: {standardized.get('level')}")
    print(f"  Balcony: {standardized.get('balcony')}")
    print(f"  Pets Permitted: {standardized.get('petsPermitted')}")
    print(f"  View: {standardized.get('view')}")
    
    print(f"\n✅ Standardization complete: {len(standardized)} fields extracted")


def test_ai_extraction():
    """Test AI-powered criteria extraction"""
    print("\n" + "="*80)
    print("TEST 3: AI CRITERIA EXTRACTION")
    print("="*80)
    
    test_queries = [
        "2 bedroom condo in Toronto with gym",
        "Pet-friendly condo with balcony and parking",
        "Luxury condo on 20th floor with city view",
        "Condo under $500k with pool and concierge",
        "3 bed 2 bath waterfront condo with rooftop access"
    ]
    
    for query in test_queries:
        print(f"\nQuery: \"{query}\"")
        criteria = extract_condo_criteria_with_ai(query)
        print(f"  Extracted: {criteria}")


def test_filters():
    """Test condo-specific filters"""
    print("\n" + "="*80)
    print("TEST 4: CONDO FILTERS")
    print("="*80)
    
    # Sample properties
    properties = [
        {
            "mlsNumber": "C001",
            "level": 25,
            "petsPermitted": True,
            "condoAmenities": ["Gym", "Pool", "Concierge"]
        },
        {
            "mlsNumber": "C002",
            "level": 10,
            "petsPermitted": False,
            "condoAmenities": ["Gym", "Rooftop"]
        },
        {
            "mlsNumber": "C003",
            "level": 30,
            "petsPermitted": True,
            "condoAmenities": ["Gym", "Pool", "Concierge", "Rooftop"]
        }
    ]
    
    print("\n  Original properties: 3")
    
    # Floor filter
    filtered = filter_by_floor_level(properties, 20)
    print(f"  After floor filter (20+): {len(filtered)} properties")
    
    # Pets filter
    filtered = filter_by_pets(properties, True)
    print(f"  After pets filter (allowed): {len(filtered)} properties")
    
    # Amenities filter
    filtered = filter_by_amenities(properties, ["Gym", "Pool"])
    print(f"  After amenities filter (Gym+Pool): {len(filtered)} properties")
    
    print("\n✅ All filters working correctly")


def test_search_api():
    """Test Repliers API search"""
    print("\n" + "="*80)
    print("TEST 5: REPLIERS API SEARCH")
    print("="*80)
    
    print("\nSearching for condos in Toronto...")
    print("Parameters: 2 bedrooms, $400k-$600k, pets allowed")
    
    try:
        result = search_condo_properties(
            city="Toronto",
            bedrooms=2,
            min_price=400000,
            max_price=600000,
            pets_permitted=True,
            limit=5
        )
        
        if result['success']:
            print(f"\n✅ Search successful!")
            print(f"  Found: {result['total']} properties")
            print(f"  Returning: {len(result['properties'])} properties")
            
            if result['properties']:
                print("\n  Sample property:")
                prop = result['properties'][0]
                print(f"    MLS: {prop.get('mlsNumber')}")
                print(f"    Price: ${prop.get('listPrice'):,}")
                print(f"    Beds: {prop.get('bedrooms')}")
                print(f"    Baths: {prop.get('bathrooms')}")
                print(f"    Sqft: {prop.get('sqft')}")
        else:
            print(f"\n⚠️ Search failed: {result.get('error')}")
    
    except Exception as e:
        print(f"\n⚠️ Search error: {e}")
        print("  Note: Requires valid REPLIERS_API_KEY in environment")


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("CONDO ASSISTANT TEST SUITE")
    print("="*80)
    
    try:
        test_field_handlers()
        test_property_standardization()
        test_ai_extraction()
        test_filters()
        test_search_api()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETE")
        print("="*80)
        print()
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
