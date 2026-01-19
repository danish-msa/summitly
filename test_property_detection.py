"""
Test property type detection with OpenAI
"""
import sys
sys.path.insert(0, 'app')

from property_type_interpreter import classify_property_type

# Test cases
test_queries = [
    "commercial buildings in toronto",
    "show me bakeries in toronto",
    "2 bedroom condo in toronto",
    "house with 3 bedrooms",
    "office space downtown",
    "retail store for sale",
    "family home with backyard",
    "warehouse in toronto",
]

print("🧪 Testing Property Type Detection (OpenAI-based)\n")
print("=" * 70)

for query in test_queries:
    result = classify_property_type(query)
    
    icon = "🏢" if result["property_type"].value == "commercial" else "🏠"
    print(f"\n{icon} Query: '{query}'")
    print(f"   Type: {result['property_type'].value.upper()}")
    print(f"   Confidence: {result['confidence']:.0%}")
    print(f"   Method: {result['method']}")
    print(f"   Reasoning: {result['reasoning']}")

print("\n" + "=" * 70)
print("✅ All tests completed!")
