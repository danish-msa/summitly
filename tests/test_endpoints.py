#!/usr/bin/env python3
"""
Test Repliers API endpoints to find which ones work
"""

import requests

API_KEY = 'tVbura2ggfQb1yEdnz0lmP8cEAaL7n'
BASE_URL = 'https://api.repliers.io'

endpoints_to_test = [
    '/health',
    '/ping',
    '/status',
    '/v1/listings',
    '/v2/listings',
    '/api/listings',
    '/listings',
    '/properties',
    '/search',
]

print("=" * 80)
print("TESTING REPLIERS API ENDPOINTS")
print("=" * 80)
print()

for endpoint in endpoints_to_test:
    url = f"{BASE_URL}{endpoint}"
    
    print(f"Testing: {endpoint}")
    print("-" * 40)
    
    # Try with key parameter
    try:
        response = requests.get(url, params={'key': API_KEY, 'limit': 1}, timeout=10)
        print(f"  With 'key' param: {response.status_code}")
        if response.status_code != 404:
            print(f"    Response: {response.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")
    
    print()

print("=" * 80)
