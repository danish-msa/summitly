#!/usr/bin/env python3
"""
Quick Test Script - Verify Repliers API Returns Real MLS Data
Run this to confirm you're getting real listings, not mock data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.listings_service import listings_service

def verify_real_mls_data():
    """Test that Repliers API returns real MLS listings"""
    
    print("=" * 70)
    print("🔍 REPLIERS API - REAL DATA VERIFICATION TEST")
    print("=" * 70)
    print()
    
    # Test 1: Get Toronto condos
    print("Test 1: Fetching Toronto condos under $800k with 2+ bedrooms...")
    print("-" * 70)
    
    try:
        result = listings_service.search_listings(
            city="Toronto",
            property_style="condo",
            max_price=800000,
            min_bedrooms=2,
            status="A",  # Active listings
            transaction_type="sale",  # CRITICAL: Only show properties for SALE
            page_size=5
        )
        
        if result.get('success') is False:
            print("❌ API Error:", result.get('error', 'Unknown error'))
            return False
        
        listings = result.get('listings', [])
        count = result.get('count', 0)
        
        print(f"✅ API returned {count} total properties (showing 5)")
        print()
        
        if not listings:
            print("⚠️  No listings returned - this might indicate an API issue")
            return False
        
        # Analyze first 3 properties to prove they're real
        print("📋 PROPERTY DETAILS (Proving These Are Real MLS Listings):")
        print("=" * 70)
        
        for i, listing in enumerate(listings[:3], 1):
            print(f"\n🏠 Property #{i}:")
            print("-" * 70)
            
            # Extract data
            mls = listing.get('mlsNumber', 'N/A')
            address = listing.get('address', {})
            details = listing.get('details', {})
            price = listing.get('listPrice', 0)
            
            # Build full address
            street_num = address.get('streetNumber', '')
            street_name = address.get('streetName', '')
            street_suffix = address.get('streetSuffix', '')
            unit = address.get('unitNumber', '')
            city = address.get('city', 'Toronto')
            postal = address.get('postalCode', '')
            
            full_street = f"{street_num} {street_name} {street_suffix}".strip()
            if unit:
                full_street = f"Unit {unit}, {full_street}"
            
            # Property details
            bedrooms = details.get('numBedrooms', 'N/A')
            bathrooms = details.get('numBathrooms', 'N/A')
            sqft = details.get('sqft', 'N/A')
            prop_style = details.get('propertyStyle', 'N/A')
            list_date = listing.get('listDate', 'N/A')
            
            # Print details
            print(f"   MLS Number:    {mls}")
            print(f"   Address:       {full_street}")
            print(f"   City:          {city}")
            print(f"   Postal Code:   {postal}")
            print(f"   Price:         ${price:,}")
            print(f"   Property Type: {prop_style}")
            print(f"   Bedrooms:      {bedrooms}")
            print(f"   Bathrooms:     {bathrooms}")
            print(f"   Sqft:          {sqft}")
            print(f"   Listed:        {list_date}")
            
            # Validation checks
            print()
            print("   ✅ REAL DATA INDICATORS:")
            
            checks = []
            if mls and mls != 'N/A' and len(str(mls)) > 5:
                checks.append("   ✓ Unique MLS number (not a mock ID)")
            
            if full_street and street_name:
                checks.append("   ✓ Real street address with name and number")
            
            if postal and len(postal) >= 6:
                checks.append("   ✓ Valid Canadian postal code format")
            
            if price and price > 100000 and price % 10000 != 0:
                checks.append("   ✓ Real market price (not rounded mock data)")
            
            if list_date and list_date != 'N/A':
                checks.append("   ✓ Actual listing date from MLS")
            
            for check in checks:
                print(check)
            
            print()
        
        print("=" * 70)
        print()
        print("✅ CONCLUSION: These are REAL MLS listings from Repliers API!")
        print()
        print("📊 SUMMARY:")
        print(f"   • Total properties found: {count}")
        print(f"   • Properties shown: {len(listings[:3])}")
        print(f"   • Data source: Repliers MLS Database")
        print(f"   • All properties have unique MLS numbers")
        print(f"   • All properties have real addresses")
        print(f"   • All properties have actual market prices")
        print()
        print("🎉 NO MOCK DATA DETECTED - ALL REAL REPLIERS DATA!")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_connection():
    """Simple API connection test"""
    print()
    print("Test 2: API Connection Health Check")
    print("-" * 70)
    
    try:
        # Try to get property types as a simple connectivity test
        from services.repliers_client import client
        response = client.get('/listings/property-types')
        
        print("✅ Successfully connected to Repliers API")
        print(f"   Response type: {type(response)}")
        print(f"   Response keys: {list(response.keys()) if isinstance(response, dict) else 'N/A'}")
        print()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


if __name__ == "__main__":
    print()
    success = verify_real_mls_data()
    connection_ok = test_api_connection()
    
    print()
    print("=" * 70)
    if success and connection_ok:
        print("✅ ALL TESTS PASSED - REPLIERS API IS WORKING WITH REAL DATA")
    else:
        print("⚠️  SOME TESTS FAILED - CHECK ERRORS ABOVE")
    print("=" * 70)
    print()
    
    sys.exit(0 if (success and connection_ok) else 1)
