"""
Shared Property Utilities
========================
Common functions for property data processing and AI insights.
Extracted to avoid circular imports.
"""

def standardize_property_data(prop):
    """
    Standardize property data format for consistent display.
    
    Args:
        prop: Property dictionary
        
    Returns:
        dict: Standardized property data
    """
    if not prop or not isinstance(prop, dict):
        return {}
    
    # Basic standardization - can be enhanced as needed
    standardized = {
        'MlsNumber': prop.get('MlsNumber', ''),
        'City': prop.get('City', ''),
        'Province': prop.get('Province', ''),
        'PostalCode': prop.get('PostalCode', ''),
        'ListPrice': prop.get('ListPrice', 0),
        'Property': {
            'Address': {
                'AddressText': prop.get('Property', {}).get('Address', {}).get('AddressText', ''),
            },
            'PropertyType': prop.get('Property', {}).get('PropertyType', ''),
            'Type': prop.get('Property', {}).get('Type', ''),
        },
        'Building': {
            'Bedrooms': prop.get('Building', {}).get('Bedrooms', ''),
            'BathroomTotal': prop.get('Building', {}).get('BathroomTotal', ''),
        }
    }
    
    return standardized


def generate_quick_ai_insights(prop, mls_number):
    """
    Generate quick AI insights for a property.
    
    Args:
        prop: Property dictionary
        mls_number: MLS number string
        
    Returns:
        str: AI insights text
    """
    if not prop:
        return "Property details unavailable."
    
    # Basic insights based on property data
    city = prop.get('City', 'Unknown')
    price = prop.get('ListPrice', 0)
    bedrooms = prop.get('Building', {}).get('Bedrooms', 'Unknown')
    bathrooms = prop.get('Building', {}).get('BathroomTotal', 'Unknown')
    
    insights = f"This {bedrooms} bedroom, {bathrooms} bathroom property in {city} is listed at ${price:,} CAD."
    
    if price > 1000000:
        insights += " This is a luxury property in a premium market segment."
    elif price < 500000:
        insights += " This represents good value in the current market."
    else:
        insights += " This is competitively priced for the area."
    
    return insights


# Flag to indicate if full integration is available
REPLIERS_INTEGRATION_AVAILABLE = True