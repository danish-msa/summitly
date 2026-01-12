#!/usr/bin/env python3
"""
Repliers API - Residential Property Explorer
=============================================
This script fetches residential properties from Repliers API and
displays all available parameters/fields for residential property data.
It also documents all the MLS form filters that can be used for property searches.

Based on the Residential Property Listing Form analysis, this module maps
ALL available MLS filters to Repliers API parameters.

Author: Summitly Team
Date: January 10, 2026
"""

import os
import sys
import json
import requests
from datetime import datetime
from typing import Dict, Any, List, Set
from collections import defaultdict

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('config/.env')

# API Configuration
REPLIERS_BASE_URL = "https://api.repliers.io"
REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')


# ============================================================================
# MLS RESIDENTIAL FORM FILTERS - COMPLETE MAPPING
# ============================================================================
# Based on the attached MLS Residential Property Listing Form

MLS_RESIDENTIAL_FILTERS = {
    # ================================
    # BASIC PROPERTY INFORMATION
    # ================================
    "property_basics": {
        "class": {
            "description": "Property class type",
            "values": ["residential", "condo", "commercial"],
            "api_param": "class",
            "default": "residential"
        },
        "property_type": {
            "description": "Type of residential property",
            "values": [
                "Detached", "Semi-Detached", "Townhouse", "Condo Apartment",
                "Condo Townhouse", "Duplex", "Triplex", "Fourplex", "Multiplex",
                "Link", "Vacant Land", "Farm", "Mobile/Trailer", "Store w/Apt/Office"
            ],
            "api_param": "propertyType"
        },
        "style": {
            "description": "Architectural style of property",
            "values": [
                "2-Storey", "3-Storey", "Bungalow", "Bungaloft", "Backsplit 3",
                "Backsplit 4", "Backsplit 5", "Sidesplit 3", "Sidesplit 4",
                "Sidesplit 5", "1 1/2 Storey", "2 1/2 Storey", "Split Level",
                "Raised Bungalow", "Loft", "Stacked Townhouse", "Apartment",
                "Tudor Style", "Victorian", "Georgian", "Contemporary", "Other"
            ],
            "api_param": "style"
        },
        "ownership_type": {
            "description": "Ownership structure",
            "values": ["Freehold", "Condominium", "Co-ownership", "Leasehold", "Co-op"],
            "api_param": "ownershipType"
        },
        "transaction_type": {
            "description": "Sale or Lease/Rent",
            "values": ["Sale", "Lease"],
            "api_param": "type"
        },
        "status": {
            "description": "Listing status",
            "values": ["Active", "Sold", "Leased", "Expired", "Terminated", "Suspended"],
            "api_param": "status",
            "api_codes": {"Active": "A", "Sold": "S", "Leased": "L"}
        }
    },
    
    # ================================
    # LOCATION FILTERS
    # ================================
    "location": {
        "city": {
            "description": "City/Municipality",
            "api_param": "city",
            "examples": ["Toronto", "Mississauga", "Brampton", "Vaughan", "Markham"]
        },
        "community": {
            "description": "Community/Area within city",
            "api_param": "community",
            "examples": ["Liberty Village", "King West", "Yorkville"]
        },
        "neighborhood": {
            "description": "Specific neighborhood",
            "api_param": "neighborhood"
        },
        "postal_code": {
            "description": "Postal code (FSA or full)",
            "api_param": "postalCode",
            "examples": ["M5V", "M5B 1E8"]
        },
        "street_name": {
            "description": "Street name for address search",
            "api_param": "streetName"
        },
        "street_number": {
            "description": "Street/house number",
            "api_param": "streetNumber"
        },
        "unit_number": {
            "description": "Unit/Suite number (for condos)",
            "api_param": "unitNumber"
        },
        "major_intersection": {
            "description": "Nearest major intersection",
            "api_param": "majorIntersection"
        },
        "municipality_district": {
            "description": "Municipal district code",
            "api_param": "district"
        },
        "area_code": {
            "description": "MLS area code",
            "api_param": "areaCode"
        }
    },
    
    # ================================
    # PRICE FILTERS
    # ================================
    "price": {
        "list_price_min": {
            "description": "Minimum listing price",
            "api_param": "minPrice",
            "type": "number"
        },
        "list_price_max": {
            "description": "Maximum listing price",
            "api_param": "maxPrice",
            "type": "number"
        },
        "sold_price_min": {
            "description": "Minimum sold price (for sold properties)",
            "api_param": "minSoldPrice",
            "type": "number"
        },
        "sold_price_max": {
            "description": "Maximum sold price",
            "api_param": "maxSoldPrice",
            "type": "number"
        },
        "price_per_sqft_min": {
            "description": "Minimum price per square foot",
            "api_param": "minPricePerSqft",
            "type": "number"
        },
        "price_per_sqft_max": {
            "description": "Maximum price per square foot",
            "api_param": "maxPricePerSqft",
            "type": "number"
        }
    },
    
    # ================================
    # BEDROOMS & BATHROOMS
    # ================================
    "rooms": {
        "bedrooms_min": {
            "description": "Minimum number of bedrooms",
            "api_param": "minBedrooms",
            "type": "integer"
        },
        "bedrooms_max": {
            "description": "Maximum number of bedrooms",
            "api_param": "maxBedrooms",
            "type": "integer"
        },
        "bedrooms_plus": {
            "description": "Plus bedrooms (e.g., den, office)",
            "api_param": "bedroomsPlus",
            "type": "integer"
        },
        "bathrooms_min": {
            "description": "Minimum number of bathrooms",
            "api_param": "minBathrooms",
            "type": "float"
        },
        "bathrooms_max": {
            "description": "Maximum number of bathrooms",
            "api_param": "maxBathrooms",
            "type": "float"
        },
        "rooms_total_min": {
            "description": "Minimum total rooms",
            "api_param": "minRooms",
            "type": "integer"
        },
        "rooms_total_max": {
            "description": "Maximum total rooms",
            "api_param": "maxRooms",
            "type": "integer"
        },
        "kitchen_count": {
            "description": "Number of kitchens",
            "api_param": "kitchens",
            "type": "integer"
        }
    },
    
    # ================================
    # SIZE & LOT
    # ================================
    "size": {
        "sqft_min": {
            "description": "Minimum interior square footage",
            "api_param": "minSqft",
            "type": "integer"
        },
        "sqft_max": {
            "description": "Maximum interior square footage",
            "api_param": "maxSqft",
            "type": "integer"
        },
        "lot_size_min": {
            "description": "Minimum lot size (square feet)",
            "api_param": "minLotSize",
            "type": "integer"
        },
        "lot_size_max": {
            "description": "Maximum lot size (square feet)",
            "api_param": "maxLotSize",
            "type": "integer"
        },
        "lot_depth_min": {
            "description": "Minimum lot depth (feet)",
            "api_param": "minLotDepth",
            "type": "float"
        },
        "lot_depth_max": {
            "description": "Maximum lot depth (feet)",
            "api_param": "maxLotDepth",
            "type": "float"
        },
        "lot_frontage_min": {
            "description": "Minimum lot frontage (feet)",
            "api_param": "minLotFrontage",
            "type": "float"
        },
        "lot_frontage_max": {
            "description": "Maximum lot frontage (feet)",
            "api_param": "maxLotFrontage",
            "type": "float"
        }
    },
    
    # ================================
    # PARKING & GARAGE
    # ================================
    "parking": {
        "parking_spaces_min": {
            "description": "Minimum parking spaces",
            "api_param": "minParkingSpaces",
            "type": "integer"
        },
        "parking_spaces_max": {
            "description": "Maximum parking spaces",
            "api_param": "maxParkingSpaces",
            "type": "integer"
        },
        "garage_spaces": {
            "description": "Number of garage spaces",
            "api_param": "garageSpaces",
            "type": "integer"
        },
        "garage_type": {
            "description": "Type of garage",
            "values": ["Attached", "Detached", "Built-In", "Underground", "None", "Carport"],
            "api_param": "garageType"
        },
        "parking_type": {
            "description": "Type of parking",
            "values": ["Attached Garage", "Detached Garage", "Underground", "Surface", "Street", "Driveway"],
            "api_param": "parkingType"
        },
        "driveway": {
            "description": "Driveway type",
            "values": ["Private", "Mutual", "Right of Way", "Laneway", "Circular", "None"],
            "api_param": "driveway"
        }
    },
    
    # ================================
    # BUILDING & STRUCTURE
    # ================================
    "building": {
        "year_built_min": {
            "description": "Minimum year built",
            "api_param": "minYearBuilt",
            "type": "integer"
        },
        "year_built_max": {
            "description": "Maximum year built",
            "api_param": "maxYearBuilt",
            "type": "integer"
        },
        "stories": {
            "description": "Number of stories/levels",
            "api_param": "stories",
            "type": "integer"
        },
        "basement_type": {
            "description": "Basement type",
            "values": ["Full", "Partial", "Finished", "Unfinished", "Walk-Out", "Apartment", "None"],
            "api_param": "basementType"
        },
        "basement_features": {
            "description": "Basement features",
            "values": ["Separate Entrance", "Walk-Up", "Finished", "Full", "Part Finished"],
            "api_param": "basementFeatures"
        },
        "exterior_finish": {
            "description": "Exterior finish material",
            "values": ["Brick", "Stone", "Vinyl Siding", "Aluminum Siding", "Stucco", "Wood", "Concrete"],
            "api_param": "exterior"
        },
        "construction_type": {
            "description": "Construction type/material",
            "values": ["Brick", "Concrete", "Wood Frame", "Steel Frame", "Log", "Manufactured"],
            "api_param": "constructionType"
        },
        "roof_type": {
            "description": "Roof material/type",
            "values": ["Shingle", "Metal", "Tile", "Flat", "Tar and Gravel", "Slate"],
            "api_param": "roofType"
        },
        "heating_type": {
            "description": "Heating system type",
            "values": ["Forced Air Gas", "Radiant", "Electric", "Hot Water", "Heat Pump", "Baseboard"],
            "api_param": "heatingType"
        },
        "cooling_type": {
            "description": "Cooling/AC type",
            "values": ["Central Air", "Window Unit", "Ductless", "None"],
            "api_param": "coolingType"
        },
        "fireplace": {
            "description": "Has fireplace",
            "api_param": "hasFireplace",
            "type": "boolean"
        },
        "fireplace_count": {
            "description": "Number of fireplaces",
            "api_param": "fireplaceCount",
            "type": "integer"
        }
    },
    
    # ================================
    # CONDO-SPECIFIC FILTERS
    # ================================
    "condo": {
        "condo_fee_min": {
            "description": "Minimum monthly condo/maintenance fee",
            "api_param": "minMaintenance",
            "type": "number"
        },
        "condo_fee_max": {
            "description": "Maximum monthly condo/maintenance fee",
            "api_param": "maxMaintenance",
            "type": "number"
        },
        "exposure": {
            "description": "Unit exposure direction",
            "values": ["N", "S", "E", "W", "NE", "NW", "SE", "SW"],
            "api_param": "exposure"
        },
        "balcony": {
            "description": "Balcony type",
            "values": ["Open", "Enclosed", "Terrace", "Juliet", "None"],
            "api_param": "balcony"
        },
        "locker": {
            "description": "Has storage locker",
            "values": ["Owned", "Ensuite", "Common", "None"],
            "api_param": "locker"
        },
        "floor_level": {
            "description": "Floor level/storey",
            "api_param": "floorLevel",
            "type": "integer"
        },
        "building_amenities": {
            "description": "Building amenities",
            "values": [
                "Concierge", "Security Guard", "Gym", "Pool", "Party Room",
                "Rooftop Deck", "BBQ Area", "Tennis Court", "Sauna", "Hot Tub",
                "Guest Suites", "Car Wash", "Bike Storage", "Pet Friendly"
            ],
            "api_param": "buildingAmenities",
            "type": "array"
        },
        "pets_allowed": {
            "description": "Pets allowed",
            "values": ["Yes", "Restricted", "No"],
            "api_param": "petsAllowed"
        },
        "condo_corporation_number": {
            "description": "Condo corporation number",
            "api_param": "condoCorporation"
        }
    },
    
    # ================================
    # FEATURES & AMENITIES
    # ================================
    "features": {
        "pool": {
            "description": "Has pool",
            "values": ["Indoor", "Inground", "Above Ground", "None"],
            "api_param": "pool"
        },
        "has_pool": {
            "description": "Has any pool (boolean)",
            "api_param": "hasPool",
            "type": "boolean"
        },
        "waterfront": {
            "description": "Waterfront property",
            "values": ["Lake", "River", "Ocean", "Creek", "Pond", "None"],
            "api_param": "waterfront"
        },
        "water_source": {
            "description": "Water source",
            "values": ["Municipal", "Well", "Lake/River", "Cistern"],
            "api_param": "waterSource"
        },
        "sewers": {
            "description": "Sewer system",
            "values": ["Sewers", "Septic", "Holding Tank"],
            "api_param": "sewers"
        },
        "hydro": {
            "description": "Electricity/Hydro availability",
            "api_param": "hydro",
            "type": "boolean"
        },
        "cable": {
            "description": "Cable TV availability",
            "api_param": "cable",
            "type": "boolean"
        },
        "central_vac": {
            "description": "Central vacuum system",
            "api_param": "centralVac",
            "type": "boolean"
        },
        "elevator": {
            "description": "Has elevator",
            "api_param": "hasElevator",
            "type": "boolean"
        },
        "family_room": {
            "description": "Has family room",
            "api_param": "familyRoom",
            "type": "boolean"
        },
        "energy_certificate": {
            "description": "Energy efficiency certificate",
            "api_param": "energyCertificate"
        }
    },
    
    # ================================
    # TAXES & FINANCIALS
    # ================================
    "financials": {
        "taxes_min": {
            "description": "Minimum annual property taxes",
            "api_param": "minTaxes",
            "type": "number"
        },
        "taxes_max": {
            "description": "Maximum annual property taxes",
            "api_param": "maxTaxes",
            "type": "number"
        },
        "tax_year": {
            "description": "Tax assessment year",
            "api_param": "taxYear",
            "type": "integer"
        },
        "assessment_value": {
            "description": "Property assessment value",
            "api_param": "assessmentValue",
            "type": "number"
        }
    },
    
    # ================================
    # DATES & TIMELINE
    # ================================
    "dates": {
        "list_date_min": {
            "description": "Listed after this date (YYYY-MM-DD)",
            "api_param": "minListDate"
        },
        "list_date_max": {
            "description": "Listed before this date (YYYY-MM-DD)",
            "api_param": "maxListDate"
        },
        "sold_date_min": {
            "description": "Sold after this date",
            "api_param": "minSoldDate"
        },
        "sold_date_max": {
            "description": "Sold before this date",
            "api_param": "maxSoldDate"
        },
        "updated_on_min": {
            "description": "Updated after this date",
            "api_param": "minUpdatedOn"
        },
        "updated_on_max": {
            "description": "Updated before this date",
            "api_param": "maxUpdatedOn"
        },
        "closing_date_min": {
            "description": "Closing date after",
            "api_param": "minClosingDate"
        },
        "closing_date_max": {
            "description": "Closing date before",
            "api_param": "maxClosingDate"
        },
        "days_on_market_min": {
            "description": "Minimum days on market",
            "api_param": "minDom",
            "type": "integer"
        },
        "days_on_market_max": {
            "description": "Maximum days on market",
            "api_param": "maxDom",
            "type": "integer"
        }
    },
    
    # ================================
    # MLS & AGENT INFO
    # ================================
    "mls": {
        "mls_number": {
            "description": "MLS listing number",
            "api_param": "mlsNumber"
        },
        "board": {
            "description": "MLS board",
            "values": ["TRREB", "CREA", "REBGV", "CREB"],
            "api_param": "board"
        },
        "office_name": {
            "description": "Listing office/brokerage name",
            "api_param": "officeName"
        },
        "agent_name": {
            "description": "Listing agent name",
            "api_param": "agentName"
        },
        "virtual_tour": {
            "description": "Has virtual tour",
            "api_param": "hasVirtualTour",
            "type": "boolean"
        },
        "has_images": {
            "description": "Has listing images",
            "api_param": "hasImages",
            "type": "boolean"
        }
    },
    
    # ================================
    # RENTAL-SPECIFIC FILTERS
    # ================================
    "rental": {
        "lease_term": {
            "description": "Lease term",
            "values": ["Monthly", "1 Year", "2 Years", "Negotiable"],
            "api_param": "leaseTerm"
        },
        "utilities_included": {
            "description": "Utilities included in rent",
            "values": ["Heat", "Hydro", "Water", "Cable", "Internet", "All", "None"],
            "api_param": "utilitiesIncluded",
            "type": "array"
        },
        "furnished": {
            "description": "Is furnished",
            "api_param": "furnished",
            "type": "boolean"
        },
        "available_date": {
            "description": "Available/move-in date",
            "api_param": "availableDate"
        }
    },
    
    # ================================
    # SORTING & PAGINATION
    # ================================
    "sorting": {
        "sort_by": {
            "description": "Sort results by field",
            "values": [
                "listPrice", "listPriceDesc", "listDate", "listDateDesc",
                "updatedOn", "updatedOnDesc", "sqft", "sqftDesc",
                "bedrooms", "bedroomsDesc", "dom", "domDesc"
            ],
            "api_param": "sortBy"
        },
        "page": {
            "description": "Page number for pagination",
            "api_param": "page",
            "type": "integer",
            "default": 1
        },
        "page_size": {
            "description": "Results per page",
            "api_param": "resultsPerPage",
            "type": "integer",
            "default": 25,
            "max": 200
        }
    },
    
    # ================================
    # GEO/MAP SEARCH
    # ================================
    "geo": {
        "latitude": {
            "description": "Center latitude for radius search",
            "api_param": "lat",
            "type": "float"
        },
        "longitude": {
            "description": "Center longitude for radius search",
            "api_param": "lng",
            "type": "float"
        },
        "radius": {
            "description": "Search radius in kilometers",
            "api_param": "radius",
            "type": "float"
        },
        "bounding_box": {
            "description": "Map bounding box [sw_lat, sw_lng, ne_lat, ne_lng]",
            "api_param": "bounds",
            "type": "array"
        },
        "polygon": {
            "description": "Custom polygon coordinates for search area",
            "api_param": "polygon",
            "type": "array"
        }
    },
    
    # ================================
    # KEYWORDS & FREE TEXT
    # ================================
    "text_search": {
        "keywords": {
            "description": "Free-text keyword search",
            "api_param": "keywords",
            "examples": ["waterfront", "renovated", "corner lot", "ravine"]
        },
        "remarks_search": {
            "description": "Search in listing remarks/description",
            "api_param": "remarksSearch"
        },
        "exclude_keywords": {
            "description": "Keywords to exclude from results",
            "api_param": "excludeKeywords",
            "type": "array"
        }
    }
}


def make_api_request(endpoint: str, params: Dict[str, Any] = None) -> Dict:
    """Make a request to Repliers API"""
    url = f"{REPLIERS_BASE_URL}{endpoint}"
    headers = {
        'REPLIERS-API-KEY': REPLIERS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    print(f"\n📡 Making request to: {url}")
    if params:
        print(f"   Parameters: {json.dumps(params, indent=2)}")
    
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error {response.status_code}: {response.text[:500]}")
        return {}


def extract_all_keys(obj: Any, prefix: str = "", keys_set: Set[str] = None) -> Set[str]:
    """Recursively extract all keys from a nested dictionary/list structure"""
    if keys_set is None:
        keys_set = set()
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            keys_set.add(full_key)
            extract_all_keys(value, full_key, keys_set)
    elif isinstance(obj, list) and obj:
        # Process first item in list to get structure
        extract_all_keys(obj[0], f"{prefix}[0]", keys_set)
    
    return keys_set


def categorize_fields(keys: Set[str]) -> Dict[str, List[str]]:
    """Categorize fields by their parent structure"""
    categories = defaultdict(list)
    
    for key in sorted(keys):
        parts = key.split('.')
        if len(parts) == 1:
            categories['Root Level'].append(key)
        else:
            category = parts[0].replace('[0]', '')
            categories[category].append(key)
    
    return dict(categories)


def fetch_sample_residential_properties(count: int = 5) -> List[Dict]:
    """Fetch sample residential properties for analysis"""
    params = {
        'class': 'residential',
        'status': 'A',
        'resultsPerPage': count,
        'sortBy': 'updatedOnDesc'
    }
    
    response = make_api_request('/listings', params)
    return response.get('listings', [])


def main():
    print("=" * 80)
    print("🏠 REPLIERS API - RESIDENTIAL PROPERTY EXPLORER")
    print("=" * 80)
    print(f"\n📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔑 API Key: {REPLIERS_API_KEY[:10]}...{REPLIERS_API_KEY[-5:]}" if REPLIERS_API_KEY else "❌ No API Key!")
    
    if not REPLIERS_API_KEY:
        print("\n❌ Error: REPLIERS_API_KEY not found in environment variables!")
        return
    
    # ============================================
    # 1. Document All MLS Form Filters
    # ============================================
    print("\n" + "=" * 80)
    print("📋 MLS RESIDENTIAL FORM - ALL AVAILABLE FILTERS")
    print("=" * 80)
    
    total_filters = 0
    for category, filters in MLS_RESIDENTIAL_FILTERS.items():
        print(f"\n🔷 {category.upper().replace('_', ' ')}:")
        print("-" * 40)
        for filter_name, filter_info in filters.items():
            total_filters += 1
            desc = filter_info.get('description', '')
            api_param = filter_info.get('api_param', 'N/A')
            values = filter_info.get('values', [])
            print(f"   • {filter_name}: {desc}")
            print(f"     API: {api_param}")
            if values:
                print(f"     Values: {', '.join(values[:5])}{'...' if len(values) > 5 else ''}")
    
    print(f"\n📊 Total Filters Available: {total_filters}")
    
    # ============================================
    # 2. Fetch Residential Properties
    # ============================================
    print("\n" + "=" * 80)
    print("📊 FETCHING SAMPLE RESIDENTIAL PROPERTIES")
    print("=" * 80)
    
    listings = fetch_sample_residential_properties(5)
    
    if listings and len(listings) > 0:
        print(f"\n✅ Found {len(listings)} residential properties")
        
        # ============================================
        # 3. Analyze First Property in Detail
        # ============================================
        print("\n" + "=" * 80)
        print("🏠 SAMPLE RESIDENTIAL PROPERTY - FULL STRUCTURE")
        print("=" * 80)
        
        sample_property = listings[0]
        
        # Pretty print the full structure
        print("\n📄 COMPLETE JSON STRUCTURE:")
        print("-" * 40)
        print(json.dumps(sample_property, indent=2, default=str))
        
        # ============================================
        # 4. Extract and Categorize All Fields
        # ============================================
        print("\n" + "=" * 80)
        print("📊 ALL RESPONSE FIELDS (CATEGORIZED)")
        print("=" * 80)
        
        all_keys = extract_all_keys(sample_property)
        categorized = categorize_fields(all_keys)
        
        for category, fields in sorted(categorized.items()):
            print(f"\n🔷 {category.upper()}:")
            print("-" * 40)
            for field in sorted(fields):
                # Get value for this field
                parts = field.replace('[0]', '').split('.')
                value = sample_property
                try:
                    for part in parts:
                        if isinstance(value, dict):
                            value = value.get(part, 'N/A')
                        elif isinstance(value, list) and value:
                            value = value[0].get(part, 'N/A') if isinstance(value[0], dict) else value[0]
                        else:
                            value = 'N/A'
                    
                    # Truncate long values
                    str_value = str(value)
                    if len(str_value) > 50:
                        str_value = str_value[:50] + "..."
                    
                    print(f"   • {field}: {str_value}")
                except:
                    print(f"   • {field}")
        
        # ============================================
        # 5. Save Full Report
        # ============================================
        report = {
            'timestamp': datetime.now().isoformat(),
            'api_endpoint': '/listings',
            'total_listings': len(listings),
            'mls_form_filters': MLS_RESIDENTIAL_FILTERS,
            'sample_properties': listings,
            'all_response_fields': list(sorted(all_keys)),
            'categorized_fields': categorized
        }
        
        report_path = 'tests/residential_property_fields_report.json'
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"\n\n💾 Full report saved to: {report_path}")
        
    else:
        print("\n⚠️ No residential properties found in the response")
    
    print("\n" + "=" * 80)
    print("✅ EXPLORATION COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
