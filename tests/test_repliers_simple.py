#!/usr/bin/env python3
"""
Simplest possible Repliers API test
"""

import requests

# The purchased API key
API_KEY = 'tVbura2ggfQb1yEdnz0lmP8cEAaL7n'

print("=" * 80)
print("SIMPLEST REPLIERS API TEST")
print("=" * 80)
print()

# Test 1: Try with just key parameter (no map, no fields)
print("TEST 1: Minimal request with just 'key' parameter")
print("-" * 80)

url = "https://api.repliers.io/listings"
params = {
    'key': API_KEY,
    'limit': 1
}

print(f"URL: {url}")
print(f"Params: key={API_KEY[:10]}..., limit=1")
print()

response = requests.get(url, params=params, timeout=15)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}")
print()

# Test 2: Try with Authorization header
print("TEST 2: Bearer token in Authorization header")
print("-" * 80)

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

response2 = requests.get(url, headers=headers, params={'limit': 1}, timeout=15)
print(f"Status: {response2.status_code}")
print(f"Response: {response2.text[:200]}")
print()

# Test 3: Try with X-API-Key header only
print("TEST 3: X-API-Key header only")
print("-" * 80)

headers3 = {
    'X-API-Key': API_KEY
}

response3 = requests.get(url, headers=headers3, params={'limit': 1}, timeout=15)
print(f"Status: {response3.status_code}")
print(f"Response: {response3.text[:200]}")
print()

# Test 4: Try with api-key header (lowercase)
print("TEST 4: api-key header (lowercase)")
print("-" * 80)

headers4 = {
    'api-key': API_KEY
}

response4 = requests.get(url, headers=headers4, params={'limit': 1}, timeout=15)
print(f"Status: {response4.status_code}")
print(f"Response: {response4.text[:200]}")
print()

print("=" * 80)
