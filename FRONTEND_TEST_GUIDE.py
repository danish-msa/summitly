"""
FRONTEND TESTING GUIDE
======================
Comprehensive test prompts for the improved chatbot property search.

Use these prompts to test the chatbot on your frontend interface.
Each test validates specific filter mapping capabilities.

Author: Summitly Team
Date: December 15, 2025
"""

# ============================================================================
# SECTION 1: BASIC PROPERTY SEARCH
# ============================================================================

BASIC_SEARCH_PROMPTS = [
    # Test 1: Basic bedroom/bathroom/price/location
    "Show me 2 bedroom 2 bathroom properties under 800k in Vaughan",
    # Expected: minBeds=2, maxBeds=2, minBaths=2, maxPrice=800000, city=Vaughan
    
    # Test 2: Property type specification
    "Find detached homes in Mississauga",
    # Expected: propertyType=Detached, city=Mississauga
    
    # Test 3: Price range
    "Condos in Toronto between 500k and 700k",
    # Expected: propertyType=Condo Apartment, minPrice=500000, maxPrice=700000, city=Toronto
    
    # Test 4: Bedroom range
    "3 to 4 bedroom houses in Oakville",
    # Expected: minBeds=3, maxBeds=4, city=Oakville
]

# ============================================================================
# SECTION 2: RENTAL SEARCHES
# ============================================================================

RENTAL_SEARCH_PROMPTS = [
    # Test 5: Basic rental
    "Show me rentals in Toronto under 3000",
    # Expected: transactionType=Lease, maxPrice=3000, city=Toronto
    
    # Test 6: Rental with bedrooms
    "3 bedroom apartments for rent in Mississauga under 2500",
    # Expected: transactionType=Lease, minBeds=3, maxPrice=2500, city=Mississauga
    
    # Test 7: Rental with amenities
    "2 bed rental with parking in downtown Toronto under 3500",
    # Expected: transactionType=Lease, minBeds=2, parkingSpaces>=1, city=Toronto, maxPrice=3500
]

# ============================================================================
# SECTION 3: LOCATION HIERARCHY TESTS
# ============================================================================

LOCATION_TESTS = [
    # Test 8: City-only search
    "Properties in Brampton",
    # Expected: city=Brampton
    
    # Test 9: Neighborhood search (should infer city)
    "Condos in Yorkville",
    # Expected: neighborhood=Yorkville, city=Toronto (inferred)
    
    # Test 10: Community search
    "Homes in Port Credit",
    # Expected: community=Port Credit, city=Mississauga (inferred)
    
    # Test 11: Multiple cities in conversation (should reset location)
    "Show me properties in Toronto" 
    # Then: "How about in Vaughan instead"
    # Expected: city=Vaughan (Toronto should be replaced, not mixed)
]

# ============================================================================
# SECTION 4: DATE FILTERING
# ============================================================================

DATE_FILTER_PROMPTS = [
    # Test 12: New listings
    "Show me new listings in Toronto",
    # Expected: minListDate=(7 days ago), maxListDate=(today), city=Toronto
    
    # Test 13: Listings from this week
    "Properties listed this week in Mississauga",
    # Expected: minListDate=(7 days ago), maxListDate=(today), city=Mississauga
    
    # Test 14: Listings from yesterday
    "What was listed yesterday in Oakville",
    # Expected: minListDate=(yesterday), maxListDate=(yesterday), city=Oakville
    
    # Test 15: Last 3 days
    "Properties listed in the last 3 days in Vaughan",
    # Expected: minListDate=(3 days ago), maxListDate=(today), city=Vaughan
    
    # Test 16: Without date keywords (should NOT apply date filter)
    "Show me condos in Toronto",
    # Expected: NO minListDate/maxListDate (only apply when user mentions dates)
]

# ============================================================================
# SECTION 5: AMENITIES & FEATURES
# ============================================================================

AMENITY_PROMPTS = [
    # Test 17: Pool
    "Houses with a pool in Burlington",
    # Expected: amenities contains Pool, city=Burlington
    
    # Test 18: Gym
    "Condos with gym in Toronto",
    # Expected: amenities contains Gym, city=Toronto
    
    # Test 19: Multiple amenities
    "3 bedroom property with pool and gym in Markham",
    # Expected: amenities contains Pool,Gym, minBeds=3, city=Markham
    
    # Test 20: Parking
    "2 bedroom condo with parking in downtown Toronto",
    # Expected: parkingSpaces>=1, minBeds=2, city=Toronto
]

# ============================================================================
# SECTION 6: CONDO-SPECIFIC FEATURES
# ============================================================================

CONDO_FEATURE_PROMPTS = [
    # Test 21: Balcony
    "Condo with balcony in Toronto",
    # Expected: propertyType=Condo Apartment, balcony=Yes, city=Toronto
    
    # Test 22: Exposure
    "South-facing condo in Mississauga",
    # Expected: propertyType=Condo Apartment, exposure=South, city=Mississauga
    
    # Test 23: Locker
    "Condo with locker storage in Oakville",
    # Expected: propertyType=Condo Apartment, locker=Yes, city=Oakville
]

# ============================================================================
# SECTION 7: REFINEMENT TESTS
# ============================================================================

REFINEMENT_PROMPTS = [
    # Test 24: Progressive refinement
    "Show me properties in Toronto",
    # Then: "With 2 bedrooms"
    # Then: "Under 600k"
    # Expected: All filters preserved and added progressively
    
    # Test 25: Adding amenities
    "Find condos in Mississauga",
    # Then: "How about those with a pool"
    # Expected: Previous filters preserved, amenities added
    
    # Test 26: Changing price
    "3 bedroom homes in Vaughan under 900k",
    # Then: "Actually, under 800k"
    # Expected: maxPrice updated to 800000, other filters preserved
]

# ============================================================================
# SECTION 8: COMPREHENSIVE COMPLEX SEARCHES
# ============================================================================

COMPLEX_SEARCH_PROMPTS = [
    # Test 27: Many filters at once
    "Show me 3-4 bedroom detached homes in Oakville between 700k and 1.2M with pool and 2 parking spots",
    # Expected: minBeds=3, maxBeds=4, propertyType=Detached, city=Oakville, 
    #           minPrice=700000, maxPrice=1200000, amenities=Pool, parkingSpaces=2
    
    # Test 28: Rental with multiple criteria
    "3 bedroom apartment for rent in Toronto under 3500 with gym and parking",
    # Expected: transactionType=Lease, minBeds=3, city=Toronto, maxPrice=3500,
    #           amenities=Gym, parkingSpaces>=1
    
    # Test 29: Condo with all features
    "2 bed 2 bath condo with south exposure, balcony, and locker in downtown Toronto under 650k",
    # Expected: minBeds=2, minBaths=2, propertyType=Condo Apartment, exposure=South,
    #           balcony=Yes, locker=Yes, city=Toronto, maxPrice=650000
]

# ============================================================================
# SECTION 9: EDGE CASES
# ============================================================================

EDGE_CASE_PROMPTS = [
    # Test 30: No budget specified
    "Show me properties in Toronto",
    # Expected: NO price filters (don't apply default budget)
    
    # Test 31: Removing budget
    "3 bedroom homes in Mississauga under 800k",
    # Then: "Actually, show me any price range"
    # Expected: Price filters removed
    
    # Test 32: Very specific search
    "2+1 bedroom condo",
    # Expected: bedroomsPlus=2+1
    
    # Test 33: Luxury search
    "Luxury homes over 2 million in Oakville",
    # Expected: minPrice=2000000, city=Oakville
]

# ============================================================================
# SECTION 10: EXPECTED RESPONSE FORMAT
# ============================================================================

EXPECTED_RESPONSE_ELEMENTS = """
For each search, the chatbot should return:

1. RESPONSE TEXT: 
   - Natural language summary of what was found
   - Example: "I found 15 properties matching your criteria in Vaughan!"

2. APPLIED FILTERS SUMMARY:
   - Clear statement of which filters were applied
   - Example: "Showing 2 bedroom, 2 bathroom properties under $800,000 in Vaughan"

3. PROPERTY COUNT:
   - Total number of results
   - Example: "15 properties found"

4. PROPERTY CARDS:
   - Top 10 properties displayed with:
     * Address
     * Price (formatted: $800,000 for sale, $3,000/month for rent)
     * Bedrooms & bathrooms
     * Square footage
     * Property type
     * MLS number
     * Image

5. SUGGESTIONS:
   - 2-3 relevant follow-up suggestions
   - Example: 
     * "Would you like to see properties with different amenities?"
     * "I can show you similar properties in nearby areas"
     * "Would you like to adjust the price range?"
"""

# ============================================================================
# TESTING CHECKLIST
# ============================================================================

TESTING_CHECKLIST = """
✅ CHECKLIST FOR EACH TEST:

1. Filters Applied Correctly
   □ All user-specified filters are present in the API call
   □ No extra/unwanted filters added
   □ Filter values match user intent (e.g., 800k = 800000, not 800)

2. Location Validation
   □ City/community/neighborhood hierarchy is correct
   □ No mixing of incompatible locations
   □ Proper fallback if community doesn't belong to city

3. Date Filtering
   □ Date filters ONLY applied when user mentions "new", "recent", "this week", etc.
   □ Date format is YYYY-MM-DD
   □ Uses minListDate/maxListDate (NOT listedAfter/listedBefore)

4. Transaction Type
   □ Rental searches use transactionType=Lease
   □ Sale searches use transactionType=Sale
   □ Price interpretation correct (monthly for rent, total for sale)

5. Response Quality
   □ Response acknowledges the search criteria
   □ Result count is accurate
   □ Properties displayed match the filters
   □ Suggestions are relevant and helpful

6. Refinement Behavior
   □ Previous filters preserved when adding new ones
   □ Filters correctly updated when user changes them
   □ City change triggers fresh search (doesn't mix cities)

7. Error Handling
   □ No results: helpful message with suggestions
   □ Invalid filters: graceful handling with clarification
   □ API errors: user-friendly error message
"""

# ============================================================================
# QUICK TEST SCRIPT
# ============================================================================

QUICK_TEST_SEQUENCE = """
QUICK 5-MINUTE TEST:

1. "Show me 2 bed 2 bath under 800k in Vaughan"
   ✓ Check: All 4 filters applied, result count shown

2. "How about in Toronto instead"
   ✓ Check: Location changed to Toronto, other filters preserved

3. "Show me new listings from last week"
   ✓ Check: Date filters added (minListDate/maxListDate)

4. "With a pool"
   ✓ Check: Pool amenity added, previous filters preserved

5. "Show me rentals under 3000"
   ✓ Check: transactionType=Lease, price is monthly

If all 5 tests pass, the system is working correctly! ✅
"""

# ============================================================================
# PRINT TEST GUIDE
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("CHATBOT PROPERTY SEARCH - FRONTEND TEST GUIDE")
    print("="*80)
    
    sections = [
        ("BASIC PROPERTY SEARCH", BASIC_SEARCH_PROMPTS),
        ("RENTAL SEARCHES", RENTAL_SEARCH_PROMPTS),
        ("LOCATION HIERARCHY", LOCATION_TESTS),
        ("DATE FILTERING", DATE_FILTER_PROMPTS),
        ("AMENITIES & FEATURES", AMENITY_PROMPTS),
        ("CONDO-SPECIFIC FEATURES", CONDO_FEATURE_PROMPTS),
        ("REFINEMENT TESTS", REFINEMENT_PROMPTS),
        ("COMPLEX SEARCHES", COMPLEX_SEARCH_PROMPTS),
        ("EDGE CASES", EDGE_CASE_PROMPTS),
    ]
    
    test_num = 1
    for section_name, prompts in sections:
        print(f"\n{'='*80}")
        print(f"SECTION: {section_name}")
        print('='*80)
        
        for prompt in prompts:
            print(f"\n🧪 Test #{test_num}:")
            print(f"   {prompt}")
            test_num += 1
    
    print(f"\n{'='*80}")
    print("EXPECTED RESPONSE FORMAT")
    print('='*80)
    print(EXPECTED_RESPONSE_ELEMENTS)
    
    print(f"\n{'='*80}")
    print("TESTING CHECKLIST")
    print('='*80)
    print(TESTING_CHECKLIST)
    
    print(f"\n{'='*80}")
    print("QUICK TEST SEQUENCE")
    print('='*80)
    print(QUICK_TEST_SEQUENCE)
    
    print("\n✅ Total Test Cases: 30+")
    print("📋 Use this guide to systematically test all chatbot features\n")
