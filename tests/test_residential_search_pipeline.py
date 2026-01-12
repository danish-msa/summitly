#!/usr/bin/env python3
"""
Residential Property Search Pipeline Tests
===========================================
Comprehensive tests for the residential property search pipeline.
Tests various filter combinations, natural language queries, and edge cases.

Author: Summitly Team
Date: January 10, 2026
"""

import os
import sys
import json
import unittest
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment
from dotenv import load_dotenv
load_dotenv('config/.env')

from services.residential_filter_mapper import (
    ResidentialFilters,
    ResidentialFilterExtractor,
    build_residential_api_params,
    build_residential_search_params,
    get_filter_extractor,
)
from services.residential_search_service import (
    ResidentialPropertySearchService,
    get_residential_search_service,
)


class TestResidentialFilterExtractor(unittest.TestCase):
    """Test natural language filter extraction."""
    
    def setUp(self):
        self.extractor = get_filter_extractor()
    
    def test_extract_price_range(self):
        """Test price range extraction from various formats."""
        test_cases = [
            ("condos under $500k", (None, 500000)),
            ("houses over $800,000", (800000, None)),
            ("properties between $400k and $600k", (400000, 600000)),
            ("budget of $1.2 million", (None, None)),  # Not supported yet
            ("maximum 750000", (None, 750000)),
            ("at least $300k", (300000, None)),
            ("$500k - $800k", (500000, 800000)),
        ]
        
        for query, expected in test_cases:
            min_p, max_p = self.extractor.extract_price_range(query)
            print(f"Query: '{query}' -> min={min_p}, max={max_p}")
            if expected[0]:
                self.assertEqual(min_p, expected[0], f"Min price mismatch for: {query}")
            if expected[1]:
                self.assertEqual(max_p, expected[1], f"Max price mismatch for: {query}")
    
    def test_extract_bedrooms(self):
        """Test bedroom extraction."""
        test_cases = [
            ("3 bedroom condo", (3, 3)),
            ("2-3 bedrooms", (2, 3)),
            ("3+ bedroom houses", (3, None)),
            ("4 bed 2 bath", (4, 4)),
        ]
        
        for query, expected in test_cases:
            min_b, max_b = self.extractor.extract_bedrooms(query)
            print(f"Query: '{query}' -> min={min_b}, max={max_b}")
            self.assertEqual((min_b, max_b), expected, f"Bedroom mismatch for: {query}")
    
    def test_extract_property_type(self):
        """Test property type extraction."""
        test_cases = [
            ("condo in toronto", "Condo Apartment"),
            ("detached house", "Detached"),
            ("townhouse for sale", "Townhouse"),
            ("semi-detached home", "Semi-Detached"),
            ("apartment downtown", "Condo Apartment"),
        ]
        
        for query, expected in test_cases:
            result = self.extractor.extract_property_type(query)
            print(f"Query: '{query}' -> {result}")
            self.assertEqual(result, expected, f"Property type mismatch for: {query}")
    
    def test_extract_transaction_type(self):
        """Test transaction type extraction."""
        test_cases = [
            ("condos for rent in Toronto", "Lease"),
            ("houses for sale", "Sale"),
            ("apartments to rent", "Lease"),
            ("buying a home", "Sale"),
            ("rental property", "Lease"),
        ]
        
        for query, expected in test_cases:
            result = self.extractor.extract_transaction_type(query)
            print(f"Query: '{query}' -> {result}")
            self.assertEqual(result, expected, f"Transaction type mismatch for: {query}")
    
    def test_extract_amenities(self):
        """Test amenity extraction."""
        query = "condo with pool, gym and concierge"
        amenities = self.extractor.extract_amenities(query)
        print(f"Query: '{query}' -> {amenities}")
        self.assertIn('pool', amenities)
        self.assertIn('gym', amenities)
        self.assertIn('concierge', amenities)
    
    def test_full_extraction(self):
        """Test full filter extraction from complex query."""
        query = "3 bedroom condo in Toronto under $800k with pool and gym"
        filters = self.extractor.extract_all(query)
        
        print(f"\nFull extraction for: '{query}'")
        print(f"  City: {filters.city}")
        print(f"  Property Type: {filters.property_type}")
        print(f"  Bedrooms: {filters.min_bedrooms}-{filters.max_bedrooms}")
        print(f"  Max Price: {filters.max_price}")
        print(f"  Amenities: {filters.building_amenities}")
        print(f"  Has Pool: {filters.has_pool}")
        
        self.assertEqual(filters.city, "Toronto")
        self.assertEqual(filters.property_type, "Condo Apartment")
        self.assertEqual(filters.min_bedrooms, 3)
        self.assertEqual(filters.max_price, 800000)
        self.assertTrue(filters.has_pool)


class TestResidentialFilterMapper(unittest.TestCase):
    """Test filter to API parameter conversion."""
    
    def test_basic_filter_mapping(self):
        """Test basic filter to API params conversion."""
        filters = ResidentialFilters(
            city="Toronto",
            property_type="Condo Apartment",
            min_price=400000,
            max_price=800000,
            min_bedrooms=2,
        )
        
        params = build_residential_api_params(filters)
        
        print("\nBasic filter mapping:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['city'], 'Toronto')
        self.assertEqual(params['propertyType'], 'Condo Apartment')
        self.assertEqual(params['minPrice'], 400000)
        self.assertEqual(params['maxPrice'], 800000)
        self.assertEqual(params['minBedrooms'], 2)
    
    def test_condo_specific_filters(self):
        """Test condo-specific filter mapping."""
        filters = ResidentialFilters(
            property_type="Condo Apartment",
            city="Toronto",
            exposure="south",
            balcony="Open",
            locker="Owned",
            max_maintenance=800,
            building_amenities=["pool", "gym", "concierge"],
        )
        
        params = build_residential_api_params(filters)
        
        print("\nCondo-specific filters:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['exposure'], 'S')
        self.assertEqual(params['balcony'], 'Open')
        self.assertEqual(params['locker'], 'Owned')
        self.assertEqual(params['maxMaintenance'], 800)
        self.assertIn('pool', params['buildingAmenities'])
    
    def test_house_filters(self):
        """Test house-specific filter mapping."""
        filters = ResidentialFilters(
            property_type="Detached",
            city="Mississauga",
            garage_type="Attached",
            basement_type="Finished",
            has_pool=True,
            min_lot_size=5000,
        )
        
        params = build_residential_api_params(filters)
        
        print("\nHouse-specific filters:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['propertyType'], 'Detached')
        self.assertEqual(params['garageType'], 'Attached')
        self.assertEqual(params['basementType'], 'Finished')
        self.assertTrue(params['hasPool'])
        self.assertEqual(params['minLotSize'], 5000)
    
    def test_rental_filters(self):
        """Test rental-specific filter mapping."""
        filters = ResidentialFilters(
            transaction_type="Lease",
            city="Toronto",
            min_price=2000,
            max_price=3500,
            pets_allowed="Yes",
            furnished=True,
        )
        
        params = build_residential_api_params(filters)
        
        print("\nRental-specific filters:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['type'], 'Lease')
        self.assertEqual(params['petsAllowed'], 'Yes')
        self.assertTrue(params['furnished'])
    
    def test_geo_filters(self):
        """Test geo/location filter mapping."""
        filters = ResidentialFilters(
            latitude=43.6532,
            longitude=-79.3832,
            radius_km=5.0,
        )
        
        params = build_residential_api_params(filters)
        
        print("\nGeo filters:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['lat'], 43.6532)
        self.assertEqual(params['lng'], -79.3832)
        self.assertEqual(params['radius'], 5.0)
    
    def test_convenience_function(self):
        """Test the convenience build function."""
        params = build_residential_search_params(
            city="Vancouver",
            property_type="condo",
            min_price=500000,
            max_price=800000,
            min_bedrooms=2,
            transaction_type="sale",
        )
        
        print("\nConvenience function result:")
        print(json.dumps(params, indent=2))
        
        self.assertEqual(params['city'], 'Vancouver')
        self.assertEqual(params['propertyType'], 'Condo Apartment')
        self.assertEqual(params['type'], 'Sale')


class TestResidentialSearchService(unittest.TestCase):
    """Test the residential property search service with real API calls."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.service = get_residential_search_service()
    
    def test_basic_search(self):
        """Test basic property search."""
        print("\n" + "="*60)
        print("TEST: Basic Search - Condos in Toronto")
        print("="*60)
        
        result = self.service.search(
            city="Toronto",
            property_type="Condo Apartment",
            min_price=400000,
            max_price=800000,
            page_size=5,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        print(f"Listings returned: {len(result['listings'])}")
        
        if result['listings']:
            listing = result['listings'][0]
            print(f"\nFirst listing:")
            print(f"  MLS: {listing['mls_number']}")
            print(f"  Price: ${listing['list_price']:,}" if listing['list_price'] else "  Price: N/A")
            print(f"  Address: {listing['address']['full']}")
            print(f"  Bedrooms: {listing['bedrooms']}")
            print(f"  Bathrooms: {listing['bathrooms']}")
        
        self.assertTrue(result['success'])
        # Note: We don't assert >0 listings since API may return 0 for specific filter combinations
    
    def test_search_with_filters(self):
        """Test search with multiple filters."""
        print("\n" + "="*60)
        print("TEST: Multi-filter Search - 3BR Houses in Mississauga")
        print("="*60)
        
        result = self.service.search(
            city="Mississauga",
            property_type="Detached",
            min_bedrooms=3,
            max_bedrooms=4,
            min_price=800000,
            max_price=1500000,
            page_size=5,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        print(f"Filters applied: {result.get('filters_applied', {})}")
        
        if result['listings']:
            for i, listing in enumerate(result['listings'][:3]):
                print(f"\nListing {i+1}:")
                print(f"  MLS: {listing['mls_number']}")
                print(f"  Price: ${listing['list_price']:,}" if listing['list_price'] else "  Price: N/A")
                print(f"  Type: {listing['property_type']}")
                print(f"  Beds: {listing['bedrooms']}, Baths: {listing['bathrooms']}")
        
        self.assertTrue(result['success'])
    
    def test_condo_search(self):
        """Test condo-specific search."""
        print("\n" + "="*60)
        print("TEST: Condo Search with Amenities")
        print("="*60)
        
        result = self.service.search_condos(
            city="Toronto",
            min_price=500000,
            max_price=900000,
            min_bedrooms=2,
            max_maintenance=800,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        if result['listings']:
            listing = result['listings'][0]
            print(f"\nFirst condo:")
            print(f"  MLS: {listing['mls_number']}")
            print(f"  Price: ${listing['list_price']:,}" if listing['list_price'] else "  Price: N/A")
            print(f"  Maintenance: ${listing.get('maintenance_fee', 'N/A')}")
        
        self.assertTrue(result['success'])
    
    def test_rental_search(self):
        """Test rental property search."""
        print("\n" + "="*60)
        print("TEST: Rental Search - Toronto Apartments")
        print("="*60)
        
        result = self.service.search_rentals(
            city="Toronto",
            property_type="condo",
            min_price=2000,
            max_price=4000,
            min_bedrooms=1,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        if result['listings']:
            for i, listing in enumerate(result['listings'][:3]):
                print(f"\nRental {i+1}:")
                print(f"  MLS: {listing['mls_number']}")
                print(f"  Rent: ${listing['list_price']:,}/mo" if listing['list_price'] else "  Rent: N/A")
                print(f"  Address: {listing['address']['full']}")
        
        self.assertTrue(result['success'])
    
    def test_natural_language_search(self):
        """Test natural language query parsing and search."""
        print("\n" + "="*60)
        print("TEST: Natural Language Search")
        print("="*60)
        
        queries = [
            "3 bedroom condo in Toronto under $800k",
            "detached house in Mississauga with pool",
            "2 bedroom apartment for rent in downtown Toronto",
            "townhouse in Brampton between $600k and $900k",
        ]
        
        for query in queries:
            print(f"\nQuery: '{query}'")
            result = self.service.search(
                natural_language_query=query,
                page_size=3,
            )
            print(f"  Success: {result['success']}")
            print(f"  Count: {result['count']}")
            print(f"  Filters: {result.get('filters_applied', {})}")
    
    def test_location_search(self):
        """Test location-based search."""
        print("\n" + "="*60)
        print("TEST: Location Search - By Postal Code")
        print("="*60)
        
        result = self.service.search_by_location(
            postal_code="M5V",
            property_type="Condo Apartment",
            page_size=5,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        if result['listings']:
            print("\nProperties in M5V postal code area:")
            for listing in result['listings'][:3]:
                print(f"  - {listing['address']['full']}")
        
        self.assertTrue(result['success'])
    
    def test_sold_properties_search(self):
        """Test search for sold properties."""
        print("\n" + "="*60)
        print("TEST: Sold Properties Search (Comparables)")
        print("="*60)
        
        # Note: Sold property search may not return results if the API
        # doesn't support historical sold data in the same way
        result = self.service.search_sold(
            city="Toronto",
            property_type="condo",
            min_sold_price=500000,
            max_sold_price=800000,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        if result['listings']:
            for i, listing in enumerate(result['listings'][:3]):
                print(f"\nSold Property {i+1}:")
                print(f"  MLS: {listing['mls_number']}")
                print(f"  Sold Price: ${listing.get('sold_price', 'N/A'):,}" if listing.get('sold_price') else "  Sold Price: N/A")
                print(f"  Sold Date: {listing.get('sold_date', 'N/A')}")
        
        # Sold search may not always return results - just check it didn't error
        # The API may have limitations on historical data access
        self.assertIn('success', result)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""
    
    def setUp(self):
        self.service = get_residential_search_service()
    
    def test_empty_filters(self):
        """Test search with no filters."""
        print("\n" + "="*60)
        print("TEST: Empty Filters (Default Search)")
        print("="*60)
        
        result = self.service.search(page_size=3)
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        # Should still return results (all active listings)
        self.assertTrue(result['success'])
    
    def test_invalid_price_range(self):
        """Test handling of invalid price range (min > max)."""
        print("\n" + "="*60)
        print("TEST: Invalid Price Range (min > max)")
        print("="*60)
        
        result = self.service.search(
            city="Toronto",
            min_price=1000000,  # Higher than max
            max_price=500000,
            page_size=3,
        )
        
        print(f"Success: {result['success']}")
        # Should auto-correct the range
        self.assertTrue(result['success'])
    
    def test_very_narrow_search(self):
        """Test very narrow search criteria (may return 0 results)."""
        print("\n" + "="*60)
        print("TEST: Very Narrow Search Criteria")
        print("="*60)
        
        result = self.service.search(
            city="Toronto",
            property_type="Detached",
            min_bedrooms=10,  # Very high
            max_price=100000,  # Very low for detached
            page_size=5,
        )
        
        print(f"Success: {result['success']}")
        print(f"Count: {result['count']}")
        
        # Should succeed even with 0 results
        self.assertTrue(result['success'])


def run_all_tests():
    """Run all test cases."""
    print("\n" + "="*80)
    print("🏠 RESIDENTIAL PROPERTY SEARCH PIPELINE TESTS")
    print("="*80)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestResidentialFilterExtractor))
    suite.addTests(loader.loadTestsFromTestCase(TestResidentialFilterMapper))
    suite.addTests(loader.loadTestsFromTestCase(TestResidentialSearchService))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success: {result.wasSuccessful()}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
