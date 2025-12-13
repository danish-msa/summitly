#!/usr/bin/env python3
"""
Check OpenAI API Key and Usage
"""
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('config/.env')

api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    print("❌ OPENAI_API_KEY not found in environment")
    exit(1)

print("=" * 60)
print("🔑 API KEY INFORMATION")
print("=" * 60)
print(f"✅ API Key found: {api_key[:20]}...{api_key[-10:]}")
print(f"   Length: {len(api_key)} characters")
print()

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

print("=" * 60)
print("🔍 TESTING API CONNECTION")
print("=" * 60)

try:
    # Test with correct API call
    print("📤 Sending test request...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Using a real model
        messages=[
            {"role": "user", "content": "Say 'API test successful!'"}
        ],
        max_tokens=10
    )
    
    print("✅ API Connection Successful!")
    print()
    print("📊 RESPONSE DETAILS:")
    print(f"   Model Used: {response.model}")
    print(f"   Response: {response.choices[0].message.content}")
    print(f"   Tokens Used:")
    print(f"     - Prompt: {response.usage.prompt_tokens}")
    print(f"     - Completion: {response.usage.completion_tokens}")
    print(f"     - Total: {response.usage.total_tokens}")
    print()
    
except Exception as e:
    print(f"❌ API Error: {str(e)}")
    print()
    if "429" in str(e):
        print("⚠️  RATE LIMIT EXCEEDED!")
        print("   You've hit your usage limit.")
    elif "401" in str(e):
        print("⚠️  INVALID API KEY!")
        print("   Your API key is not valid or has been revoked.")
    elif "404" in str(e):
        print("⚠️  MODEL NOT FOUND!")
        print("   The model you're trying to use doesn't exist.")
    print()

print("=" * 60)
print("📌 IMPORTANT INFORMATION")
print("=" * 60)
print()
print("❌ GPT-5.1 DOES NOT EXIST")
print("   There is no GPT-5 or GPT-5.1 model from OpenAI")
print()
print("✅ Available Models (December 2025):")
print("   • gpt-4o         - Latest, most capable")
print("   • gpt-4o-mini    - Fast, cost-effective (RECOMMENDED)")
print("   • gpt-4-turbo    - Previous generation")
print("   • gpt-4          - Standard GPT-4")
print("   • gpt-3.5-turbo  - Older, cheapest")
print()
print("🌐 Check Your Usage Dashboard:")
print("   https://platform.openai.com/usage")
print("   https://platform.openai.com/account/billing/overview")
print()
print("📚 Correct API Code Example:")
print('''
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Your prompt here"}
    ]
)

print(response.choices[0].message.content)
''')
print("=" * 60)
