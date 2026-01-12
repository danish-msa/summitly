"""
Residential Search Pipeline - Demo & Quick Test
=================================================
This script demonstrates the complete residential property search pipeline.
Run this to verify the integration is working correctly.

Usage:
    python scripts/demo_residential_search.py

Author: Summitly Team
Date: January 10, 2026
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).parent.parent / 'config' / '.env'
load_dotenv(dotenv_path=env_path)


def demo_filter_extraction():
    """Demonstrate natural language filter extraction."""
    print("\n" + "="*60)
    print("🔍 DEMO 1: Natural Language Filter Extraction")
    print("="*60)
    
    from services.residential_filter_mapper import ResidentialFilterExtractor
    
    extractor = ResidentialFilterExtractor()
    
    test_queries = [
        "3 bedroom condo in Toronto under 700k",
        "detached house with pool in Mississauga",
        "townhouse between 500k and 800k with 2 car garage",
        "waterfront property with finished basement",
        "condo rental under $3000 with parking",
        "luxury penthouse above 20th floor",
        "new construction home in Oakville",
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: '{query}'")
        filters = extractor.extract_all(query)
        
        # Get non-default filters
        active_filters = []
        if filters.city:
            active_filters.append(f"city={filters.city}")
        if filters.property_type:
            active_filters.append(f"type={filters.property_type}")
        if filters.min_bedrooms:
            active_filters.append(f"beds>={filters.min_bedrooms}")
        if filters.max_price:
            active_filters.append(f"price<=${filters.max_price:,}")
        if filters.min_price:
            active_filters.append(f"price>=${filters.min_price:,}")
        if filters.has_pool:
            active_filters.append("pool=yes")
        if filters.garage_type:
            active_filters.append(f"garage={filters.garage_type}")
        if filters.basement_type:
            active_filters.append(f"basement={filters.basement_type}")
        if filters.waterfront:
            active_filters.append("waterfront=yes")
        if filters.floor_level:
            active_filters.append(f"floor>={filters.floor_level}")
        if filters.min_year_built:
            active_filters.append(f"built>={filters.min_year_built}")
        if filters.transaction_type:
            active_filters.append(f"txn={filters.transaction_type}")
        
        print(f"   ➡️  Extracted: {', '.join(active_filters) if active_filters else 'no specific filters'}")


def demo_state_conversion():
    """Demonstrate ConversationState to filters conversion."""
    print("\n" + "="*60)
    print("🔄 DEMO 2: ConversationState Conversion")
    print("="*60)
    
    from services.conversation_state import ConversationState
    from services.location_extractor import LocationState
    from services.residential_chatbot_integration import StateToFiltersConverter
    
    converter = StateToFiltersConverter()
    
    # Create a sample conversation state
    state = ConversationState(session_id="demo-session")
    state.location_state = LocationState(city="Toronto", neighborhood="Yorkville")
    state.property_type = "condo"
    state.bedrooms = 2
    state.price_range = (500000, 800000)
    state.listing_type = "sale"
    state.amenities = ["pool", "gym", "parking"]
    
    # Additional GPT-extracted filters
    gpt_filters = {
        "floor_level_min": 15,
        "condo_exposure": "south",
        "maintenance_fee_max": 600
    }
    
    # Convert
    filters = converter.convert(state, gpt_filters, "looking for a condo with good view")
    
    print("\n📋 Input State:")
    print(f"   Location: {state.location_state.city}, {state.location_state.neighborhood}")
    print(f"   Type: {state.property_type}")
    print(f"   Bedrooms: {state.bedrooms}")
    print(f"   Price: ${state.price_range[0]:,} - ${state.price_range[1]:,}")
    print(f"   Amenities: {', '.join(state.amenities)}")
    print(f"   GPT Filters: {gpt_filters}")
    
    print("\n✅ Converted Filters:")
    print(f"   City: {filters.city}")
    print(f"   Neighborhood: {filters.neighborhood}")
    print(f"   Property Type: {filters.property_type}")
    print(f"   Bedrooms: {filters.min_bedrooms}-{filters.max_bedrooms}")
    print(f"   Price: ${filters.min_price:,} - ${filters.max_price:,}")
    print(f"   Pool: {filters.has_pool}")
    print(f"   Floor Level: {filters.floor_level}")
    print(f"   Exposure: {filters.exposure}")
    print(f"   Max Maintenance: ${filters.max_maintenance}")


def demo_api_search():
    """Demonstrate live API search."""
    print("\n" + "="*60)
    print("🌐 DEMO 3: Live API Search")
    print("="*60)
    
    from services.residential_search_service import get_residential_search_service
    from services.residential_filter_mapper import ResidentialFilters
    
    # Check if API key is configured
    api_key = os.getenv("REPLIERS_API_KEY")
    if not api_key:
        print("\n⚠️  REPLIERS_API_KEY not configured. Skipping live API demo.")
        print("   To test with live data, set REPLIERS_API_KEY in config/.env")
        return
    
    service = get_residential_search_service()
    
    # Create search filters
    filters = ResidentialFilters()
    filters.city = "Toronto"
    filters.property_type = "Condo Apt"
    filters.min_bedrooms = 2
    filters.max_bedrooms = 2
    filters.min_price = 500000
    filters.max_price = 800000
    filters.status = "A"
    
    print("\n📋 Search Parameters:")
    print(f"   City: {filters.city}")
    print(f"   Type: {filters.property_type}")
    print(f"   Bedrooms: {filters.min_bedrooms}")
    print(f"   Price: ${filters.min_price:,} - ${filters.max_price:,}")
    
    print("\n🔄 Executing search...")
    results = service.search(filters=filters, limit=5)
    
    if results['success']:
        print(f"\n✅ Found {results['count']} total properties")
        print(f"   Showing first {len(results.get('listings', []))} results:")
        
        for i, listing in enumerate(results.get('listings', [])[:5], 1):
            mls = listing.get('mlsNumber', 'N/A')
            price = listing.get('listPrice', 0)
            addr = listing.get('address', {})
            street = addr.get('streetName', 'Unknown')
            city = addr.get('city', 'Unknown')
            beds = listing.get('details', {}).get('numBedrooms', '?')
            
            print(f"\n   {i}. MLS: {mls}")
            print(f"      Price: ${price:,.0f}")
            print(f"      Address: {street}, {city}")
            print(f"      Bedrooms: {beds}")
    else:
        print(f"\n❌ Search failed: {results.get('error', 'Unknown error')}")


def demo_chatbot_integration():
    """Demonstrate chatbot pipeline integration."""
    print("\n" + "="*60)
    print("🤖 DEMO 4: Chatbot Integration")
    print("="*60)
    
    from services.conversation_state import ConversationState
    from services.location_extractor import LocationState
    from services.residential_chatbot_integration import (
        search_residential_properties,
        get_extended_gpt_prompt,
    )
    
    # Simulate a chatbot conversation state
    state = ConversationState(session_id="demo-chatbot")
    state.location_state = LocationState(city="Toronto")
    state.property_type = "condo"
    state.bedrooms = 2
    state.price_range = (400000, 700000)
    
    print("\n📋 Simulated Conversation State:")
    print(f"   City: {state.location_state.city}")
    print(f"   Type: {state.property_type}")
    print(f"   Bedrooms: {state.bedrooms}")
    print(f"   Price Range: ${state.price_range[0]:,} - ${state.price_range[1]:,}")
    
    # Check if API is available
    api_key = os.getenv("REPLIERS_API_KEY")
    if not api_key:
        print("\n⚠️  REPLIERS_API_KEY not configured. Showing prompt extension only.")
        print("\n📜 Extended GPT Prompt (first 500 chars):")
        prompt = get_extended_gpt_prompt()
        print(f"   {prompt[:500]}...")
        return
    
    print("\n🔄 Calling search_residential_properties()...")
    
    results = search_residential_properties(
        state=state,
        user_message="2 bedroom condos under 700k",
        limit=3
    )
    
    if results['success']:
        print(f"\n✅ Search Results:")
        print(f"   Total Found: {results['total']}")
        print(f"   Query Summary: {results['query_summary']}")
        
        for i, prop in enumerate(results.get('results', [])[:3], 1):
            print(f"\n   {i}. {prop.get('mlsNumber', 'N/A')} - ${prop.get('listPrice', 0):,.0f}")
    else:
        print(f"\n❌ Search failed: {results.get('error', 'Unknown error')}")


def main():
    """Run all demos."""
    print("\n" + "="*60)
    print("🏠 RESIDENTIAL PROPERTY SEARCH PIPELINE - DEMO")
    print("="*60)
    print("\nThis demo showcases the complete residential search pipeline")
    print("with 90+ filter parameters integrated with the chatbot.\n")
    
    # Run demos
    demo_filter_extraction()
    demo_state_conversion()
    demo_api_search()
    demo_chatbot_integration()
    
    print("\n" + "="*60)
    print("✅ DEMO COMPLETE")
    print("="*60)
    print("\nAll components are integrated and ready for use!")
    print("\nTo run the full test suite:")
    print("  pytest tests/test_residential_search_pipeline.py -v")
    print("  pytest tests/test_residential_chatbot_integration.py -v")
    print()


if __name__ == '__main__':
    main()
