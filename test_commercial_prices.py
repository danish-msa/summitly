import requests

# Fetch sample commercial properties
response = requests.get(
    "https://api.repliers.io/listings",
    headers={"Authorization": "tVbura2ggfQb1yEdnz0lmP8cEAaL7n"},
    params={
        "class": "CommercialProperty",
        "status": "A",
        "city": "Toronto",
        "resultsPerPage": 5
    }
)

props = response.json().get("listings", [])

print(f"\n📊 Found {len(props)} properties\n")

for i, p in enumerate(props[:5], 1):
    print(f"{i}. MLS: {p.get('mlsNumber')}")
    print(f"   Type: {p.get('type')}")
    print(f"   ListPrice: ${p.get('listPrice'):,}" if p.get('listPrice') else "   ListPrice: None")
    
    # Check commercial-specific fields
    commercial = p.get('commercial', {})
    if commercial:
        print(f"   Business Type: {commercial.get('businessType', 'N/A')}")
        print(f"   Lease Price: {commercial.get('leasePrice', 'N/A')}")
        print(f"   Price Per Time: {commercial.get('pricePerTime', 'N/A')}")
    
    print()
