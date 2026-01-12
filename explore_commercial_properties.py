#!/usr/bin/env python3
"""
Repliers API - Commercial Property Explorer
============================================
This script fetches commercial properties from Repliers API and
displays all available parameters/fields for commercial property data.

Author: Summitly Team
Date: December 31, 2025
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

def main():
    print("=" * 80)
    print("🏢 REPLIERS API - COMMERCIAL PROPERTY EXPLORER")
    print("=" * 80)
    print(f"\n📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔑 API Key: {REPLIERS_API_KEY[:10]}...{REPLIERS_API_KEY[-5:]}" if REPLIERS_API_KEY else "❌ No API Key!")
    
    if not REPLIERS_API_KEY:
        print("\n❌ Error: REPLIERS_API_KEY not found in environment variables!")
        return
    
    # ============================================
    # 1. Fetch Commercial Properties
    # ============================================
    print("\n" + "=" * 80)
    print("📊 FETCHING COMMERCIAL PROPERTIES")
    print("=" * 80)
    
    # Search for commercial properties
    commercial_params = {
        'class': 'commercial',  # Commercial class
        'status': 'A',  # Active listings
        'resultsPerPage': 5,  # Get 5 samples
        'sortBy': 'updatedOnDesc'  # Most recent first
    }
    
    commercial_response = make_api_request('/listings', commercial_params)
    
    if not commercial_response:
        # Try alternative parameters
        print("\n🔄 Trying alternative search parameters...")
        commercial_params = {
            'type': 'Commercial',
            'status': 'A',
            'resultsPerPage': 5
        }
        commercial_response = make_api_request('/listings', commercial_params)
    
    # ============================================
    # 2. Analyze Response Structure
    # ============================================
    if commercial_response:
        print("\n" + "=" * 80)
        print("📋 API RESPONSE STRUCTURE")
        print("=" * 80)
        
        # Top-level keys
        print("\n🔹 Top-level response keys:")
        for key in commercial_response.keys():
            value = commercial_response[key]
            if isinstance(value, list):
                print(f"   • {key}: List with {len(value)} items")
            elif isinstance(value, dict):
                print(f"   • {key}: Dict with {len(value)} keys")
            else:
                print(f"   • {key}: {type(value).__name__} = {value}")
        
        # Get listings
        listings = commercial_response.get('listings', [])
        if not listings:
            # Try other common keys
            for possible_key in ['results', 'data', 'properties']:
                listings = commercial_response.get(possible_key, [])
                if listings:
                    print(f"\n✅ Found listings under key: '{possible_key}'")
                    break
        
        if listings and len(listings) > 0:
            print(f"\n✅ Found {len(listings)} commercial properties")
            
            # ============================================
            # 3. Analyze First Property in Detail
            # ============================================
            print("\n" + "=" * 80)
            print("🏢 SAMPLE COMMERCIAL PROPERTY - FULL STRUCTURE")
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
            print("📊 ALL AVAILABLE FIELDS (CATEGORIZED)")
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
            # 5. Create Summary Report
            # ============================================
            print("\n" + "=" * 80)
            print("📋 FIELD SUMMARY BY CATEGORY")
            print("=" * 80)
            
            # Common commercial property fields
            commercial_fields = {
                'Basic Info': ['mlsNumber', 'listPrice', 'status', 'type', 'class'],
                'Address': ['address.streetNumber', 'address.streetName', 'address.city', 'address.province', 'address.postalCode', 'address.neighborhood'],
                'Building Details': ['details.sqft', 'details.numUnits', 'details.numFloors', 'details.yearBuilt', 'details.zoning'],
                'Commercial Specific': ['details.businessType', 'details.businessCategory', 'details.occupancy', 'details.leaseTerm', 'details.netRentPerSqft'],
                'Location': ['map.latitude', 'map.longitude', 'address.majorIntersection'],
                'Financial': ['taxes.annualAmount', 'maintenance.fee', 'details.capRate', 'details.noi'],
                'Parking': ['details.numParkingSpaces', 'details.parkingType'],
                'Media': ['images', 'virtualTour'],
                'Dates': ['listDate', 'updatedOn', 'soldDate', 'closedDate'],
                'Agent/Office': ['office.name', 'agents']
            }
            
            print("\n🔍 Key Commercial Property Fields:")
            for category, fields in commercial_fields.items():
                print(f"\n  📁 {category}:")
                for field in fields:
                    parts = field.split('.')
                    value = sample_property
                    try:
                        for part in parts:
                            if isinstance(value, dict):
                                value = value.get(part, None)
                            else:
                                value = None
                                break
                        if value is not None:
                            str_value = str(value)
                            if len(str_value) > 60:
                                str_value = str_value[:60] + "..."
                            print(f"      ✅ {field}: {str_value}")
                        else:
                            print(f"      ❌ {field}: Not available")
                    except:
                        print(f"      ❓ {field}: Error accessing")
            
            # ============================================
            # 6. Save Full Report
            # ============================================
            report = {
                'timestamp': datetime.now().isoformat(),
                'api_endpoint': '/listings',
                'parameters': commercial_params,
                'total_listings': len(listings),
                'sample_property': sample_property,
                'all_fields': list(sorted(all_keys)),
                'categorized_fields': categorized
            }
            
            report_path = 'tests/commercial_property_fields_report.json'
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            print(f"\n\n💾 Full report saved to: {report_path}")
            
        else:
            print("\n⚠️ No commercial properties found in the response")
            print("Response structure:")
            print(json.dumps(commercial_response, indent=2, default=str)[:2000])
    
    else:
        print("\n❌ Failed to fetch commercial properties")
    
    # ============================================
    # 7. Try to get property types
    # ============================================
    print("\n" + "=" * 80)
    print("📊 AVAILABLE PROPERTY CLASSES/TYPES")
    print("=" * 80)
    
    # Try to get available property types
    types_response = make_api_request('/listings/property-types')
    if types_response:
        print("\n✅ Available property types:")
        print(json.dumps(types_response, indent=2, default=str))
    
    print("\n" + "=" * 80)
    print("✅ EXPLORATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
