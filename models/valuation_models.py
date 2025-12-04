"""
Canadian Real Estate Property Valuation Data Models

This module defines data classes for a property valuation system using the 
Direct Comparison Approach (DCA) methodology. The system fetches property 
details from the Repliers API and calculates market value estimates based on 
comparable sold properties.

Author: Real Estate Valuation System
Date: November 2025
"""

from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, date
from decimal import Decimal
import json


# ==================== VALIDATION UTILITIES ====================

def validate_positive_number(value: float, field_name: str) -> float:
    """Validate that a numeric value is positive."""
    if value is not None and value <= 0:
        raise ValueError(f"{field_name} must be greater than 0, got {value}")
    return value


def validate_percentage(value: float, field_name: str) -> float:
    """Validate that a percentage is within reasonable bounds."""
    if value is not None and (value < -100 or value > 100):
        raise ValueError(f"{field_name} must be between -100 and 100, got {value}")
    return value


def validate_date_not_future(value: date, field_name: str) -> date:
    """Validate that a date is not in the future."""
    if value is not None and value > date.today():
        raise ValueError(f"{field_name} cannot be in the future, got {value}")
    return value


# ==================== ADJUSTMENT ITEM ====================

@dataclass
class AdjustmentItem:
    """
    Represents a single adjustment made to a comparable property's sale price.
    
    Adjustments are made when a comparable property differs from the subject
    property in key characteristics (e.g., size, condition, location features).
    
    Attributes:
        adjustment_category: Category of adjustment (e.g., 'Size', 'Condition', 
                           'Location', 'Age', 'Basement', 'Garage')
        amount: Dollar amount of adjustment (positive means comp is inferior,
               negative means comp is superior)
        percentage: Percentage adjustment relative to comp's sale price
        reasoning: Detailed explanation of why this adjustment was made
    """
    adjustment_category: str
    amount: float
    percentage: float
    reasoning: str
    
    def __post_init__(self):
        """Validate adjustment data after initialization."""
        if not self.adjustment_category or not self.adjustment_category.strip():
            raise ValueError("adjustment_category cannot be empty")
        
        # Validate percentage is reasonable
        validate_percentage(self.percentage, "percentage")
        
        # Ensure reasoning is provided
        if not self.reasoning or not self.reasoning.strip():
            raise ValueError("reasoning cannot be empty")
    
    def __repr__(self) -> str:
        """Debug-friendly representation."""
        sign = "+" if self.amount >= 0 else ""
        return (f"AdjustmentItem(category='{self.adjustment_category}', "
                f"amount={sign}${self.amount:,.2f}, "
                f"percentage={sign}{self.percentage:.2f}%)")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'adjustment_category': self.adjustment_category,
            'amount': round(self.amount, 2),
            'percentage': round(self.percentage, 2),
            'reasoning': self.reasoning
        }


# ==================== PROPERTY DETAILS ====================

@dataclass
class PropertyDetails:
    """
    Represents detailed information about a real estate property.
    
    This class stores comprehensive property characteristics used in the
    valuation process. All properties (subject and comparables) use this
    structure for consistency.
    
    Attributes:
        mls_id: Multiple Listing Service identifier
        address: Full street address
        city: City/municipality
        province: Province (e.g., 'ON', 'BC', 'AB')
        postal_code: Canadian postal code
        property_type: Type of property (e.g., 'Detached', 'Semi-Detached', 
                      'Townhouse', 'Condo')
        bedrooms: Number of bedrooms
        bathrooms: Number of bathrooms (can be fractional, e.g., 2.5)
        sqft: Total above-grade square footage
        lot_size: Lot size in square feet
        year_built: Year of construction
        condition: Property condition (e.g., 'Excellent', 'Good', 'Average', 
                  'Fair', 'Poor')
        style: Architectural style (e.g., '2-Storey', 'Bungalow', 'Backsplit')
        basement_finish: Basement status (e.g., 'Finished', 'Partially Finished', 
                        'Unfinished', 'None')
        garage_type: Garage type (e.g., 'Attached', 'Detached', 'Built-in', 'None')
        parking_spaces: Number of parking spaces
        features: Additional notable features (e.g., pool, fireplace, renovations)
        latitude: Geographic latitude coordinate
        longitude: Geographic longitude coordinate
    """
    mls_id: str
    address: str
    city: str
    province: str
    postal_code: str
    property_type: str
    bedrooms: int
    bathrooms: float
    sqft: int
    lot_size: Optional[int] = None
    year_built: Optional[int] = None
    condition: Optional[str] = 'Average'
    style: Optional[str] = None
    basement_finish: Optional[str] = 'Unfinished'
    garage_type: Optional[str] = 'None'
    parking_spaces: Optional[int] = 0
    features: List[str] = field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    def __post_init__(self):
        """Validate property data after initialization."""
        # Validate required string fields
        if not self.mls_id or not self.mls_id.strip():
            raise ValueError("mls_id cannot be empty")
        if not self.address or not self.address.strip():
            raise ValueError("address cannot be empty")
        if not self.city or not self.city.strip():
            raise ValueError("city cannot be empty")
        
        # Validate numeric fields
        if self.bedrooms < 0:
            raise ValueError(f"bedrooms must be >= 0, got {self.bedrooms}")
        if self.bathrooms < 0:
            raise ValueError(f"bathrooms must be >= 0, got {self.bathrooms}")
        
        # Allow sqft to be 0 for properties where size is not available
        # Valuation will handle this by estimating or marking as low confidence
        if self.sqft < 0:
            raise ValueError(f"sqft must be >= 0, got {self.sqft}")
        
        if self.lot_size is not None:
            validate_positive_number(self.lot_size, "lot_size")
        
        if self.year_built is not None:
            current_year = datetime.now().year
            if self.year_built < 1700 or self.year_built > current_year + 2:
                raise ValueError(f"year_built must be between 1700 and {current_year + 2}, got {self.year_built}")
        
        if self.parking_spaces is not None and self.parking_spaces < 0:
            raise ValueError(f"parking_spaces must be >= 0, got {self.parking_spaces}")
        
        # Validate coordinates if provided
        if self.latitude is not None and (self.latitude < -90 or self.latitude > 90):
            raise ValueError(f"latitude must be between -90 and 90, got {self.latitude}")
        if self.longitude is not None and (self.longitude < -180 or self.longitude > 180):
            raise ValueError(f"longitude must be between -180 and 180, got {self.longitude}")
    
    def __repr__(self) -> str:
        """Debug-friendly representation."""
        return (f"PropertyDetails(mls_id='{self.mls_id}', "
                f"address='{self.address}', "
                f"{self.bedrooms}bed/{self.bathrooms}bath, "
                f"{self.sqft:,}sqft)")
    
    def get_summary(self) -> str:
        """Get a human-readable property summary."""
        summary_parts = [
            f"{self.bedrooms} bed, {self.bathrooms} bath",
            f"{self.sqft:,} sqft",
            f"{self.property_type}"
        ]
        
        if self.year_built:
            summary_parts.append(f"Built {self.year_built}")
        
        if self.lot_size:
            summary_parts.append(f"Lot: {self.lot_size:,} sqft")
        
        return f"{self.address}, {self.city} - " + ", ".join(summary_parts)
    
    def calculate_price_per_sqft(self, price: float) -> float:
        """Calculate price per square foot."""
        if self.sqft <= 0:
            raise ValueError("Cannot calculate price per sqft: sqft must be > 0")
        return price / self.sqft
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'mls_id': self.mls_id,
            'address': self.address,
            'city': self.city,
            'province': self.province,
            'postal_code': self.postal_code,
            'property_type': self.property_type,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'sqft': self.sqft,
            'lot_size': self.lot_size,
            'year_built': self.year_built,
            'condition': self.condition,
            'style': self.style,
            'basement_finish': self.basement_finish,
            'garage_type': self.garage_type,
            'parking_spaces': self.parking_spaces,
            'features': self.features,
            'latitude': self.latitude,
            'longitude': self.longitude
        }


# ==================== COMPARABLE PROPERTY ====================

@dataclass
class ComparableProperty:
    """
    Represents a comparable sold property used in valuation analysis.
    
    Extends PropertyDetails with sale information and adjustments made to
    align the comparable with the subject property.
    
    Attributes:
        property_details: Core property information (PropertyDetails instance)
        sale_price: Actual sale price of the comparable
        sale_date: Date the property was sold
        days_on_market: Number of days the property was listed before selling
        adjustments: List of adjustments applied to align with subject property
        distance_from_subject: Distance in kilometers from subject property
        similarity_score: Calculated similarity score (0-100) to subject property
    """
    property_details: PropertyDetails
    sale_price: float
    sale_date: date
    days_on_market: Optional[int] = None
    adjustments: List[AdjustmentItem] = field(default_factory=list)
    distance_from_subject: Optional[float] = None
    similarity_score: Optional[float] = None
    
    def __post_init__(self):
        """Validate comparable property data after initialization."""
        validate_positive_number(self.sale_price, "sale_price")
        validate_date_not_future(self.sale_date, "sale_date")
        
        if self.days_on_market is not None and self.days_on_market < 0:
            raise ValueError(f"days_on_market must be >= 0, got {self.days_on_market}")
        
        if self.distance_from_subject is not None and self.distance_from_subject < 0:
            raise ValueError(f"distance_from_subject must be >= 0, got {self.distance_from_subject}")
        
        if self.similarity_score is not None:
            if self.similarity_score < 0 or self.similarity_score > 100:
                raise ValueError(f"similarity_score must be between 0 and 100, got {self.similarity_score}")
    
    def __repr__(self) -> str:
        """Debug-friendly representation."""
        adjusted = self.get_adjusted_price()
        return (f"ComparableProperty(mls_id='{self.property_details.mls_id}', "
                f"sale_price=${self.sale_price:,.0f}, "
                f"adjusted=${adjusted:,.0f}, "
                f"adjustments={len(self.adjustments)})")
    
    def calculate_total_adjustments(self) -> float:
        """
        Calculate the total dollar amount of all adjustments.
        
        Returns:
            Total adjustment amount (sum of all adjustment.amount values)
        """
        return sum(adj.amount for adj in self.adjustments)
    
    def calculate_total_adjustment_percentage(self) -> float:
        """
        Calculate the total percentage adjustment.
        
        Returns:
            Total adjustment as percentage of original sale price
        """
        if self.sale_price <= 0:
            return 0.0
        return (self.calculate_total_adjustments() / self.sale_price) * 100
    
    def get_adjusted_price(self) -> float:
        """
        Calculate the adjusted sale price after applying all adjustments.
        
        Returns:
            Sale price + total adjustments
        """
        return self.sale_price + self.calculate_total_adjustments()
    
    def get_price_per_sqft(self) -> float:
        """Calculate original sale price per square foot."""
        return self.property_details.calculate_price_per_sqft(self.sale_price)
    
    def get_adjusted_price_per_sqft(self) -> float:
        """Calculate adjusted price per square foot."""
        return self.property_details.calculate_price_per_sqft(self.get_adjusted_price())
    
    def add_adjustment(self, category: str, amount: float, percentage: float, reasoning: str):
        """
        Add a new adjustment to the comparable property.
        
        Args:
            category: Adjustment category name
            amount: Dollar amount of adjustment
            percentage: Percentage adjustment
            reasoning: Explanation for the adjustment
        """
        adjustment = AdjustmentItem(
            adjustment_category=category,
            amount=amount,
            percentage=percentage,
            reasoning=reasoning
        )
        self.adjustments.append(adjustment)
    
    def get_adjustment_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all adjustments.
        
        Returns:
            Dictionary with adjustment statistics and details
        """
        total_amount = self.calculate_total_adjustments()
        total_percentage = self.calculate_total_adjustment_percentage()
        
        return {
            'total_adjustments': len(self.adjustments),
            'total_amount': round(total_amount, 2),
            'total_percentage': round(total_percentage, 2),
            'original_price': round(self.sale_price, 2),
            'adjusted_price': round(self.get_adjusted_price(), 2),
            'adjustments_by_category': [adj.to_dict() for adj in self.adjustments]
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'property_details': self.property_details.to_dict(),
            'sale_price': round(self.sale_price, 2),
            'sale_date': self.sale_date.isoformat(),
            'days_on_market': self.days_on_market,
            'adjustments': [adj.to_dict() for adj in self.adjustments],
            'distance_from_subject': self.distance_from_subject,
            'similarity_score': self.similarity_score,
            'adjusted_price': round(self.get_adjusted_price(), 2),
            'total_adjustments': round(self.calculate_total_adjustments(), 2),
            'adjustment_summary': self.get_adjustment_summary()
        }


# ==================== VALUATION RESULT ====================

@dataclass
class ValuationResult:
    """
    Represents the final property valuation result using Direct Comparison Approach.
    
    This class encapsulates the complete valuation analysis including the subject
    property, comparable sales, estimated value, and supporting analysis.
    
    Attributes:
        subject_property: The property being valued
        comparables: List of comparable sold properties with adjustments
        estimated_value: Final estimated market value
        value_range: Tuple of (low_estimate, high_estimate) for value range
        confidence_score: Confidence level in the valuation (0-100)
        market_analysis: Dictionary containing market insights and trends
        valuation_date: Date the valuation was performed
        methodology: Valuation methodology used (default: 'Direct Comparison Approach')
        notes: Additional notes or caveats about the valuation
    """
    subject_property: PropertyDetails
    comparables: List[ComparableProperty]
    estimated_value: float
    value_range: Tuple[float, float]
    confidence_score: float
    market_analysis: Dict[str, Any] = field(default_factory=dict)
    valuation_date: date = field(default_factory=date.today)
    methodology: str = 'Direct Comparison Approach (DCA)'
    notes: Optional[str] = None
    
    def __post_init__(self):
        """Validate valuation result data after initialization."""
        validate_positive_number(self.estimated_value, "estimated_value")
        
        # Validate value range
        low, high = self.value_range
        if low <= 0 or high <= 0:
            raise ValueError(f"value_range values must be > 0, got ({low}, {high})")
        if low > high:
            raise ValueError(f"value_range low ({low}) cannot be greater than high ({high})")
        if not (low <= self.estimated_value <= high):
            raise ValueError(f"estimated_value ({self.estimated_value}) must be within value_range ({low}, {high})")
        
        # Validate confidence score
        if self.confidence_score < 0 or self.confidence_score > 100:
            raise ValueError(f"confidence_score must be between 0 and 100, got {self.confidence_score}")
        
        # Validate comparables list (not required for simple market adjustment method)
        # Allow empty list for Simple Market Adjustment methodology
        if "Simple Market Adjustment" not in self.methodology:
            if not self.comparables:
                raise ValueError("comparables list cannot be empty for non-simple valuation methods")
            if len(self.comparables) < 3:
                raise ValueError(f"Need at least 3 comparables for reliable valuation, got {len(self.comparables)}")
        
        validate_date_not_future(self.valuation_date, "valuation_date")
    
    def __repr__(self) -> str:
        """Debug-friendly representation."""
        low, high = self.value_range
        return (f"ValuationResult(subject='{self.subject_property.mls_id}', "
                f"value=${self.estimated_value:,.0f}, "
                f"range=${low:,.0f}-${high:,.0f}, "
                f"confidence={self.confidence_score:.1f}%, "
                f"comparables={len(self.comparables)})")
    
    def calculate_average_adjusted_price(self) -> float:
        """
        Calculate the average adjusted price of all comparables.
        
        Returns:
            Mean of all comparable adjusted prices
        """
        if not self.comparables:
            return 0.0
        return sum(comp.get_adjusted_price() for comp in self.comparables) / len(self.comparables)
    
    def calculate_median_adjusted_price(self) -> float:
        """
        Calculate the median adjusted price of all comparables.
        
        Returns:
            Median of all comparable adjusted prices
        """
        if not self.comparables:
            return 0.0
        
        adjusted_prices = sorted([comp.get_adjusted_price() for comp in self.comparables])
        n = len(adjusted_prices)
        
        if n % 2 == 0:
            return (adjusted_prices[n//2 - 1] + adjusted_prices[n//2]) / 2
        else:
            return adjusted_prices[n//2]
    
    def calculate_weighted_average_price(self) -> float:
        """
        Calculate weighted average price using similarity scores as weights.
        
        Returns:
            Weighted average of comparable adjusted prices
        """
        if not self.comparables:
            return 0.0
        
        # Use similarity scores if available, otherwise equal weights
        total_weight = 0.0
        weighted_sum = 0.0
        
        for comp in self.comparables:
            weight = comp.similarity_score if comp.similarity_score is not None else 50.0
            weighted_sum += comp.get_adjusted_price() * weight
            total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def get_price_per_sqft_analysis(self) -> Dict[str, float]:
        """
        Analyze price per square foot across all comparables.
        
        Returns:
            Dictionary with min, max, average, and median price/sqft
        """
        if not self.comparables:
            return {}
        
        prices_per_sqft = [comp.get_adjusted_price_per_sqft() for comp in self.comparables]
        sorted_prices = sorted(prices_per_sqft)
        n = len(sorted_prices)
        
        median = sorted_prices[n//2] if n % 2 != 0 else (sorted_prices[n//2-1] + sorted_prices[n//2]) / 2
        
        return {
            'min_price_per_sqft': round(min(prices_per_sqft), 2),
            'max_price_per_sqft': round(max(prices_per_sqft), 2),
            'avg_price_per_sqft': round(sum(prices_per_sqft) / len(prices_per_sqft), 2),
            'median_price_per_sqft': round(median, 2),
            'subject_estimated_price_per_sqft': round(self.estimated_value / self.subject_property.sqft, 2)
        }
    
    def get_comparable_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive statistics about the comparables used.
        
        Returns:
            Dictionary with statistical analysis of comparables
        """
        if not self.comparables:
            return {}
        
        adjusted_prices = [comp.get_adjusted_price() for comp in self.comparables]
        sale_dates = [comp.sale_date for comp in self.comparables]
        dom_list = [comp.days_on_market for comp in self.comparables if comp.days_on_market is not None]
        distances = [comp.distance_from_subject for comp in self.comparables if comp.distance_from_subject is not None]
        
        return {
            'count': len(self.comparables),
            'average_adjusted_price': round(sum(adjusted_prices) / len(adjusted_prices), 2),
            'median_adjusted_price': round(self.calculate_median_adjusted_price(), 2),
            'price_range': (round(min(adjusted_prices), 2), round(max(adjusted_prices), 2)),
            'oldest_sale_date': min(sale_dates).isoformat() if sale_dates else None,
            'newest_sale_date': max(sale_dates).isoformat() if sale_dates else None,
            'average_days_on_market': round(sum(dom_list) / len(dom_list), 1) if dom_list else None,
            'average_distance_km': round(sum(distances) / len(distances), 2) if distances else None,
            'price_per_sqft_analysis': self.get_price_per_sqft_analysis()
        }
    
    def get_valuation_summary(self) -> str:
        """
        Generate a human-readable valuation summary.
        
        Returns:
            Formatted string summarizing the valuation
        """
        low, high = self.value_range
        avg_price = self.calculate_average_adjusted_price()
        
        summary = f"""
Property Valuation Summary
{'=' * 50}

Subject Property: {self.subject_property.get_summary()}
MLS ID: {self.subject_property.mls_id}

Estimated Market Value: ${self.estimated_value:,.0f}
Value Range: ${low:,.0f} - ${high:,.0f}
Confidence Score: {self.confidence_score:.1f}%

Comparables Analysis:
- Number of Comparables: {len(self.comparables)}
- Average Adjusted Price: ${avg_price:,.0f}
- Median Adjusted Price: ${self.calculate_median_adjusted_price():,.0f}

Methodology: {self.methodology}
Valuation Date: {self.valuation_date.isoformat()}
"""
        
        if self.notes:
            summary += f"\nNotes: {self.notes}"
        
        return summary.strip()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'subject_property': self.subject_property.to_dict(),
            'comparables': [comp.to_dict() for comp in self.comparables],
            'estimated_value': round(self.estimated_value, 2),
            'value_range': {
                'low': round(self.value_range[0], 2),
                'high': round(self.value_range[1], 2)
            },
            'confidence_score': round(self.confidence_score, 2),
            'market_analysis': self.market_analysis,
            'valuation_date': self.valuation_date.isoformat(),
            'methodology': self.methodology,
            'notes': self.notes,
            'statistics': self.get_comparable_statistics(),
            'price_per_sqft_analysis': self.get_price_per_sqft_analysis()
        }
    
    def to_json(self, indent: int = 2) -> str:
        """
        Convert to formatted JSON string.
        
        Args:
            indent: Number of spaces for JSON indentation
            
        Returns:
            JSON string representation of the valuation
        """
        return json.dumps(self.to_dict(), indent=indent)
    
    def export_report(self, filepath: str):
        """
        Export valuation report to JSON file.
        
        Args:
            filepath: Path where the JSON report should be saved
        """
        with open(filepath, 'w') as f:
            f.write(self.to_json())


# ==================== FACTORY FUNCTIONS ====================

def create_property_from_api_response(api_data: Dict[str, Any]) -> PropertyDetails:
    """
    Create PropertyDetails instance from Repliers API response.
    
    Args:
        api_data: Dictionary containing property data from API
        
    Returns:
        PropertyDetails instance
    """
    return PropertyDetails(
        mls_id=api_data.get('mlsNumber', api_data.get('mls_id', 'UNKNOWN')),
        address=api_data.get('address', {}).get('streetAddress', api_data.get('address', '')),
        city=api_data.get('address', {}).get('city', api_data.get('city', '')),
        province=api_data.get('address', {}).get('province', api_data.get('province', 'ON')),
        postal_code=api_data.get('address', {}).get('zip', api_data.get('postal_code', '')),
        property_type=api_data.get('type', api_data.get('property_type', 'Unknown')),
        bedrooms=int(api_data.get('details', {}).get('numBedrooms', api_data.get('bedrooms', 0))),
        bathrooms=float(api_data.get('details', {}).get('numBathrooms', api_data.get('bathrooms', 0))),
        sqft=int(api_data.get('details', {}).get('sqft', api_data.get('sqft', 0))),
        lot_size=api_data.get('land', {}).get('sizeTotal', api_data.get('lot_size')),
        year_built=api_data.get('details', {}).get('yearBuilt', api_data.get('year_built')),
        condition=api_data.get('condition', 'Average'),
        style=api_data.get('details', {}).get('style', api_data.get('style')),
        basement_finish=api_data.get('details', {}).get('basement', api_data.get('basement_finish', 'Unfinished')),
        garage_type=api_data.get('details', {}).get('garage', api_data.get('garage_type', 'None')),
        parking_spaces=api_data.get('details', {}).get('numParkingSpaces', api_data.get('parking_spaces', 0)),
        features=api_data.get('details', {}).get('features', api_data.get('features', [])),
        latitude=api_data.get('map', {}).get('latitude', api_data.get('latitude')),
        longitude=api_data.get('map', {}).get('longitude', api_data.get('longitude'))
    )


if __name__ == '__main__':
    # Example usage and testing
    print("=" * 60)
    print("Canadian Real Estate Valuation Data Models - Example Usage")
    print("=" * 60)
    
    # Create subject property
    subject = PropertyDetails(
        mls_id='C8753210',
        address='123 Main Street',
        city='Toronto',
        province='ON',
        postal_code='M5V 3A8',
        property_type='Detached',
        bedrooms=4,
        bathrooms=3.5,
        sqft=2500,
        lot_size=5000,
        year_built=2015,
        condition='Excellent',
        style='2-Storey',
        basement_finish='Finished',
        garage_type='Attached',
        parking_spaces=2,
        features=['Hardwood Floors', 'Granite Countertops', 'Walk-out Basement']
    )
    
    print("\n✅ Subject Property Created:")
    print(subject.get_summary())
    
    # Create comparable property
    comp_property = PropertyDetails(
        mls_id='C8753100',
        address='456 Oak Avenue',
        city='Toronto',
        province='ON',
        postal_code='M5V 2B9',
        property_type='Detached',
        bedrooms=4,
        bathrooms=3.0,
        sqft=2400,
        lot_size=4800,
        year_built=2014,
        condition='Good',
        style='2-Storey',
        basement_finish='Finished',
        garage_type='Attached',
        parking_spaces=2
    )
    
    comparable = ComparableProperty(
        property_details=comp_property,
        sale_price=1200000,
        sale_date=date(2025, 10, 15),
        days_on_market=18,
        distance_from_subject=0.8,
        similarity_score=92.5
    )
    
    # Add adjustments
    comparable.add_adjustment(
        category='Size',
        amount=25000,
        percentage=2.08,
        reasoning='Subject property is 100 sqft larger (+4.2%)'
    )
    
    comparable.add_adjustment(
        category='Condition',
        amount=15000,
        percentage=1.25,
        reasoning='Subject property in better condition (Excellent vs Good)'
    )
    
    comparable.add_adjustment(
        category='Bathrooms',
        amount=10000,
        percentage=0.83,
        reasoning='Subject has 0.5 additional bathrooms'
    )
    
    print(f"\n✅ Comparable Property Created:")
    print(f"   Original Sale Price: ${comparable.sale_price:,.0f}")
    print(f"   Total Adjustments: ${comparable.calculate_total_adjustments():,.0f}")
    print(f"   Adjusted Price: ${comparable.get_adjusted_price():,.0f}")
    print(f"   Adjustment Percentage: {comparable.calculate_total_adjustment_percentage():.2f}%")
    
    # Create additional comparables
    comp2_property = PropertyDetails(
        mls_id='C8753050',
        address='789 Elm Street',
        city='Toronto',
        province='ON',
        postal_code='M5V 1C2',
        property_type='Detached',
        bedrooms=4,
        bathrooms=3.5,
        sqft=2550,
        lot_size=5200,
        year_built=2016,
        condition='Excellent',
        style='2-Storey',
        basement_finish='Finished',
        garage_type='Attached',
        parking_spaces=2
    )
    
    comparable2 = ComparableProperty(
        property_details=comp2_property,
        sale_price=1280000,
        sale_date=date(2025, 11, 1),
        days_on_market=12,
        distance_from_subject=1.2,
        similarity_score=96.0
    )
    
    comparable2.add_adjustment('Size', -12500, -0.98, 'Subject property is 50 sqft smaller')
    
    comp3_property = PropertyDetails(
        mls_id='C8752900',
        address='321 Pine Road',
        city='Toronto',
        province='ON',
        postal_code='M5V 2D5',
        property_type='Detached',
        bedrooms=3,
        bathrooms=3.0,
        sqft=2450,
        lot_size=4900,
        year_built=2015,
        condition='Good',
        style='2-Storey',
        basement_finish='Finished',
        garage_type='Attached',
        parking_spaces=2
    )
    
    comparable3 = ComparableProperty(
        property_details=comp3_property,
        sale_price=1185000,
        sale_date=date(2025, 10, 20),
        days_on_market=25,
        distance_from_subject=0.5,
        similarity_score=88.5
    )
    
    comparable3.add_adjustment('Bedrooms', 40000, 3.38, 'Subject has 1 additional bedroom')
    comparable3.add_adjustment('Size', 12500, 1.05, 'Subject is 50 sqft larger')
    comparable3.add_adjustment('Condition', 15000, 1.27, 'Subject in better condition')
    
    # Create valuation result
    valuation = ValuationResult(
        subject_property=subject,
        comparables=[comparable, comparable2, comparable3],
        estimated_value=1255000,
        value_range=(1230000, 1280000),
        confidence_score=94.5,
        market_analysis={
            'market_trend': 'Stable with slight upward pressure',
            'avg_days_on_market': 18,
            'inventory_level': 'Balanced',
            'demand_indicator': 'Strong',
            'price_growth_ytd': 5.2,
            'forecast_6month': 'Continued stability expected'
        },
        notes='All comparables sold within last 45 days in same neighborhood. High confidence due to recent sales and property similarity.'
    )
    
    print(f"\n✅ Valuation Result Created:")
    print(f"\n{valuation.get_valuation_summary()}")
    
    print(f"\n📊 Comparable Statistics:")
    stats = valuation.get_comparable_statistics()
    print(f"   Average Adjusted Price: ${stats['average_adjusted_price']:,.0f}")
    print(f"   Median Adjusted Price: ${stats['median_adjusted_price']:,.0f}")
    print(f"   Price Range: ${stats['price_range'][0]:,.0f} - ${stats['price_range'][1]:,.0f}")
    print(f"   Average Days on Market: {stats['average_days_on_market']} days")
    
    print(f"\n💰 Price Per Sqft Analysis:")
    psf = valuation.get_price_per_sqft_analysis()
    print(f"   Subject (Estimated): ${psf['subject_estimated_price_per_sqft']:.2f}/sqft")
    print(f"   Comparables Average: ${psf['avg_price_per_sqft']:.2f}/sqft")
    print(f"   Range: ${psf['min_price_per_sqft']:.2f} - ${psf['max_price_per_sqft']:.2f}/sqft")
    
    print("\n" + "=" * 60)
    print("✅ All data models validated successfully!")
    print("=" * 60)
