"""
Quick test for early termination fix
"""
import requests
import time
import json

BASE_URL = "http://localhost:5050"

def test_early_termination():
    """Test that early termination speeds up searches"""
    
    print("="*80)
    print("EARLY TERMINATION FIX TEST")
    print("="*80)
    print()
    
    # Test 1: Commercial postal code search (M6B)
    print("Test 1: Commercial properties near M6B")
    print("-" * 40)
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "session_id": "early_term_test_1",
                "message": "Commercial properties near M6B"
            },
            timeout=60
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            property_count = data.get('property_count', 0)
            print(f"✅ SUCCESS")
            print(f"   Time: {elapsed:.2f} seconds")
            print(f"   Properties: {property_count}")
            print(f"   Response: {data.get('response', '')[:100]}...")
            
            if elapsed < 30:
                print(f"   ✅ FAST: {elapsed:.2f}s < 30s target")
            else:
                print(f"   ⚠️ SLOW: {elapsed:.2f}s > 30s target")
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")
    
    print()
    
    # Test 2: Car wash properties (original complaint)
    print("Test 2: Car wash properties near Yonge and Bloor")
    print("-" * 40)
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "session_id": "early_term_test_2",
                "message": "Car wash properties near Yonge and Bloor"
            },
            timeout=120  # Allow up to 2 minutes
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            property_count = data.get('property_count', 0)
            print(f"✅ SUCCESS")
            print(f"   Time: {elapsed:.2f} seconds")
            print(f"   Properties: {property_count}")
            print(f"   Response: {data.get('response', '')[:100]}...")
            
            if elapsed < 30:
                print(f"   ✅ FAST: {elapsed:.2f}s < 30s target")
            elif elapsed < 60:
                print(f"   ⚠️ ACCEPTABLE: {elapsed:.2f}s < 60s")
            else:
                print(f"   ❌ SLOW: {elapsed:.2f}s > 60s (still needs optimization)")
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")
    
    print()
    print("="*80)
    print("TEST COMPLETE")
    print("="*80)

if __name__ == "__main__":
    print("\n🔍 Testing early termination fix...\n")
    print("⚠️ NOTE: Server must be running on http://localhost:5050\n")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running\n")
            test_early_termination()
        else:
            print(f"❌ Server responded with status {response.status_code}")
    except requests.exceptions.RequestException:
        print("❌ Server is NOT running. Please start the server first:")
        print("   python -m services.chatbot_api")
