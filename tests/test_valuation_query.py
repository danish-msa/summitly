#!/usr/bin/env python3
"""
Quick test to verify the valuation integration works with your query
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.chatbot_valuation_integration import process_valuation_request

print("=" * 80)
print("TESTING VALUATION INTEGRATION WITH YOUR QUERY")
print("=" * 80)

# Your exact query
user_query = "What's the value of MLS#X12032791"

print(f"\n📝 Query: {user_query}\n")

# Build context
chatbot_context = {
    'user_id': 'test_user',
    'session_id': 'test_session'
}

print("🔄 Processing valuation request...\n")

try:
    # Process the valuation
    response = process_valuation_request(user_query, chatbot_context)
    
    print("=" * 80)
    print("✅ SUCCESS - VALUATION RESPONSE:")
    print("=" * 80)
    print(response)
    print("\n" + "=" * 80)
    
except Exception as e:
    print("=" * 80)
    print("❌ ERROR:")
    print("=" * 80)
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    print("=" * 80)
