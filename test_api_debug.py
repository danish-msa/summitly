#!/usr/bin/env python3
"""Debug script to check API response structure"""

import requests
import json

BASE_URL = "http://localhost:5050"

# Test multiple queries to understand API behavior
queries = [
    "spa in Ottawa",
    "find me a spa for sale in Ottawa",
    "I'm looking for a restaurant in Toronto",
    "show commercial properties in Ottawa",
    "bakery for sale",
    "car wash in Mississauga"
]

for query in queries:
    print(f"\n{'='*60}")
    print(f"Testing: '{query}'")
    print('='*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": query, "session_id": f"test-{hash(query) % 10000}"},
            timeout=60
        )
        
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Intent: {data.get('intent')}")
        print(f"Filters: {data.get('filters')}")
        print(f"Properties: {data.get('property_count', 0)}")
        print(f"Response: {data.get('response', '')[:200]}")
        
        if data.get('properties'):
            print(f"\nFirst 3 properties:")
            for i, prop in enumerate(data['properties'][:3]):
                addr = prop.get('address', {})
                commercial = prop.get('commercial', {})
                details = prop.get('details', {})
                biz_type = commercial.get('businessType') or details.get('businessType') or 'N/A'
                print(f"  {i+1}. MLS {prop.get('mlsNumber')}: {biz_type}")
                print(f"     {addr.get('streetNumber', '')} {addr.get('streetName', '')} - {addr.get('city', '')}")
                print(f"     Price: ${prop.get('listPrice', 0):,}")
        
    except Exception as e:
        print(f"Error: {e}")
