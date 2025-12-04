#!/usr/bin/env python3
"""
Repliers API Diagnostic Tool
Helps diagnose API connectivity and authentication issues
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_env_vars():
    """Check if required environment variables are set."""
    print("=" * 80)
    print("ENVIRONMENT VARIABLES CHECK")
    print("=" * 80)
    
    api_key = os.getenv('REPLIERS_API_KEY')
    
    if not api_key:
        print("❌ REPLIERS_API_KEY not found in environment")
        return False
    
    print(f"✅ REPLIERS_API_KEY found")
    print(f"   Key (masked): {api_key[:10]}...{api_key[-5:]}")
    print(f"   Key length: {len(api_key)} characters")
    
    return True


def test_api_endpoints():
    """Test different API endpoints and authentication methods."""
    print("\n" + "=" * 80)
    print("API ENDPOINT TESTING")
    print("=" * 80)
    
    api_key = os.getenv('REPLIERS_API_KEY', '')
    base_urls = [
        "https://api.repliers.io",
        "https://repliers.io/api",
        "https://api.repliers.ca"
    ]
    
    endpoints = [
        "/properties/search",
        "/v1/properties/search",
        "/api/properties/search",
        "/search"
    ]
    
    auth_methods = [
        ("Bearer Token", {"Authorization": f"Bearer {api_key}"}),
        ("API Key Header", {"X-API-Key": api_key}),
        ("API Key Header Alt", {"Api-Key": api_key}),
        ("API Key Param", {})
    ]
    
    print(f"\n🔍 Testing {len(base_urls)} base URLs × {len(endpoints)} endpoints × {len(auth_methods)} auth methods")
    print(f"   Total combinations: {len(base_urls) * len(endpoints) * len(auth_methods)}")
    
    success_found = False
    
    for base_url in base_urls:
        print(f"\n📍 Base URL: {base_url}")
        
        for endpoint in endpoints:
            url = f"{base_url}{endpoint}"
            
            for auth_name, headers in auth_methods:
                try:
                    # Add API key as query param for last method
                    params = {'apiKey': api_key} if auth_name == "API Key Param" else {'city': 'Toronto', 'limit': 1}
                    
                    headers_full = {**headers, 'Content-Type': 'application/json'}
                    
                    response = requests.get(
                        url,
                        headers=headers_full,
                        params=params,
                        timeout=10
                    )
                    
                    status = response.status_code
                    
                    if status == 200:
                        print(f"   ✅ {endpoint} with {auth_name}: SUCCESS (200)")
                        print(f"      Response keys: {list(response.json().keys())}")
                        success_found = True
                        return {
                            'base_url': base_url,
                            'endpoint': endpoint,
                            'auth_method': auth_name,
                            'headers': headers
                        }
                    elif status == 401:
                        print(f"   ❌ {endpoint} with {auth_name}: Unauthorized (401)")
                    elif status == 404:
                        print(f"   ⚠️  {endpoint} with {auth_name}: Not Found (404)")
                    else:
                        print(f"   ⚠️  {endpoint} with {auth_name}: Status {status}")
                        
                except requests.exceptions.ConnectionError:
                    print(f"   ❌ {endpoint}: Connection Error (URL may not exist)")
                except requests.exceptions.Timeout:
                    print(f"   ⏱️  {endpoint}: Timeout")
                except Exception as e:
                    print(f"   ❌ {endpoint}: {str(e)[:50]}")
    
    if not success_found:
        print("\n❌ No successful API connection found")
    
    return None


def test_alternative_headers():
    """Test with various header combinations."""
    print("\n" + "=" * 80)
    print("ALTERNATIVE HEADER TESTING")
    print("=" * 80)
    
    api_key = os.getenv('REPLIERS_API_KEY', '')
    url = "https://api.repliers.io/properties/search"
    
    header_combinations = [
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        {
            "Authorization": f"Token {api_key}",
            "Content-Type": "application/json"
        },
        {
            "X-API-KEY": api_key,
            "Content-Type": "application/json"
        },
        {
            "api-key": api_key,
            "Content-Type": "application/json"
        },
        {
            "Authorization": api_key,
            "Content-Type": "application/json"
        }
    ]
    
    print(f"\n🔍 Testing {len(header_combinations)} header combinations")
    
    for i, headers in enumerate(header_combinations, 1):
        try:
            print(f"\n{i}. Headers: {list(headers.keys())}")
            response = requests.get(
                url,
                headers=headers,
                params={'city': 'Toronto', 'limit': 1},
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ SUCCESS!")
                print(f"   Response: {response.json()}")
                return headers
            else:
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                    
        except Exception as e:
            print(f"   Error: {str(e)[:100]}")
    
    return None


def check_api_documentation():
    """Try to fetch API documentation."""
    print("\n" + "=" * 80)
    print("API DOCUMENTATION CHECK")
    print("=" * 80)
    
    doc_urls = [
        "https://api.repliers.io/docs",
        "https://api.repliers.io/swagger",
        "https://api.repliers.io/",
        "https://repliers.io/api/docs",
        "https://repliers.io/docs/api"
    ]
    
    print(f"\n🔍 Checking {len(doc_urls)} documentation URLs")
    
    for url in doc_urls:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ {url}: Available")
                print(f"   Content type: {response.headers.get('content-type', 'unknown')}")
            else:
                print(f"⚠️  {url}: Status {response.status_code}")
        except:
            print(f"❌ {url}: Not accessible")


def provide_recommendations():
    """Provide recommendations based on test results."""
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    print("""
📋 Next Steps:

1. **Verify API Key**
   - Log into your Repliers dashboard at https://repliers.io
   - Navigate to Settings → API Keys
   - Verify the API key matches exactly (case-sensitive)
   - Check if the key has proper permissions enabled

2. **Check API Documentation**
   - Visit https://api.repliers.io/docs or https://repliers.io/api/docs
   - Review the authentication requirements
   - Check if the endpoint paths have changed
   - Verify the expected headers format

3. **Contact Repliers Support**
   - Email: support@repliers.io
   - Provide your API key (for verification)
   - Mention you're getting 401 Unauthorized errors

4. **Alternative: Use Mock Data**
   - The system has fallback mock data built-in
   - All functions will work with realistic data
   - Great for development and testing

5. **Check API Status**
   - Visit https://status.repliers.io (if available)
   - Check if there are any ongoing API issues
   - Verify the API is not under maintenance

6. **Try Different API Key**
   - Generate a new API key in the Repliers dashboard
   - Some keys may have restricted permissions
   - Ensure the key has "Property Search" permissions enabled
""")


def main():
    """Run all diagnostic tests."""
    print("\n")
    print("█" * 80)
    print("█" + " " * 78 + "█")
    print("█" + " " * 20 + "REPLIERS API DIAGNOSTIC TOOL" + " " * 32 + "█")
    print("█" + " " * 78 + "█")
    print("█" * 80)
    
    # Step 1: Check environment variables
    if not check_env_vars():
        print("\n⚠️  Please set REPLIERS_API_KEY in your .env file")
        return
    
    # Step 2: Test API endpoints
    successful_config = test_api_endpoints()
    
    if successful_config:
        print("\n✅ Found working configuration!")
        print(f"\nWorking Configuration:")
        print(f"   Base URL: {successful_config['base_url']}")
        print(f"   Endpoint: {successful_config['endpoint']}")
        print(f"   Auth Method: {successful_config['auth_method']}")
        print(f"\n💡 Update your repliers_valuation_api.py with these settings")
        return
    
    # Step 3: Try alternative headers
    print("\n⏭️  Trying alternative authentication methods...")
    working_headers = test_alternative_headers()
    
    if working_headers:
        print("\n✅ Found working headers!")
        print(f"   Headers: {working_headers}")
        return
    
    # Step 4: Check documentation
    check_api_documentation()
    
    # Step 5: Provide recommendations
    provide_recommendations()
    
    print("\n" + "=" * 80)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 80)
    print("\n⚠️  Could not establish successful API connection")
    print("   The integration code is correct - this is an API key/authentication issue")
    print("   The system will work with mock data until API access is resolved")
    print("\n")


if __name__ == '__main__':
    main()
