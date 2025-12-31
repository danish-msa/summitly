#!/usr/bin/env python3
"""
Test script for real MLS property lookups
Tests the Repliers API integration with actual MLS numbers
"""

from services.repliers_valuation_api import (
    fetch_property_details,
    find_comparables,
    get_market_data,
    clear_cache
)
from models.valuation_models import ValuationResult
import json


def test_single_property(mls_id: str):
    """Test fetching a single property and its comparables."""
    print("=" * 80)
    print(f"Testing MLS: {mls_id}")
    print("=" * 80)
    
    # Step 1: Fetch property details
    print(f"\n📍 Fetching property details for {mls_id}...")
    property_data = fetch_property_details(mls_id)
    
    if not property_data:
        print(f"❌ Could not fetch property {mls_id}")
        print("   This could be due to:")
        print("   - Invalid API key")
        print("   - Property not in Repliers database")
        print("   - API connectivity issues")
        return None
    
    print(f"✅ Successfully fetched property!")
    print(f"\n📋 Property Details:")
    print(f"   MLS ID: {property_data.mls_id}")
    print(f"   Address: {property_data.address}")
    print(f"   City: {property_data.city}, {property_data.province}")
    print(f"   Postal Code: {property_data.postal_code}")
    print(f"   Type: {property_data.property_type}")
    print(f"   Bedrooms: {property_data.bedrooms}")
    print(f"   Bathrooms: {property_data.bathrooms}")
    print(f"   Square Feet: {property_data.sqft:,}")
    if property_data.lot_size:
        print(f"   Lot Size: {property_data.lot_size:,} sqft")
    if property_data.year_built:
        print(f"   Year Built: {property_data.year_built}")
    print(f"   Condition: {property_data.condition}")
    if property_data.style:
        print(f"   Style: {property_data.style}")
    print(f"   Basement: {property_data.basement_finish}")
    print(f"   Garage: {property_data.garage_type}")
    print(f"   Parking: {property_data.parking_spaces} spaces")
    if property_data.features:
        print(f"   Features: {', '.join(property_data.features[:5])}")
    if property_data.latitude and property_data.longitude:
        print(f"   Coordinates: {property_data.latitude:.6f}, {property_data.longitude:.6f}")
    
    print(f"\n📝 Summary: {property_data.get_summary()}")
    
    # Step 2: Find comparables
    print(f"\n🔍 Finding comparable properties...")
    comparables = find_comparables(
        subject_property=property_data,
        limit=8,
        radius_km=2.5,
        max_age_days=180
    )
    
    if not comparables:
        print("⚠️  No comparable properties found")
        print("   This could mean:")
        print("   - No recent sales in the area matching criteria")
        print("   - Search radius too small")
        print("   - Property type too unique")
    else:
        print(f"✅ Found {len(comparables)} comparable properties!")
        
        print(f"\n📊 Comparable Properties:")
        for i, comp in enumerate(comparables, 1):
            print(f"\n   {i}. {comp.property_details.address}")
            print(f"      MLS: {comp.property_details.mls_id}")
            print(f"      Sale Price: ${comp.sale_price:,.0f}")
            print(f"      Sale Date: {comp.sale_date}")
            print(f"      Size: {comp.property_details.sqft:,} sqft")
            print(f"      Beds/Baths: {comp.property_details.bedrooms}/{comp.property_details.bathrooms}")
            print(f"      Days on Market: {comp.days_on_market or 'N/A'}")
            if comp.similarity_score:
                print(f"      Similarity Score: {comp.similarity_score:.1f}%")
            if comp.distance_from_subject:
                print(f"      Distance: {comp.distance_from_subject:.2f} km")
        
        # Calculate average sale price
        avg_price = sum(c.sale_price for c in comparables) / len(comparables)
        median_prices = sorted([c.sale_price for c in comparables])
        median_price = median_prices[len(median_prices)//2]
        
        print(f"\n💰 Comparable Sales Analysis:")
        print(f"   Average Sale Price: ${avg_price:,.0f}")
        print(f"   Median Sale Price: ${median_price:,.0f}")
        print(f"   Price Range: ${min(c.sale_price for c in comparables):,.0f} - ${max(c.sale_price for c in comparables):,.0f}")
        print(f"   Price per Sqft (avg): ${avg_price / property_data.sqft:.2f}")
    
    # Step 3: Get market data
    print(f"\n📈 Fetching market data for {property_data.city}...")
    market = get_market_data(property_data.city, property_data.province)
    
    print(f"\n✅ Market Data:")
    print(f"   Median Price: ${market['median_price']:,.0f}")
    print(f"   Average Price: ${market['average_price']:,.0f}")
    print(f"   Price per Sqft: ${market['price_per_sqft']:.2f}")
    print(f"   Avg Days on Market: {market['avg_days_on_market']} days")
    print(f"   Market Status: {market['market_status']}")
    print(f"   Inventory Level: {market['inventory_level']}")
    print(f"   Sale-to-List Ratio: {market['sale_to_list_ratio']:.2f}")
    print(f"   3-Month Price Trend: {market['price_trend_3month']:+.1f}%")
    print(f"   6-Month Price Trend: {market['price_trend_6month']:+.1f}%")
    print(f"   12-Month Price Trend: {market['price_trend_12month']:+.1f}%")
    print(f"   Data Source: {market['data_source']}")
    
    # Export property data
    output_file = f"property_{mls_id}_data.json"
    property_dict = property_data.to_dict()
    property_dict['comparables'] = [c.to_dict() for c in comparables]
    property_dict['market_data'] = market
    
    with open(output_file, 'w') as f:
        json.dump(property_dict, f, indent=2)
    
    print(f"\n💾 Property data exported to: {output_file}")
    
    return {
        'property': property_data,
        'comparables': comparables,
        'market': market
    }


def test_all_properties():
    """Test all three MLS properties."""
    
    print("\n")
    print("*" * 80)
    print("*" + " " * 78 + "*")
    print("*" + " " * 20 + "REAL MLS PROPERTY TESTING" + " " * 33 + "*")
    print("*" + " " * 78 + "*")
    print("*" * 80)
    print("\n")
    
    # Clear cache to ensure fresh data
    clear_cache()
    print("🔄 Cache cleared - fetching fresh data from API\n")
    
    # Test MLS numbers
    mls_numbers = [
        'E12580230',
        'C12580086',
        'E12579620'
    ]
    
    results = {}
    
    for i, mls_id in enumerate(mls_numbers, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i} of {len(mls_numbers)}")
        print(f"{'='*80}\n")
        
        result = test_single_property(mls_id)
        results[mls_id] = result
        
        if i < len(mls_numbers):
            print("\n" + "-"*80)
            print("Press Enter to continue to next property...")
            print("-"*80)
            input()
    
    # Summary
    print("\n\n")
    print("=" * 80)
    print("TESTING SUMMARY")
    print("=" * 80)
    
    successful = sum(1 for r in results.values() if r is not None)
    failed = len(results) - successful
    
    print(f"\n✅ Successful: {successful}/{len(results)}")
    print(f"❌ Failed: {failed}/{len(results)}")
    
    print("\n📋 Results by MLS:")
    for mls_id, result in results.items():
        if result:
            prop = result['property']
            comps = result['comparables']
            print(f"\n   ✅ {mls_id}")
            print(f"      Address: {prop.address}, {prop.city}")
            print(f"      Size: {prop.sqft:,} sqft | {prop.bedrooms} bed / {prop.bathrooms} bath")
            print(f"      Comparables Found: {len(comps)}")
            if comps:
                avg_price = sum(c.sale_price for c in comps) / len(comps)
                print(f"      Estimated Value: ${avg_price:,.0f}")
        else:
            print(f"\n   ❌ {mls_id} - Failed to fetch")
    
    # Check if any data was successfully retrieved
    if successful > 0:
        print("\n\n✨ API Integration Working!")
        print("   Check the exported JSON files for detailed property data.")
    else:
        print("\n\n⚠️  API Integration Issues Detected")
        print("\n   Possible causes:")
        print("   1. API Key Invalid - Check REPLIERS_API_KEY in .env file")
        print("   2. API Endpoint Changed - Verify https://api.repliers.io")
        print("   3. MLS Numbers Not in Database - Try different properties")
        print("   4. Network/Firewall Issues - Check internet connection")
        print("\n   The system will use fallback mock data for demonstrations.")
    
    print("\n" + "=" * 80)
    print("TESTING COMPLETE")
    print("=" * 80 + "\n")
    
    return results


def test_api_connectivity():
    """Quick test to check API connectivity."""
    print("\n🔌 Testing API Connectivity...")
    print("-" * 80)
    
    # Try a simple property search
    from services.repliers_valuation_api import _make_api_request
    
    response = _make_api_request(
        '/properties/search',
        params={'city': 'Toronto', 'limit': 1},
        use_cache=False
    )
    
    if response:
        print("✅ API is reachable and responding")
        print(f"   Response keys: {list(response.keys())}")
        return True
    else:
        print("❌ API is not reachable or authentication failed")
        print("\n   Troubleshooting steps:")
        print("   1. Verify REPLIERS_API_KEY in .env file")
        print("   2. Check API documentation: https://api.repliers.io/docs")
        print("   3. Verify API key permissions")
        print("   4. Check if API is operational")
        return False


if __name__ == '__main__':
    print("\n")
    print("█" * 80)
    print("█" + " " * 78 + "█")
    print("█" + " " * 15 + "REPLIERS API INTEGRATION - REAL PROPERTY TEST" + " " * 19 + "█")
    print("█" + " " * 78 + "█")
    print("█" * 80)
    
    # First check API connectivity
    api_ok = test_api_connectivity()
    
    if not api_ok:
        print("\n⚠️  API connectivity issues detected.")
        print("   Continuing with tests (may use fallback data)...\n")
        input("Press Enter to continue anyway...")
    
    # Test all properties
    try:
        results = test_all_properties()
        
        # Offer to export combined report
        print("\n📊 Would you like to export a combined comparison report? (y/n)")
        response = input("> ").strip().lower()
        
        if response in ['y', 'yes']:
            combined_report = {
                'test_date': '2025-11-27',
                'properties_tested': len(results),
                'results': {}
            }
            
            for mls_id, result in results.items():
                if result:
                    combined_report['results'][mls_id] = {
                        'property': result['property'].to_dict(),
                        'comparables_count': len(result['comparables']),
                        'market_data': result['market']
                    }
            
            with open('combined_test_report.json', 'w') as f:
                json.dump(combined_report, f, indent=2)
            
            print("✅ Combined report saved to: combined_test_report.json")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n✨ Testing session complete!\n")
