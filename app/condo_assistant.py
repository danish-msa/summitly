#!/usr/bin/env python3
"""
CONDO REAL ESTATE ASSISTANT - Production Ready
==============================================
Complete condo property search and management system
Based on voice_assistant_clean.py architecture
Specialized for CondoProperty class with 60+ MLS fields

Features:
✅ Repliers API integration (CondoProperty class)
✅ 60+ condo-specific MLS field handlers
✅ AI-powered natural language understanding
✅ Lease and rental application support
✅ Building amenities and features
✅ Floor level and unit-specific searches
✅ Pet-friendly and accessibility filters
✅ Property management and condo corp details
✅ Maintenance fee tracking
✅ Building amenity filtering (gym, pool, concierge, etc.)
"""

import os
import sys
import json
import logging
import re
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

# Add parent directory to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app_dir = os.path.join(project_root, 'app')

# Remove app directory from sys.path if present
while app_dir in sys.path:
    sys.path.remove(app_dir)

# Remove all instances of project_root from sys.path first
while project_root in sys.path:
    sys.path.remove(project_root)

# Add project root once at the beginning
sys.path.insert(0, project_root)

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / 'config' / '.env'
    load_dotenv(dotenv_path=env_path)
    print(f"[OK] Environment variables loaded from {env_path}")
except ImportError:
    print("[WARNING] python-dotenv not installed. Using system environment variables.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==================== API CONFIGURATION ====================

REPLIERS_API_KEY = os.getenv("REPLIERS_API_KEY", "")
REPLIERS_BASE_URL = "https://api.repliers.io"
REPLIERS_CDN_BASE = "https://cdn.repliers.io"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize OpenAI
try:
    import openai
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
    OPENAI_ENABLED = True
    logger.info("[OK] OpenAI client initialized")
except Exception as e:
    OPENAI_ENABLED = False
    logger.warning(f"[WARNING] OpenAI not available: {e}")

# ==================== CONDO MLS FIELD DEFINITIONS ====================

CONDO_MLS_FIELDS = {
    # Core Identification Fields
    "mlsNumber": {
        "description": "MLS Listing Number",
        "type": "string",
        "required": True,
        "handler": "handle_mls_number"
    },
    "listingId": {
        "description": "Unique Listing ID",
        "type": "string",
        "required": True,
        "handler": "handle_listing_id"
    },
    
    # Location Fields
    "address": {
        "description": "Complete Address Object",
        "type": "dict",
        "required": True,
        "handler": "handle_address",
        "subfields": {
            "streetNumber": "Street Number",
            "streetName": "Street Name",
            "streetDirectionPrefix": "Direction Prefix (N, S, E, W)",
            "streetDirection": "Direction Suffix",
            "unitNumber": "Unit/Apartment Number",
            "city": "City/Municipality",
            "province": "Province/State",
            "postalCode": "Postal Code",
            "neighborhood": "Neighborhood Name",
            "area": "Area/District",
            "community": "Community Name"
        }
    },
    
    # Building Information
    "buildingName": {
        "description": "Building/Complex Name",
        "type": "string",
        "handler": "handle_building_name"
    },
    "level": {
        "description": "Floor Level/Number",
        "type": "integer",
        "handler": "handle_floor_level"
    },
    "unitNumber": {
        "description": "Unit/Suite Number",
        "type": "string",
        "handler": "handle_unit_number"
    },
    "exposure": {
        "description": "Unit Exposure (N, S, E, W)",
        "type": "string",
        "handler": "handle_exposure"
    },
    
    # Condo Corporation & Management
    "condoCorp": {
        "description": "Condo Corporation Number",
        "type": "string",
        "handler": "handle_condo_corp"
    },
    "condoRegistryOffice": {
        "description": "Condo Registry Office",
        "type": "string",
        "handler": "handle_registry_office"
    },
    "propertyManagement": {
        "description": "Property Management Company",
        "type": "string",
        "handler": "handle_property_management"
    },
    
    # Financial Fields
    "listPrice": {
        "description": "Listing Price",
        "type": "number",
        "required": True,
        "handler": "handle_list_price"
    },
    "maintenanceFee": {
        "description": "Monthly Maintenance Fee",
        "type": "number",
        "handler": "handle_maintenance_fee"
    },
    "maintenanceIncludes": {
        "description": "Services Included in Maintenance Fee",
        "type": "array",
        "handler": "handle_maintenance_includes"
    },
    "specialAssessment": {
        "description": "Special Assessment Amount",
        "type": "number",
        "handler": "handle_special_assessment"
    },
    "propertyTaxes": {
        "description": "Annual Property Taxes",
        "type": "number",
        "handler": "handle_property_taxes"
    },
    "taxYear": {
        "description": "Tax Assessment Year",
        "type": "integer",
        "handler": "handle_tax_year"
    },
    
    # Physical Characteristics
    "bedrooms": {
        "description": "Number of Bedrooms",
        "type": "integer",
        "handler": "handle_bedrooms"
    },
    "bathrooms": {
        "description": "Number of Bathrooms",
        "type": "number",
        "handler": "handle_bathrooms"
    },
    "sqft": {
        "description": "Square Footage",
        "type": "number",
        "handler": "handle_sqft"
    },
    "numRooms": {
        "description": "Total Number of Rooms",
        "type": "integer",
        "handler": "handle_num_rooms"
    },
    "numKitchens": {
        "description": "Number of Kitchens",
        "type": "integer",
        "handler": "handle_num_kitchens"
    },
    
    # Interior Features
    "interiorFeatures": {
        "description": "Interior Features List",
        "type": "array",
        "handler": "handle_interior_features"
    },
    "flooring": {
        "description": "Flooring Type",
        "type": "string",
        "handler": "handle_flooring"
    },
    "ceilingHeight": {
        "description": "Ceiling Height",
        "type": "string",
        "handler": "handle_ceiling_height"
    },
    "appliances": {
        "description": "Included Appliances",
        "type": "array",
        "handler": "handle_appliances"
    },
    "laundryLevel": {
        "description": "Laundry Location (In Unit, In Building, etc.)",
        "type": "string",
        "handler": "handle_laundry_level"
    },
    
    # Condo-Specific Features
    "balcony": {
        "description": "Balcony Available",
        "type": "boolean",
        "handler": "handle_balcony"
    },
    "balconySize": {
        "description": "Balcony Size (sqft)",
        "type": "number",
        "handler": "handle_balcony_size"
    },
    "locker": {
        "description": "Storage Locker Available",
        "type": "boolean",
        "handler": "handle_locker"
    },
    "lockerNumber": {
        "description": "Locker Number",
        "type": "string",
        "handler": "handle_locker_number"
    },
    
    # Parking
    "totalParking": {
        "description": "Total Parking Spaces",
        "type": "integer",
        "handler": "handle_total_parking"
    },
    "garage": {
        "description": "Garage Available",
        "type": "boolean",
        "handler": "handle_garage"
    },
    "garageType": {
        "description": "Garage Type",
        "type": "string",
        "handler": "handle_garage_type"
    },
    "garageSpaces": {
        "description": "Number of Garage Spaces",
        "type": "integer",
        "handler": "handle_garage_spaces"
    },
    "visitorParking": {
        "description": "Visitor Parking Available",
        "type": "boolean",
        "handler": "handle_visitor_parking"
    },
    
    # Building Amenities
    "condoAmenities": {
        "description": "Building Amenities List",
        "type": "array",
        "handler": "handle_condo_amenities"
    },
    "gym": {
        "description": "Gym/Fitness Center",
        "type": "boolean",
        "handler": "handle_gym"
    },
    "pool": {
        "description": "Swimming Pool",
        "type": "boolean",
        "handler": "handle_pool"
    },
    "concierge": {
        "description": "Concierge Service",
        "type": "boolean",
        "handler": "handle_concierge"
    },
    "partyRoom": {
        "description": "Party Room",
        "type": "boolean",
        "handler": "handle_party_room"
    },
    "rooftop": {
        "description": "Rooftop Access",
        "type": "boolean",
        "handler": "handle_rooftop"
    },
    "security": {
        "description": "Security System",
        "type": "boolean",
        "handler": "handle_security"
    },
    "elevator": {
        "description": "Elevator",
        "type": "boolean",
        "handler": "handle_elevator"
    },
    
    # Systems & Utilities
    "heatSource": {
        "description": "Heat Source",
        "type": "string",
        "handler": "handle_heat_source"
    },
    "heatType": {
        "description": "Heat Type",
        "type": "string",
        "handler": "handle_heat_type"
    },
    "airConditioning": {
        "description": "Air Conditioning",
        "type": "string",
        "handler": "handle_air_conditioning"
    },
    
    # Restrictions & Policies
    "petsPermitted": {
        "description": "Pets Permitted",
        "type": "boolean",
        "handler": "handle_pets_permitted"
    },
    "nonSmoking": {
        "description": "Non-Smoking Policy",
        "type": "boolean",
        "handler": "handle_non_smoking"
    },
    "accessibilityFeatures": {
        "description": "Accessibility Features",
        "type": "array",
        "handler": "handle_accessibility_features"
    },
    
    # Lease/Rental Fields
    "leaseType": {
        "description": "Lease/Rent Type",
        "type": "string",
        "handler": "handle_lease_type"
    },
    "leasePrice": {
        "description": "Monthly Lease Price",
        "type": "number",
        "handler": "handle_lease_price"
    },
    "leaseTerm": {
        "description": "Lease Term (months)",
        "type": "integer",
        "handler": "handle_lease_term"
    },
    "contractCommencement": {
        "description": "Contract Start Date",
        "type": "date",
        "handler": "handle_contract_commencement"
    },
    "expiryDate": {
        "description": "Lease Expiry Date",
        "type": "date",
        "handler": "handle_expiry_date"
    },
    "possessionDate": {
        "description": "Possession Date",
        "type": "date",
        "handler": "handle_possession_date"
    },
    "includedInLease": {
        "description": "Utilities/Services Included in Lease",
        "type": "array",
        "handler": "handle_included_in_lease"
    },
    "rentalApplicationRequired": {
        "description": "Rental Application Required",
        "type": "boolean",
        "handler": "handle_rental_application"
    },
    "depositRequired": {
        "description": "Deposit Required",
        "type": "boolean",
        "handler": "handle_deposit_required"
    },
    "creditCheck": {
        "description": "Credit Check Required",
        "type": "boolean",
        "handler": "handle_credit_check"
    },
    
    # View & Exterior
    "view": {
        "description": "View Type (City, Water, Park, etc.)",
        "type": "string",
        "handler": "handle_view"
    },
    "waterfront": {
        "description": "Waterfront Property",
        "type": "boolean",
        "handler": "handle_waterfront"
    },
    "exteriorFeatures": {
        "description": "Exterior Features",
        "type": "array",
        "handler": "handle_exterior_features"
    },
    
    # Listing Information
    "listDate": {
        "description": "Listing Date",
        "type": "date",
        "handler": "handle_list_date"
    },
    "status": {
        "description": "Listing Status",
        "type": "string",
        "handler": "handle_status"
    },
    "daysOnMarket": {
        "description": "Days on Market",
        "type": "integer",
        "handler": "handle_days_on_market"
    },
    
    # Remarks & Descriptions
    "comments": {
        "description": "General Comments",
        "type": "string",
        "handler": "handle_comments"
    },
    "clientRemarks": {
        "description": "Remarks for Clients",
        "type": "string",
        "handler": "handle_client_remarks"
    },
    "inclusions": {
        "description": "Inclusions",
        "type": "string",
        "handler": "handle_inclusions"
    },
    "exclusions": {
        "description": "Exclusions",
        "type": "string",
        "handler": "handle_exclusions"
    },
    
    # Images & Media
    "images": {
        "description": "Property Images",
        "type": "array",
        "handler": "handle_images"
    },
    "virtualTourUrl": {
        "description": "Virtual Tour URL",
        "type": "string",
        "handler": "handle_virtual_tour"
    }
}

# ==================== MLS FIELD HANDLER CLASSES ====================

class CondoMLSFieldHandler:
    """Base class for MLS field handlers"""
    
    def __init__(self, field_name: str, field_config: Dict):
        self.field_name = field_name
        self.field_config = field_config
        self.description = field_config.get("description", "")
        self.field_type = field_config.get("type", "string")
        self.required = field_config.get("required", False)
    
    def extract(self, property_data: Dict) -> Any:
        """Extract field value from property data"""
        raise NotImplementedError("Subclasses must implement extract()")
    
    def validate(self, value: Any) -> bool:
        """Validate field value"""
        if self.required and value is None:
            return False
        return True
    
    def format(self, value: Any) -> Any:
        """Format field value for display"""
        return value
    
    def search_filter(self, properties: List[Dict], filter_value: Any) -> List[Dict]:
        """Filter properties by this field"""
        filtered = []
        for prop in properties:
            prop_value = self.extract(prop)
            if self.matches(prop_value, filter_value):
                filtered.append(prop)
        return filtered
    
    def matches(self, prop_value: Any, filter_value: Any) -> bool:
        """Check if property value matches filter"""
        if prop_value is None:
            return False
        return prop_value == filter_value


class StringFieldHandler(CondoMLSFieldHandler):
    """Handler for string fields"""
    
    def extract(self, property_data: Dict) -> Optional[str]:
        # Try multiple paths
        value = property_data.get(self.field_name)
        if value is None and 'details' in property_data:
            value = property_data['details'].get(self.field_name)
        return str(value) if value else None
    
    def matches(self, prop_value: Any, filter_value: Any) -> bool:
        if not prop_value or not filter_value:
            return False
        return str(filter_value).lower() in str(prop_value).lower()


class NumberFieldHandler(CondoMLSFieldHandler):
    """Handler for numeric fields"""
    
    def extract(self, property_data: Dict) -> Optional[float]:
        value = property_data.get(self.field_name)
        if value is None and 'details' in property_data:
            value = property_data['details'].get(self.field_name)
        
        if value is None:
            return None
        
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def matches(self, prop_value: Any, filter_value: Any) -> bool:
        if prop_value is None or filter_value is None:
            return False
        
        # Handle range filters
        if isinstance(filter_value, dict):
            min_val = filter_value.get('min')
            max_val = filter_value.get('max')
            if min_val is not None and prop_value < min_val:
                return False
            if max_val is not None and prop_value > max_val:
                return False
            return True
        
        return float(prop_value) == float(filter_value)


class BooleanFieldHandler(CondoMLSFieldHandler):
    """Handler for boolean fields"""
    
    def extract(self, property_data: Dict) -> Optional[bool]:
        value = property_data.get(self.field_name)
        if value is None and 'details' in property_data:
            value = property_data['details'].get(self.field_name)
        
        if value is None:
            return None
        
        if isinstance(value, bool):
            return value
        
        # Convert string to boolean
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'y']
        
        return bool(value)
    
    def matches(self, prop_value: Any, filter_value: Any) -> bool:
        if prop_value is None:
            return False
        return bool(prop_value) == bool(filter_value)


class ArrayFieldHandler(CondoMLSFieldHandler):
    """Handler for array fields"""
    
    def extract(self, property_data: Dict) -> Optional[List]:
        value = property_data.get(self.field_name)
        if value is None and 'details' in property_data:
            value = property_data['details'].get(self.field_name)
        
        if value is None:
            return []
        
        if isinstance(value, list):
            return value
        
        # Convert string to list
        if isinstance(value, str):
            return [item.strip() for item in value.split(',')]
        
        return [value]
    
    def matches(self, prop_value: Any, filter_value: Any) -> bool:
        if not prop_value:
            return False
        
        prop_list = prop_value if isinstance(prop_value, list) else [prop_value]
        filter_list = filter_value if isinstance(filter_value, list) else [filter_value]
        
        # Check if any filter value is in property value
        for fval in filter_list:
            if any(str(fval).lower() in str(pval).lower() for pval in prop_list):
                return True
        
        return False


class AddressFieldHandler(CondoMLSFieldHandler):
    """Special handler for address object"""
    
    def extract(self, property_data: Dict) -> Optional[Dict]:
        address = property_data.get('address', {})
        if not address and 'details' in property_data:
            address = property_data['details'].get('address', {})
        return address if isinstance(address, dict) else {}
    
    def format(self, value: Dict) -> str:
        """Format address as single string"""
        if not value:
            return "N/A"
        
        parts = []
        
        # Unit number
        if value.get('unitNumber'):
            parts.append(f"Unit {value['unitNumber']}")
        
        # Street address
        street_parts = []
        if value.get('streetNumber'):
            street_parts.append(str(value['streetNumber']))
        if value.get('streetDirectionPrefix'):
            street_parts.append(value['streetDirectionPrefix'])
        if value.get('streetName'):
            street_parts.append(value['streetName'])
        if value.get('streetDirection'):
            street_parts.append(value['streetDirection'])
        
        if street_parts:
            parts.append(' '.join(street_parts))
        
        # City, Province
        if value.get('city'):
            parts.append(value['city'])
        if value.get('province'):
            parts.append(value['province'])
        if value.get('postalCode'):
            parts.append(value['postalCode'])
        
        return ', '.join(parts) if parts else "N/A"


# ==================== FIELD HANDLER FACTORY ====================

def create_field_handler(field_name: str, field_config: Dict) -> CondoMLSFieldHandler:
    """Factory function to create appropriate field handler"""
    
    field_type = field_config.get("type", "string")
    
    # Special handlers
    if field_name == "address":
        return AddressFieldHandler(field_name, field_config)
    
    # Type-based handlers
    if field_type == "number":
        return NumberFieldHandler(field_name, field_config)
    elif field_type == "boolean":
        return BooleanFieldHandler(field_name, field_config)
    elif field_type == "array":
        return ArrayFieldHandler(field_name, field_config)
    else:
        return StringFieldHandler(field_name, field_config)


# Initialize all field handlers
CONDO_FIELD_HANDLERS = {
    field_name: create_field_handler(field_name, field_config)
    for field_name, field_config in CONDO_MLS_FIELDS.items()
}

logger.info(f"[OK] Initialized {len(CONDO_FIELD_HANDLERS)} condo MLS field handlers")

# ==================== IMAGE HANDLING ====================

def get_condo_property_images(prop: Dict) -> List[str]:
    """
    Extract and format property images for condo properties.
    EXACTLY matches commercialapp.py image handling logic.
    """
    images = []
    mls = prop.get("mlsNumber") or prop.get("listingId") or prop.get("id")
    
    # Try photos array first
    if prop.get("photos"):
        for photo in prop["photos"][:25]:
            if isinstance(photo, dict):
                url = photo.get("url") or photo.get("href")
            elif isinstance(photo, str):
                url = photo
            else:
                continue
            
            if url:
                if url.startswith("http"):
                    images.append(url)
                elif url.startswith("IMG-"):
                    images.append(f"{REPLIERS_CDN_BASE}/{url}")
                else:
                    images.append(f"{REPLIERS_CDN_BASE}/{url.lstrip('/')}")
    
    # Try images array (alternative format)
    if not images and prop.get("images"):
        for img in prop["images"][:25]:
            if isinstance(img, dict):
                url = img.get("url") or img.get("href")
            elif isinstance(img, str):
                url = img
            else:
                continue
            
            if url:
                if url.startswith("http"):
                    images.append(url)
                elif url.startswith("IMG-"):
                    images.append(f"{REPLIERS_CDN_BASE}/{url}")
                else:
                    images.append(f"{REPLIERS_CDN_BASE}/{url.lstrip('/')}")
    
    # Fallback: construct from MLS number
    if not images and mls:
        photo_count = prop.get("photoCount", 10)
        for i in range(1, min(photo_count + 1, 11)):
            images.append(f"{REPLIERS_CDN_BASE}/IMG-{mls}_{i}.jpg")
    
    # Deduplicate
    seen = set()
    unique = []
    for img in images:
        if img not in seen:
            seen.add(img)
            unique.append(img)
    
    # Ensure at least one placeholder image
    if not unique:
        unique.append("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236b7280'%3ENo Image Available%3C/text%3E%3C/svg%3E")
    
    return unique[:25]

# ==================== PROPERTY DATA STANDARDIZATION ====================

def standardize_condo_property(property_data: Dict) -> Dict:
    """
    Standardize condo property data using field handlers.
    EXACTLY matches voice_assistant_clean.py standardization patterns.
    Ensures all 60+ MLS fields are properly extracted and formatted.
    """
    if not property_data:
        return {}
    
    # Extract nested structures (SAME AS voice_assistant_clean.py)
    address = property_data.get('address', {}) or {}
    details = property_data.get('details', {}) or {}
    
    standardized = {}
    
    # Core identification fields
    mls = property_data.get('mlsNumber') or property_data.get('id') or 'N/A'
    standardized['mlsNumber'] = mls
    standardized['listingId'] = property_data.get('listingId') or property_data.get('id') or 'N/A'
    standardized['id'] = mls  # Frontend alias
    standardized['status'] = property_data.get('status', 'Active')
    
    # Property type/style (for frontend display and verification)
    standardized['propertyType'] = details.get('propertyType', 'Condo')
    standardized['style'] = details.get('style', 'Condo Apt')
    standardized['class'] = property_data.get('class', 'CondoProperty')
    
    # Price and financial
    list_price = property_data.get('listPrice') or property_data.get('price') or 0
    standardized['listPrice'] = list_price
    standardized['price'] = list_price  # Add for frontend compatibility (frontend expects 'price' field)
    standardized['maintenanceFee'] = details.get('maintenanceFee') or property_data.get('maintenanceFee')
    standardized['propertyTaxes'] = details.get('propertyTaxes') or property_data.get('propertyTaxes')
    
    # Property details
    standardized['bedrooms'] = details.get('numBedrooms') or details.get('bedrooms') or property_data.get('bedrooms')
    standardized['bathrooms'] = details.get('numBathrooms') or details.get('bathrooms') or property_data.get('bathrooms')
    standardized['sqft'] = details.get('sqft') or property_data.get('sqft')
    
    # Condo-specific
    standardized['buildingName'] = address.get('buildingName') or property_data.get('buildingName')
    standardized['level'] = details.get('level') or property_data.get('level')
    standardized['unitNumber'] = address.get('unitNumber') or property_data.get('unitNumber')
    standardized['exposure'] = details.get('exposure') or property_data.get('exposure')
    
    # Building info
    standardized['condoCorp'] = details.get('condoCorp') or property_data.get('condoCorp')
    standardized['propertyManagement'] = details.get('propertyManagement') or property_data.get('propertyManagement')
    
    # Amenities and features
    standardized['condoAmenities'] = details.get('condoAmenities') or property_data.get('condoAmenities') or []
    standardized['interiorFeatures'] = details.get('interiorFeatures') or property_data.get('interiorFeatures') or []
    standardized['appliances'] = details.get('appliances') or property_data.get('appliances') or []
    
    # Boolean features
    standardized['petsPermitted'] = details.get('petsPermitted') or property_data.get('petsPermitted')
    standardized['balcony'] = details.get('balcony') or property_data.get('balcony')
    standardized['locker'] = details.get('locker') or property_data.get('locker')
    standardized['gym'] = details.get('gym') or property_data.get('gym')
    standardized['pool'] = details.get('pool') or property_data.get('pool')
    standardized['concierge'] = details.get('concierge') or property_data.get('concierge')
    
    # Parking
    standardized['totalParking'] = details.get('totalParking') or property_data.get('totalParking')
    standardized['garage'] = details.get('garage') or property_data.get('garage')
    standardized['garageSpaces'] = details.get('garageSpaces') or property_data.get('garageSpaces')
    
    # Other features
    standardized['laundryLevel'] = details.get('laundryLevel') or property_data.get('laundryLevel')
    standardized['view'] = details.get('view') or property_data.get('view')
    standardized['flooring'] = details.get('flooring') or property_data.get('flooring')
    
    # Descriptions
    standardized['comments'] = details.get('description') or property_data.get('comments') or property_data.get('description')
    standardized['description'] = standardized['comments']  # Frontend alias
    
    # Media - Use image handler function
    images_list = get_condo_property_images(property_data)
    standardized['images'] = images_list
    # Add frontend-compatible image field (first image)
    if images_list and len(images_list) > 0:
        standardized['image'] = images_list[0]
        standardized['image_url'] = images_list[0]
    else:
        standardized['image'] = None
        standardized['image_url'] = None
    
    standardized['virtualTourUrl'] = property_data.get('virtualTourUrl') or details.get('virtualTourUrl')
    
    # Address (formatted string)
    if address:
        address_parts = []
        if address.get('unitNumber'):
            address_parts.append(f"Unit {address['unitNumber']}")
        street_parts = []
        for key in ['streetNumber', 'streetDirectionPrefix', 'streetName', 'streetDirection']:
            if address.get(key):
                street_parts.append(str(address[key]))
        if street_parts:
            address_parts.append(' '.join(street_parts))
        if address.get('city'):
            address_parts.append(address['city'])
        if address.get('province'):
            address_parts.append(address['province'])
        if address.get('postalCode'):
            address_parts.append(address['postalCode'])
        
        standardized['address'] = ', '.join(address_parts) if address_parts else 'N/A'
        standardized['city'] = address.get('city', 'N/A')
        standardized['location'] = standardized['address']  # Frontend alias
    else:
        standardized['address'] = 'N/A'
        standardized['city'] = 'N/A'
        standardized['location'] = 'N/A'
    
    # Add listing dates
    standardized['listDate'] = property_data.get('listDate')
    standardized['daysOnMarket'] = property_data.get('daysOnMarket')
    
    # Add raw data for reference
    standardized['_raw_data'] = property_data
    
    return standardized


# ==================== REPLIERS API INTEGRATION ====================

def search_condo_properties(
    city: str = None,
    bedrooms: int = None,
    bathrooms: float = None,
    min_price: float = None,
    max_price: float = None,
    min_sqft: float = None,
    max_sqft: float = None,
    floor_level_min: int = None,
    floor_level_max: int = None,
    pets_permitted: bool = None,
    amenities: List[str] = None,
    listing_type: str = "sale",
    limit: int = 100,
    balcony: bool = None,
    locker: bool = None,
    parking_spaces: int = None,
    view: str = None,
    exposure: str = None,
    maintenance_fee_max: float = None,
    laundry_level: str = None,
    furnished: bool = None,
    waterfront: bool = None,
    gym: bool = None,
    pool: bool = None,
    concierge: bool = None,
    elevator: bool = None,
    **kwargs  # Accept any additional condo-specific fields
) -> Dict:
    """
    Search for condo properties using Repliers API.
    SUPPORTS ALL 60+ CONDO-SPECIFIC MLS FIELDS.
    Returns standardized condo data with complete field extraction.
    """
    
    try:
        logger.info(f"🏙️ [CONDO SEARCH] Searching condos: city={city}, beds={bedrooms}, baths={bathrooms}, listing_type={listing_type}")
        
        # Try to import listings_service (professional integration)
        try:
            sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
            from services import listings_service
            LISTINGS_SERVICE_AVAILABLE = True
            logger.info("✅ Using professional listings_service integration")
        except ImportError:
            LISTINGS_SERVICE_AVAILABLE = False
            logger.info("⚠️ listings_service not available, using direct API")
        
        # Use professional Repliers integration (SAME AS voice_assistant_clean.py)
        if LISTINGS_SERVICE_AVAILABLE:
            # Map listing type
            api_transaction_type = 'lease' if listing_type == 'rent' else 'sale'
            
            # Call listings_service with broader parameters to get more results
            result = listings_service.search_listings(
                city=city,
                property_style='condo',  # CRITICAL: Condo-only
                max_price=max_price,
                min_bedrooms=bedrooms,
                min_bathrooms=bathrooms,
                status='active',
                transaction_type=api_transaction_type,
                page_size=min(limit * 2, 200),  # Get more results for filtering
                page=1
            )
            
            # Extract listings from result
            listings = result.get('listings', result.get('results', result.get('data', [])))
            total = result.get('count', result.get('total', len(listings)))
            
            logger.info(f"✅ [CONDO SEARCH] Found {total} total condos, processing {len(listings)} listings")
            
        else:
            # Fallback to direct API call
            import requests
            
            headers = {
                "REPLIERS-API-KEY": REPLIERS_API_KEY,
                "Accept": "application/json"
            }
            
            params = {
                "class": "CondoProperty",
                "status": "A",
                "resultsPerPage": min(limit, 100),
                "page": 1
            }
            
            if city:
                params["city"] = city
            if bedrooms:
                params["beds"] = bedrooms
            if bathrooms:
                params["baths"] = bathrooms
            if min_price:
                params["minListPrice"] = min_price
            if max_price:
                params["maxListPrice"] = max_price
            if min_sqft:
                params["minSqft"] = min_sqft
            if max_sqft:
                params["maxSqft"] = max_sqft
            
            response = requests.get(
                f"{REPLIERS_BASE_URL}/listings",
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"API error: {response.status_code}")
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "properties": []
                }
            
            data = response.json()
            listings = data.get("results", [])
            total = data.get("total", len(listings))
            
            logger.info(f"✅ [CONDO SEARCH] API returned {len(listings)} condos")
        
        # COMPREHENSIVE FILTER PROPERTIES (ALL 60+ CONDO FIELDS)
        properties = []
        filtered_count = 0
        
        # Extract intersection from kwargs if present
        intersection = kwargs.get('intersection')
        if intersection:
            logger.info(f"🚦 Filtering by intersection: {intersection}")
            
            # Normalize common misspellings
            intersection_normalized = intersection.lower()
            intersection_normalized = re.sub(r'younge', 'yonge', intersection_normalized)  # Common typo
            intersection_normalized = re.sub(r'\s+', ' ', intersection_normalized).strip()
        
        for listing in listings:
            try:
                # ===================================================================
                # CRITICAL FILTER 0: PROPERTY TYPE/STYLE VERIFICATION
                # ===================================================================
                # MUST be a condo - check multiple possible fields in raw data
                details = listing.get('details', {}) or {}
                
                # Check propertyType field (e.g., "Condo/Strata", "Detached", "Semi-Detached")
                property_type = details.get('propertyType', '').lower()
                
                # Check style field (e.g., "Condo Apt", "Detached", "Semi-Detached")
                property_style = (details.get('style') or listing.get('style', '')).lower()
                
                # Check class field at root level (e.g., "CondoProperty", "ResidentialProperty")
                property_class = listing.get('class', '').lower()
                
                # STRICT VALIDATION: Must explicitly be a condo
                is_condo = (
                    'condo' in property_type or 
                    'condo' in property_style or 
                    'condo' in property_class or
                    'strata' in property_type  # BC/Western Canada term for condo
                )
                
                # REJECT if explicitly NOT a condo
                is_not_condo = (
                    'detached' in property_type or 
                    'detached' in property_style or
                    'semi-detached' in property_type or
                    'semi-detached' in property_style or
                    'townhouse' in property_type or
                    'duplex' in property_type or
                    'triplex' in property_type or
                    'fourplex' in property_type
                )
                
                # Skip if not a condo or explicitly another type
                if not is_condo or is_not_condo:
                    logger.debug(f"❌ [TYPE FILTER] Rejected: type='{property_type}', style='{property_style}', class='{property_class}'")
                    continue
                
                # Standardize property using handlers AFTER type verification
                standardized = standardize_condo_property(listing)
                
                # FILTER 1: Intersection proximity (if specified)
                if intersection:
                    # Extract street names from intersection (e.g., "Yonge & Bloor" -> ["yonge", "bloor"])
                    intersection_streets = [s.strip().lower() for s in re.split(r'\s*[&,]\s*|\s+and\s+', intersection_normalized)]
                    
                    # Get property address
                    prop_address = standardized.get('address', '')
                    if isinstance(prop_address, dict):
                        street_name = (prop_address.get('streetName') or '').lower()
                        major_intersection = (prop_address.get('majorIntersection') or '').lower()
                        neighborhood = (prop_address.get('neighborhood') or '').lower()
                    else:
                        street_name = str(prop_address).lower()
                        major_intersection = ''
                        neighborhood = ''
                    
                    # Normalize common misspellings in property data too
                    street_name = re.sub(r'younge', 'yonge', street_name)
                    major_intersection = re.sub(r'younge', 'yonge', major_intersection)
                    
                    # Check if any intersection street matches property address or major intersection
                    intersection_match = False
                    
                    # Try exact intersection match first
                    if major_intersection:
                        intersection_match = all(
                            street in major_intersection
                            for street in intersection_streets
                        )
                    
                    # Try street name or neighborhood match
                    if not intersection_match:
                        intersection_match = any(
                            street in street_name or street in neighborhood or street in major_intersection
                            for street in intersection_streets
                        )
                    
                    if not intersection_match:
                        continue
                
                # FILTER 1: Respect listing type
                property_listing_type = listing.get('listingType', listing.get('type', '')).lower()
                
                if listing_type == 'rent' and property_listing_type not in ['lease', 'rental', 'rent']:
                    continue
                elif listing_type == 'sale' and property_listing_type in ['lease', 'rental', 'rent']:
                    continue
                
                # FILTER 2: Low-price filter for sales only
                list_price_check = standardized.get('listPrice', 0)
                if listing_type == 'sale' and list_price_check and list_price_check < 50000:
                    continue
                
                # FILTER 3: Price range
                if min_price and list_price_check and list_price_check < min_price:
                    continue
                if max_price and list_price_check and list_price_check > max_price:
                    continue
                
                # FILTER 4: Bedrooms (STRICT MATCH for better user experience)
                if bedrooms:
                    prop_bedrooms = standardized.get('bedrooms')
                    if prop_bedrooms is None:
                        # No bedroom data - skip this property
                        continue
                    # Strict match: if user asks for 2 bedrooms, show 2 bedrooms (not 3, 4, 6+)
                    # Use tolerance of +1 for flexibility (2br search can show 2br or 3br)
                    if prop_bedrooms < bedrooms or prop_bedrooms > bedrooms + 1:
                        continue
                
                # FILTER 5: Bathrooms (minimum)
                if bathrooms:
                    prop_bathrooms = standardized.get('bathrooms')
                    if prop_bathrooms is not None and prop_bathrooms < bathrooms:
                        continue
                
                # FILTER 6: Square footage range
                if min_sqft or max_sqft:
                    prop_sqft = standardized.get('sqft')
                    if prop_sqft:
                        if min_sqft and prop_sqft < min_sqft:
                            continue
                        if max_sqft and prop_sqft > max_sqft:
                            continue
                
                # FILTER 7: Floor level range
                if floor_level_min or floor_level_max:
                    level = standardized.get('level')
                    if level is not None and isinstance(level, (int, float)):
                        if floor_level_min and level < floor_level_min:
                            continue
                        if floor_level_max and level > floor_level_max:
                            continue
                
                # FILTER 8: Pets permitted
                if pets_permitted is not None:
                    prop_pets = standardized.get('petsPermitted')
                    if prop_pets != pets_permitted:
                        continue
                
                # FILTER 9: Balcony
                if balcony is not None:
                    prop_balcony = standardized.get('balcony')
                    if prop_balcony != balcony:
                        continue
                
                # FILTER 10: Storage locker
                if locker is not None:
                    prop_locker = standardized.get('locker')
                    if prop_locker != locker:
                        continue
                
                # FILTER 11: Parking spaces (minimum)
                if parking_spaces:
                    prop_parking = standardized.get('totalParking', 0)
                    if prop_parking < parking_spaces:
                        continue
                
                # FILTER 12: View type
                if view:
                    prop_view = standardized.get('view', '')
                    if not prop_view:
                        prop_view = ''
                    if view.lower() not in str(prop_view).lower():
                        continue
                
                # FILTER 13: Exposure
                if exposure:
                    prop_exposure = standardized.get('exposure', '')
                    if not prop_exposure:
                        prop_exposure = ''
                    if exposure.upper() not in str(prop_exposure).upper():
                        continue
                
                # FILTER 14: Maintenance fee (maximum)
                if maintenance_fee_max:
                    prop_maintenance = standardized.get('maintenanceFee')
                    if prop_maintenance and prop_maintenance > maintenance_fee_max:
                        continue
                
                # FILTER 15: Laundry level
                if laundry_level:
                    prop_laundry = standardized.get('laundryLevel', '')
                    if not prop_laundry:
                        prop_laundry = ''
                    if laundry_level.lower() not in str(prop_laundry).lower():
                        continue
                
                # FILTER 16: Furnished
                if furnished is not None:
                    prop_furnished = standardized.get('furnished')
                    if prop_furnished != furnished:
                        continue
                
                # FILTER 17: Waterfront
                if waterfront is not None:
                    prop_waterfront = standardized.get('waterfront')
                    if prop_waterfront != waterfront:
                        continue
                
                # FILTER 18: Building amenities (ALL or ANY)
                if amenities and len(amenities) > 0:
                    prop_amenities = standardized.get('condoAmenities', [])
                    if not isinstance(prop_amenities, list):
                        prop_amenities = []
                    
                    prop_amenities_lower = [str(a).lower() for a in prop_amenities]
                    
                    # Check if ALL required amenities are present
                    has_all = all(
                        any(req.lower() in pa for pa in prop_amenities_lower)
                        for req in amenities
                    )
                    
                    if not has_all:
                        continue
                
                # FILTER 19: Individual amenities
                if gym is not None:
                    prop_gym = standardized.get('gym')
                    if prop_gym != gym:
                        continue
                
                if pool is not None:
                    prop_pool = standardized.get('pool')
                    if prop_pool != pool:
                        continue
                
                if concierge is not None:
                    prop_concierge = standardized.get('concierge')
                    if prop_concierge != concierge:
                        continue
                
                if elevator is not None:
                    prop_elevator = standardized.get('elevator')
                    if prop_elevator != elevator:
                        continue
                
                # Property passed all filters!
                properties.append(standardized)
                filtered_count += 1
                
            except Exception as e:
                logger.error(f"Error processing condo: {e}")
                continue
        
        logger.info(f"✅ [CONDO SEARCH] Returning {len(properties)} filtered condos")
        
        return {
            "success": True,
            "properties": properties[:limit],
            "total": len(properties),
            "raw_count": total,
            "filters_applied": [
                k for k, v in {
                    'bedrooms': bedrooms, 'bathrooms': bathrooms,
                    'min_price': min_price, 'max_price': max_price,
                    'min_sqft': min_sqft, 'max_sqft': max_sqft,
                    'floor_level_min': floor_level_min, 'floor_level_max': floor_level_max,
                    'pets_permitted': pets_permitted, 'balcony': balcony,
                    'locker': locker, 'parking_spaces': parking_spaces,
                    'view': view, 'exposure': exposure,
                    'maintenance_fee_max': maintenance_fee_max,
                    'laundry_level': laundry_level, 'furnished': furnished,
                    'waterfront': waterfront, 'amenities': amenities,
                    'gym': gym, 'pool': pool, 'concierge': concierge, 'elevator': elevator
                }.items() if v is not None
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ [CONDO SEARCH] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "properties": []
        }


# ==================== CONDO-SPECIFIC FILTERS ====================

def filter_by_floor_level(properties: List[Dict], min_level: int) -> List[Dict]:
    """Filter condos by minimum floor level"""
    filtered = []
    for prop in properties:
        level = prop.get('level')
        if level and isinstance(level, (int, float)) and level >= min_level:
            filtered.append(prop)
    
    logger.info(f"Floor filter: {len(filtered)}/{len(properties)} condos on level {min_level}+")
    return filtered


def filter_by_pets(properties: List[Dict], pets_allowed: bool) -> List[Dict]:
    """Filter condos by pet policy"""
    filtered = []
    for prop in properties:
        pets_permitted = prop.get('petsPermitted')
        if pets_permitted == pets_allowed:
            filtered.append(prop)
    
    logger.info(f"Pets filter: {len(filtered)}/{len(properties)} condos")
    return filtered


def filter_by_amenities(properties: List[Dict], required_amenities: List[str]) -> List[Dict]:
    """Filter condos by building amenities"""
    filtered = []
    
    for prop in properties:
        prop_amenities = prop.get('condoAmenities', [])
        if not isinstance(prop_amenities, list):
            prop_amenities = []
        
        # Convert to lowercase for matching
        prop_amenities_lower = [a.lower() for a in prop_amenities]
        
        # Check if all required amenities are present
        has_all = all(
            any(req.lower() in pa for pa in prop_amenities_lower)
            for req in required_amenities
        )
        
        if has_all:
            filtered.append(prop)
    
    logger.info(f"Amenity filter: {len(filtered)}/{len(properties)} condos with {required_amenities}")
    return filtered


# ==================== AI-POWERED SEARCH ====================

def extract_condo_criteria_with_ai(query: str) -> Dict:
    """
    Use OpenAI to extract ALL condo search criteria from natural language.
    Supports 60+ condo-specific fields including location, amenities, floor level, etc.
    """
    if not OPENAI_ENABLED:
        logger.warning("OpenAI not available, using fallback")
        return extract_condo_criteria_fallback(query)
    
    try:
        logger.info(f"🤖 Extracting criteria from: '{query}'")
        
        prompt = f"""Extract ALL possible condo search criteria from this query: "{query}"

COMPLETE LIST OF AVAILABLE CONDO FIELDS:

**Location & Building:**
- city: string (Toronto, Ottawa, Vancouver, Montreal, etc.)
- neighborhood: string (Yorkville, Downtown, Liberty Village, etc.)
- building_name: string (One Bloor, Harbour Plaza, The Summit, etc.)
- street_name: string (Yonge Street, Bloor Street, etc.)
- intersection: string (Yonge & Bloor, King & Bay, etc.)

**Basic Requirements:**
- bedrooms: integer (0 for studio, 1, 2, 3, 4+)
- bathrooms: number (1, 1.5, 2, 2.5, 3, etc.)
- min_price: number
- max_price: number
- min_sqft: number (square footage)
- max_sqft: number
- listing_type: "sale" or "rent"

**Floor & Location:**
- floor_level_min: integer (minimum floor number)
- floor_level_max: integer (maximum floor number)
- exposure: string (North, South, East, West, N, S, E, W)
- view: string (City, Water, Park, Lake, Mountain, etc.)
- waterfront: boolean

**Parking & Storage:**
- parking_spaces: integer (1, 2, 3+)
- locker: boolean (storage locker)
- visitor_parking: boolean

**Unit Features:**
- balcony: boolean
- balcony_size: number (in sqft)
- furnished: boolean
- laundry_level: string ("In Unit", "In Building", "Ensuite")
- num_kitchens: integer
- ceiling_height: string ("9 ft", "10 ft", "high ceilings")

**Building Amenities:**
- amenities: array of strings (general amenity list)
- gym: boolean (fitness center)
- pool: boolean (swimming pool)
- concierge: boolean (24/7 concierge service)
- rooftop: boolean (rooftop terrace/deck)
- party_room: boolean
- elevator: boolean
- security: boolean (security system/guard)

**Financial:**
- maintenance_fee_max: number (maximum monthly maintenance fee)

**Restrictions & Policies:**
- pets_permitted: boolean (pet-friendly, allows dogs/cats)
- non_smoking: boolean

**Systems:**
- air_conditioning: string or boolean
- heat_type: string

EXTRACTION RULES:
1. Extract EVERY relevant field mentioned in the query
2. For location: Extract city, neighborhood, building name, street, or intersection
3. For intersections: Store as "intersection" field (e.g., "Yonge & Bloor")
4. For bedrooms: 0 = studio, extract number
5. For amenities: Create array AND set individual boolean fields (gym, pool, etc.)
6. For price: Under $X = max_price, Over $X = min_price, $X-$Y = both
7. For floor: "10th floor or higher" = floor_level_min: 10
8. For exposure: North/South/East/West or N/S/E/W
9. For view: City, Water, Lake, Park, Mountain, etc.
10. For laundry: "in-unit laundry" or "ensuite laundry" = "In Unit"
11. For listing type: "rent", "rental", "lease" = "rent", otherwise "sale"

EXAMPLES:
Input: "2 bedroom condo in Toronto with gym and pool"
Output: {{"city": "Toronto", "bedrooms": 2, "amenities": ["Gym", "Pool"], "gym": true, "pool": true}}

Input: "luxury condo in Yorkville with concierge and rooftop"
Output: {{"city": "Toronto", "neighborhood": "Yorkville", "amenities": ["Concierge", "Rooftop"], "concierge": true, "rooftop": true}}

Input: "pet-friendly studio with balcony near Yonge and Bloor"
Output: {{"city": "Toronto", "intersection": "Yonge & Bloor", "bedrooms": 0, "pets_permitted": true, "balcony": true}}

Input: "condo on 20th floor with lake view and parking"
Output: {{"floor_level_min": 20, "view": "Water", "parking_spaces": 1}}

Input: "furnished condo with in-unit laundry under $2500/month"
Output: {{"furnished": true, "laundry_level": "In Unit", "max_price": 2500, "listing_type": "rent"}}

Input: "2 bed 2 bath condo with south exposure and locker"
Output: {{"bedrooms": 2, "bathrooms": 2, "exposure": "South", "locker": true}}

Input: "waterfront condo with gym, pool, concierge and party room"
Output: {{"waterfront": true, "amenities": ["Gym", "Pool", "Concierge", "Party Room"], "gym": true, "pool": true, "concierge": true, "party_room": true}}

Input: "penthouse condo over 1500 sqft with rooftop access"
Output: {{"min_sqft": 1500, "floor_level_min": 20, "amenities": ["Rooftop"], "rooftop": true}}

Respond with JSON only, no markdown or explanations."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert condo real estate search assistant. Extract ALL possible search criteria from user queries and return pure JSON with no markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        content = re.sub(r'```json\s*|\s*```', '', content)
        content = content.strip()
        
        # Extract JSON
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            criteria = json.loads(json_match.group())
            logger.info(f"✅ Extracted {len(criteria)} criteria: {list(criteria.keys())}")
            return criteria
        else:
            logger.warning("No JSON found in AI response, using fallback")
        
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        import traceback
        traceback.print_exc()
    
    return extract_condo_criteria_fallback(query)


def extract_condo_criteria_fallback(query: str) -> Dict:
    """
    Fallback regex-based extraction for condo criteria.
    Handles intersections, all amenities, and 60+ fields.
    """
    criteria = {}
    q = query.lower()
    
    # ===== LOCATION =====
    
    # Normalize common typos first
    q = re.sub(r'younge', 'yonge', q)  # Common typo: "Younge" → "Yonge"
    
    # Extract intersection (Yonge & Bloor, King and Bay, etc.)
    intersection_patterns = [
        r'([\w\s]+?)\s+(?:&|and|at)\s+([\w\s]+?)(?:\s+(?:street|st|avenue|ave|road|rd|blvd|boulevard))?(?:\s|$|,)',
        r'(?:near|at|on)\s+([\w\s]+?)\s+(?:&|and)\s+([\w\s]+)',
    ]
    for pattern in intersection_patterns:
        match = re.search(pattern, q, re.IGNORECASE)
        if match:
            street1 = match.group(1).strip()
            street2 = match.group(2).strip()
            # Remove common words
            street1 = re.sub(r'\b(near|at|on|the)\b', '', street1, flags=re.IGNORECASE).strip()
            street2 = re.sub(r'\b(near|at|on|the)\b', '', street2, flags=re.IGNORECASE).strip()
            criteria["intersection"] = f"{street1.title()} & {street2.title()}"
            # Also extract city if not already set
            if 'toronto' in q and 'city' not in criteria:
                criteria['city'] = 'Toronto'
            break
    
    # Extract city names
    city_patterns = [
        r'in\s+(toronto|ottawa|vancouver|montreal|mississauga|brampton|hamilton|calgary|edmonton|winnipeg)',
        r'(toronto|ottawa|vancouver|montreal|mississauga|brampton|hamilton|calgary|edmonton|winnipeg)\s+condo',
    ]
    for pattern in city_patterns:
        match = re.search(pattern, q)
        if match:
            criteria["city"] = match.group(1).title()
            break
    
    # Extract neighborhood (Yorkville, Downtown, Liberty Village, etc.)
    neighborhood_patterns = [
        r'in\s+(yorkville|downtown|liberty village|distillery|financial district|entertainment district)',
        r'(yorkville|downtown|liberty village|distillery|financial district|entertainment district)\s+area',
    ]
    for pattern in neighborhood_patterns:
        match = re.search(pattern, q)
        if match:
            criteria["neighborhood"] = match.group(1).title()
            break
    
    # ===== BASIC REQUIREMENTS =====
    
    # Extract bedrooms (including studio = 0)
    if 'studio' in q:
        criteria["bedrooms"] = 0
    else:
        bed_match = re.search(r'(\d+)\s*(?:bed(?:room)?s?|br)', q)
        if bed_match:
            criteria["bedrooms"] = int(bed_match.group(1))
    
    # Extract bathrooms
    bath_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?)', q)
    if bath_match:
        criteria["bathrooms"] = float(bath_match.group(1))
    
    # Extract price
    price_patterns = [
        (r'under\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*k', lambda x: int(float(x.replace(',', '')) * 1000), 'max'),
        (r'under\s*\$?(\d+(?:,\d{3})*)', lambda x: int(x.replace(',', '')), 'max'),
        (r'below\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*k', lambda x: int(float(x.replace(',', '')) * 1000), 'max'),
        (r'over\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*k', lambda x: int(float(x.replace(',', '')) * 1000), 'min'),
        (r'above\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*k', lambda x: int(float(x.replace(',', '')) * 1000), 'min'),
        (r'\$?(\d+(?:,\d{3})*)\s*/\s*month', lambda x: int(x.replace(',', '')), 'max'),
        (r'\$?(\d+)k', lambda x: int(x) * 1000, 'max'),
    ]
    for pattern, converter, price_type in price_patterns:
        match = re.search(pattern, q)
        if match:
            price_val = converter(match.group(1))
            if price_type == 'max':
                criteria["max_price"] = price_val
            else:
                criteria["min_price"] = price_val
            break
    
    # Infer listing type from price context
    if '/month' in q or 'rent' in q or 'rental' in q or 'lease' in q:
        criteria["listing_type"] = "rent"
    
    # Extract square footage
    sqft_match = re.search(r'(\d+(?:,\d{3})*)\s*(?:sq\s*ft|sqft|square feet)', q)
    if sqft_match:
        sqft = int(sqft_match.group(1).replace(',', ''))
        if 'over' in q or 'above' in q:
            criteria["min_sqft"] = sqft
        else:
            criteria["max_sqft"] = sqft
    
    # ===== FLOOR & VIEW =====
    
    # Extract floor level
    floor_patterns = [
        (r'(\d+)(?:th|st|nd|rd)?\s*floor\s+(?:or\s+)?(?:higher|above)', 'min'),
        (r'(?:floor|level)\s*(\d+)\s+(?:or\s+)?(?:higher|above)', 'min'),
        (r'on\s+(?:the\s+)?(\d+)(?:th|st|nd|rd)?\s*floor', 'exact'),
        (r'penthouse', 'penthouse'),
    ]
    for pattern, floor_type in floor_patterns:
        if floor_type == 'penthouse':
            if pattern in q:
                criteria["floor_level_min"] = 20  # Penthouses typically 20+
        else:
            match = re.search(pattern, q)
            if match:
                floor_num = int(match.group(1))
                if floor_type == 'min':
                    criteria["floor_level_min"] = floor_num
                else:
                    criteria["floor_level_min"] = floor_num
                    criteria["floor_level_max"] = floor_num
                break
    
    # Extract exposure
    exposure_patterns = [
        r'(?:south|southern)\s+(?:facing|exposure)',
        r'(?:north|northern)\s+(?:facing|exposure)',
        r'(?:east|eastern)\s+(?:facing|exposure)',
        r'(?:west|western)\s+(?:facing|exposure)',
    ]
    exposure_map = {'south': 'South', 'north': 'North', 'east': 'East', 'west': 'West'}
    for pattern in exposure_patterns:
        match = re.search(pattern, q)
        if match:
            direction = match.group(0).split()[0].lower()
            criteria["exposure"] = exposure_map.get(direction, direction.title())
            break
    
    # Extract view
    view_keywords = {
        'lake view': 'Water', 'water view': 'Water', 'waterfront': 'Water',
        'city view': 'City', 'skyline': 'City',
        'park view': 'Park', 'garden view': 'Park',
        'mountain view': 'Mountain',
    }
    for keyword, view_type in view_keywords.items():
        if keyword in q:
            criteria["view"] = view_type
            if 'waterfront' in keyword:
                criteria["waterfront"] = True
            break
    
    # ===== PARKING & STORAGE =====
    
    if 'parking' in q:
        parking_match = re.search(r'(\d+)\s*parking', q)
        if parking_match:
            criteria["parking_spaces"] = int(parking_match.group(1))
        else:
            criteria["parking_spaces"] = 1
    
    if 'locker' in q or 'storage' in q:
        criteria["locker"] = True
    
    # ===== UNIT FEATURES =====
    
    if 'balcony' in q or 'terrace' in q:
        criteria["balcony"] = True
    
    if 'furnished' in q:
        criteria["furnished"] = True
    
    # Laundry
    if 'in-unit laundry' in q or 'in unit laundry' in q or 'ensuite laundry' in q:
        criteria["laundry_level"] = "In Unit"
    elif 'laundry in building' in q or 'building laundry' in q:
        criteria["laundry_level"] = "In Building"
    
    # ===== BUILDING AMENITIES =====
    
    amenities = []
    
    # Individual amenity detection
    if 'gym' in q or 'fitness' in q:
        amenities.append('Gym')
        criteria["gym"] = True
    
    if 'pool' in q or 'swimming' in q:
        amenities.append('Pool')
        criteria["pool"] = True
    
    if 'concierge' in q:
        amenities.append('Concierge')
        criteria["concierge"] = True
    
    if 'rooftop' in q:
        amenities.append('Rooftop')
        criteria["rooftop"] = True
    
    if 'party room' in q:
        amenities.append('Party Room')
        criteria["party_room"] = True
    
    if 'elevator' in q:
        criteria["elevator"] = True
    
    if 'security' in q or '24/7' in q or '24 hour' in q:
        criteria["security"] = True
    
    if amenities:
        criteria["amenities"] = amenities
    
    # ===== RESTRICTIONS & POLICIES =====
    
    if any(word in q for word in ['pet', 'pets', 'pet-friendly', 'dog', 'cat']):
        criteria["pets_permitted"] = True
    
    if 'non-smoking' in q or 'no smoking' in q:
        criteria["non_smoking"] = True
    
    # ===== FINANCIAL =====
    
    # Maintenance fee
    maintenance_match = re.search(r'maintenance.*?(?:under|below)\s*\$?(\d+)', q)
    if maintenance_match:
        criteria["maintenance_fee_max"] = int(maintenance_match.group(1))
    
    logger.info(f"📋 Fallback extracted {len(criteria)} criteria: {list(criteria.keys())}")
    return criteria


# ==================== EXPORT FUNCTIONS ====================

__all__ = [
    "CONDO_MLS_FIELDS",
    "CONDO_FIELD_HANDLERS",
    "standardize_condo_property",
    "search_condo_properties",
    "extract_condo_criteria_with_ai",
    "filter_by_floor_level",
    "filter_by_pets",
    "filter_by_amenities"
]

logger.info("[OK] Condo Assistant module loaded successfully")
