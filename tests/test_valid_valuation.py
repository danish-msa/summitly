#!/usr/bin/env python3
"""
Test the valuation with a VALID MLS ID that has complete data
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.chatbot_valuation_integration import process_valuation_request

print("\n" + "=" * 80)
print("TESTING WITH VALID MLS ID (X12506968)")
print("=" * 80)

# Test with ACTIVE listing from Repliers API
user_query = "What's the value of MLS W12580848?"

print(f"\n📝 Query: {user_query}\n")

chatbot_context = {
    'user_id': 'demo_user',
    'session_id': 'demo_session'
}

print("🔄 Processing valuation request (this may take 3-5 seconds)...\n")

try:
    response = process_valuation_request(user_query, chatbot_context)
    
    print("=" * 80)
    print("✅ SUCCESS - FULL VALUATION RESPONSE:")
    print("=" * 80)
    print(response)
    print("\n" + "=" * 80)
    print("This is what your frontend will receive for valid properties! 🎉")
    print("=" * 80)
    
except Exception as e:
    print("=" * 80)
    print("❌ ERROR:")
    print("=" * 80)
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    print("=" * 80)
