"""
Canadian Real Estate Valuation Engine - Direct Comparison Approach
===================================================================

Implements adjustment calculations following CUSPAP (Canadian Uniform Standards 
of Professional Appraisal Practice) guidelines for residential property valuation.

Key Standards:
- Most adjustments range $5,000 to $30,000
- Market trend adjustment applied first
- Total net adjustments typically 3-8% of property value
- Gross adjustment percentage: sum(|adjustment|) / property_value
- Comparables with gross adjustments >15% are considered weak

Author: Real Estate Valuation System
Date: November 2024
"""

import logging
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.valuation_models import PropertyDetails, ComparableProperty, AdjustmentItem, ValuationResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== MARKET CONSTANTS ====================

# Property type value factors (relative to Detached = 1.0)
PROPERTY_TYPE_FACTORS = {
    'Detached': 1.00,
    'Semi-Detached': 0.85,
    'Semi-detached': 0.85,
    'Attached/Row/Townhouse': 0.75,
    'Townhouse': 0.75,
    'Condo Apartment': 0.70,
    'Condo': 0.70,
    'Multiplex': 0.80,
    'Link': 0.82,
    'Duplex': 0.78,
    'Triplex': 0.76
}

# Condition rating values (for adjustment calculation)
CONDITION_RATINGS = {
    'Poor': 1,
    'Fair': 2,
    'Below Average': 2.5,
    'Average': 3,
    'Good': 4,
    'Above Average': 4.5,
    'Excellent': 5,
    'Exceptional': 5.5
}

# Condition adjustment per level (scaled by market)
CONDITION_ADJUSTMENT_BASE = 35000  # $35K per condition level

# Basement finish values
BASEMENT_VALUES = {
    'Unfinished': 0,
    'None': 0,
    'Partially Finished': 5000,
    'Partially': 5000,
    'Finished': 15000,
    'Fully Finished': 15000,
    'With Suite': 25000,
    'Separate Entrance': 25000,
    'Apartment': 25000
}

# Price per square foot by major Ontario markets (2024 rates)
PRICE_PER_SQFT_BY_MARKET = {
    'Toronto': 500,
    'Mississauga': 450,
    'Vaughan': 480,
    'Markham': 470,
    'Richmond Hill': 460,
    'Oakville': 550,
    'Burlington': 450,
    'Brampton': 350,
    'Hamilton': 320,
    'Kitchener': 300,
    'Waterloo': 310,
    'London': 280,
    'Ottawa': 350,
    'Windsor': 250,
    'Barrie': 320,
    'Guelph': 330
}

# Default values
DEFAULT_PRICE_PER_SQFT = 400
BEDROOM_VALUE = 40000
BATHROOM_VALUE = 25000
GARAGE_SPACE_VALUE = 15000
ATTACHED_GARAGE_BONUS = 2000
LOT_SIZE_VALUE_PER_1000_SQFT = 5000


# ==================== UTILITY FUNCTIONS ====================

def _calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    
    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates
        
    Returns:
        Distance in kilometers
    """
    if not all([lat1, lon1, lat2, lon2]):
        return 0.0
    
    R = 6371  # Earth's radius in kilometers
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def _get_price_per_sqft(city: str, market_data: Dict[str, Any] = None) -> float:
    """
    Get price per square foot for a given market.
    
    Args:
        city: City name
        market_data: Optional market data dict with 'price_per_sqft' key
        
    Returns:
        Price per square foot
    """
    if market_data and 'price_per_sqft' in market_data:
        return float(market_data['price_per_sqft'])
    
    # Try to match city in our lookup table
    for market_city, price in PRICE_PER_SQFT_BY_MARKET.items():
        if market_city.lower() in city.lower():
            return price
    
    return DEFAULT_PRICE_PER_SQFT


def _normalize_condition(condition: str) -> str:
    """Normalize condition string to standard rating."""
    if not condition:
        return 'Average'
    
    condition_lower = condition.lower().strip()
    
    for standard_condition in CONDITION_RATINGS.keys():
        if standard_condition.lower() in condition_lower:
            return standard_condition
    
    return 'Average'


def _normalize_basement(basement: str) -> str:
    """Normalize basement string to standard type."""
    if not basement:
        return 'Unfinished'
    
    basement_lower = basement.lower().strip()
    
    # Check for suite indicators
    if any(indicator in basement_lower for indicator in ['suite', 'separate entrance', 'apartment']):
        return 'With Suite'
    
    # Check for finished indicators
    if any(indicator in basement_lower for indicator in ['full', 'finished', 'complete']):
        return 'Fully Finished'
    
    # Check for partially finished
    if any(indicator in basement_lower for indicator in ['partial', 'part']):
        return 'Partially Finished'
    
    return 'Unfinished'


# ==================== ADJUSTMENT CALCULATION FUNCTIONS ====================

def calculate_date_adjustment(
    comparable: ComparableProperty,
    market_data: Dict[str, Any],
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate time/market trend adjustment based on sale date.
    
    This adjustment accounts for market appreciation or depreciation between
    the comparable's sale date and the current valuation date (subject property).
    
    Per CUSPAP standards, this is the first adjustment applied as it brings
    the comparable's sale price to current market conditions.
    
    Args:
        comparable: Comparable property with sale_date and sale_price
        market_data: Dict containing market trend data
        subject_property: Subject property (used for current date reference)
        
    Returns:
        AdjustmentItem with date adjustment details
        
    Example:
        >>> # Comparable sold 3 months ago at $500K, market grew 5% since then
        >>> # Adjustment = $500K × 0.05 = +$25,000
        >>> adj = calculate_date_adjustment(comp, market_data, subject)
        >>> print(adj.amount)  # 25000.0
    """
    if not comparable.sale_date:
        logger.warning(f"No sale date for comparable {comparable.property_details.mls_id}")
        return AdjustmentItem(
            adjustment_category="date_of_sale",
            amount=0.0,
            percentage=0.0,
            reasoning="No sale date available for adjustment"
        )
    
    # Calculate months since sale
    current_date = datetime.now().date()
    sale_date = comparable.sale_date
    months_diff = (current_date.year - sale_date.year) * 12 + (current_date.month - sale_date.month)
    
    if months_diff <= 0:
        return AdjustmentItem(
            adjustment_category="date_of_sale",
            amount=0.0,
            percentage=0.0,
            reasoning="Sale is current (within 1 month), no time adjustment needed"
        )
    
    # Get market trend from market_data
    # Prefer 6-month trend, fallback to 12-month
    if 'price_trend_6month' in market_data and market_data['price_trend_6month']:
        annual_trend = market_data['price_trend_6month'] * 2  # Annualize 6-month trend
        trend_source = "6-month"
    elif 'price_trend_12month' in market_data and market_data['price_trend_12month']:
        annual_trend = market_data['price_trend_12month']
        trend_source = "12-month"
    else:
        # Default to conservative 3% annual appreciation (typical Canadian average)
        annual_trend = 0.03
        trend_source = "default Canadian average"
    
    # Calculate adjustment based on months elapsed
    monthly_trend = annual_trend / 12
    time_adjustment_percentage = monthly_trend * months_diff
    
    # Cap adjustment at ±20% to prevent unrealistic values
    time_adjustment_percentage = max(-0.20, min(0.20, time_adjustment_percentage))
    
    adjustment_amount = comparable.sale_price * time_adjustment_percentage
    
    # Determine market direction
    if time_adjustment_percentage > 0.01:
        market_direction = "appreciating"
    elif time_adjustment_percentage < -0.01:
        market_direction = "depreciating"
    else:
        market_direction = "stable"
    
    reasoning = (
        f"Time adjustment for {months_diff} month(s) since sale date {sale_date.strftime('%Y-%m-%d')}. "
        f"Market is {market_direction} at {abs(annual_trend)*100:.1f}% annually "
        f"based on {trend_source} trend. "
        f"Comparable sold at ${comparable.sale_price:,.0f}, "
        f"adjusted to current market: ${comparable.sale_price + adjustment_amount:,.0f}."
    )
    
    return AdjustmentItem(
        adjustment_category="date_of_sale",
        amount=round(adjustment_amount, 2),
        percentage=round(time_adjustment_percentage * 100, 2),
        reasoning=reasoning
    )


def calculate_location_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate location adjustment based on neighborhood and proximity.
    
    Location is one of the most significant value factors in real estate.
    This function compares neighborhoods and calculates distance-based penalties.
    
    Adjustment Scale:
    - Same street: $0
    - Same neighborhood: $0-$5,000
    - Different neighborhood, same city: $5,000-$25,000
    - Different city: $10,000-$50,000
    - Proximity penalty: -$500 per 0.5 km difference (if coordinates available)
    
    Args:
        comparable: Comparable property with location details
        subject_property: Subject property with location details
        
    Returns:
        AdjustmentItem with location adjustment details
        
    Example:
        >>> # Subject in premium Toronto neighborhood, comparable in average area
        >>> # Comparable 2km away, different neighborhood
        >>> adj = calculate_location_adjustment(comp, subject)
        >>> print(adj.amount)  # +15000 (neighborhood) + 2000 (distance) = +17000
    """
    subject_addr = subject_property.address.lower()
    comp_addr = comparable.property_details.address.lower()
    
    subject_city = subject_property.city.lower()
    comp_city = comparable.property_details.city.lower()
    
    base_adjustment = 0.0
    reasoning_parts = []
    
    # City comparison
    if subject_city != comp_city:
        # Different cities
        base_adjustment = 20000  # Significant adjustment for different cities
        reasoning_parts.append(
            f"Different cities: subject in {subject_property.city}, "
            f"comparable in {comparable.property_details.city} (+${base_adjustment:,.0f})"
        )
    else:
        # Same city - check street and neighborhood
        # Extract street name (simple heuristic)
        subject_street = ' '.join(subject_addr.split()[:3])
        comp_street = ' '.join(comp_addr.split()[:3])
        
        if subject_street == comp_street:
            # Same street
            base_adjustment = 0.0
            reasoning_parts.append("Same street location, no base adjustment")
        else:
            # Different streets/neighborhoods in same city
            # This is where detailed neighborhood analysis would go
            # For now, use moderate adjustment
            base_adjustment = 10000
            reasoning_parts.append(
                f"Different neighborhood within {subject_property.city} (+${base_adjustment:,.0f})"
            )
    
    # Calculate distance-based proximity penalty
    distance_penalty = 0.0
    if (subject_property.latitude and subject_property.longitude and
        comparable.property_details.latitude and comparable.property_details.longitude):
        
        distance = _calculate_distance_km(
            subject_property.latitude, subject_property.longitude,
            comparable.property_details.latitude, comparable.property_details.longitude
        )
        
        # Penalty: $500 per 0.5 km difference
        if distance > 0.5:
            distance_penalty = (distance / 0.5) * 500
            # Cap at $10,000 to prevent extreme values
            distance_penalty = min(distance_penalty, 10000)
            
            reasoning_parts.append(
                f"Distance penalty: {distance:.2f} km apart (-${distance_penalty:,.0f})"
            )
    
    # Net adjustment (positive if subject is in better location)
    # Note: We assume subject is in premium location for positive adjustments
    # In practice, this would use neighborhood scoring data
    total_adjustment = base_adjustment - distance_penalty
    
    if not reasoning_parts:
        reasoning_parts.append("Similar locations, minimal adjustment")
    
    reasoning = "Location adjustment: " + "; ".join(reasoning_parts) + "."
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (total_adjustment / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="location",
        amount=round(total_adjustment, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_property_type_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate adjustment for property type differences.
    
    Different property types have inherent value differences based on:
    - Privacy (detached > semi-detached > townhouse)
    - Maintenance responsibilities (single vs shared walls)
    - Land ownership (freehold vs condo)
    
    Value Hierarchy (Canadian market):
    1. Detached (1.00 - baseline)
    2. Link (0.82)
    3. Semi-Detached (0.85)
    4. Multiplex (0.80)
    5. Duplex (0.78)
    6. Triplex (0.76)
    7. Townhouse (0.75)
    8. Condo Apartment (0.70)
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        
    Returns:
        AdjustmentItem with property type adjustment
        
    Example:
        >>> # Subject: Detached, Comparable: Semi-Detached sold at $500K
        >>> # Adjustment = ($500K / 0.85) - $500K = +$88,235
        >>> adj = calculate_property_type_adjustment(comp, subject)
        >>> print(adj.amount)  # 88235.0
    """
    subject_type = subject_property.property_type
    comp_type = comparable.property_details.property_type
    
    if subject_type == comp_type:
        return AdjustmentItem(
            adjustment_category="property_type",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Same property type: {subject_type}, no adjustment needed"
        )
    
    # Get value factors
    subject_factor = PROPERTY_TYPE_FACTORS.get(subject_type, 0.85)
    comp_factor = PROPERTY_TYPE_FACTORS.get(comp_type, 0.85)
    
    if subject_factor == comp_factor:
        return AdjustmentItem(
            adjustment_category="property_type",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Different types ({comp_type} vs {subject_type}) but equivalent market value"
        )
    
    # Calculate adjustment
    # If subject is more valuable type, adjust comparable UP
    # If subject is less valuable type, adjust comparable DOWN
    adjustment_percentage = (subject_factor / comp_factor) - 1.0
    adjustment_amount = comparable.sale_price * adjustment_percentage
    
    if adjustment_amount > 0:
        direction = "upward"
        explanation = f"subject ({subject_type}) is more valuable than comparable ({comp_type})"
    else:
        direction = "downward"
        explanation = f"subject ({subject_type}) is less valuable than comparable ({comp_type})"
    
    reasoning = (
        f"Property type adjustment {direction}: comparable is {comp_type} "
        f"(factor: {comp_factor}), subject is {subject_type} (factor: {subject_factor}). "
        f"{explanation.capitalize()}. "
        f"Adjusting comparable from ${comparable.sale_price:,.0f} by {adjustment_percentage*100:+.1f}%."
    )
    
    return AdjustmentItem(
        adjustment_category="property_type",
        amount=round(adjustment_amount, 2),
        percentage=round(adjustment_percentage * 100, 2),
        reasoning=reasoning
    )


def calculate_condition_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails,
    market_data: Dict[str, Any] = None
) -> AdjustmentItem:
    """
    Calculate adjustment for property condition differences.
    
    Condition Ratings (ascending order):
    - Poor (1): Needs major repairs, deferred maintenance
    - Fair (2): Needs repairs, some deferred maintenance
    - Average (3): Normal wear and tear, adequate maintenance
    - Good (4): Well-maintained, minor updates
    - Excellent (5): Recently renovated, premium finishes
    
    Adjustment: ±$30,000 to ±$50,000 per condition level difference
    Scaled by average home price in market.
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        market_data: Optional market data for adjustment scaling
        
    Returns:
        AdjustmentItem with condition adjustment
        
    Example:
        >>> # Subject: Good (4), Comparable: Average (3)
        >>> # Difference: +1 level × $35K = +$35,000
        >>> adj = calculate_condition_adjustment(comp, subject, market_data)
        >>> print(adj.amount)  # 35000.0
    """
    subject_condition = _normalize_condition(subject_property.condition)
    comp_condition = _normalize_condition(comparable.property_details.condition)
    
    subject_rating = CONDITION_RATINGS.get(subject_condition, 3)
    comp_rating = CONDITION_RATINGS.get(comp_condition, 3)
    
    condition_diff = subject_rating - comp_rating
    
    if abs(condition_diff) < 0.5:
        return AdjustmentItem(
            adjustment_category="condition",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Similar condition: both rated as {subject_condition}"
        )
    
    # Scale adjustment by market
    base_adjustment = CONDITION_ADJUSTMENT_BASE
    
    if market_data and 'average_price' in market_data:
        avg_price = market_data['average_price']
        # Scale: if market avg is $800K vs $500K, adjust by 1.6x
        if avg_price > 0:
            scale_factor = avg_price / 500000
            # Cap scaling between 0.5x and 2.0x
            scale_factor = max(0.5, min(2.0, scale_factor))
            base_adjustment = CONDITION_ADJUSTMENT_BASE * scale_factor
    
    adjustment_amount = condition_diff * base_adjustment
    
    if condition_diff > 0:
        direction = "upward"
        explanation = f"subject is in {subject_condition} condition, better than comparable's {comp_condition}"
    else:
        direction = "downward"
        explanation = f"subject is in {subject_condition} condition, worse than comparable's {comp_condition}"
    
    reasoning = (
        f"Condition adjustment {direction}: {explanation}. "
        f"Difference of {abs(condition_diff):.1f} condition level(s) "
        f"at ${base_adjustment:,.0f} per level."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (adjustment_amount / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="condition",
        amount=round(adjustment_amount, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_size_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails,
    market_data: Dict[str, Any] = None
) -> AdjustmentItem:
    """
    Calculate adjustment for square footage differences.
    
    Size adjustment uses market-specific price per square foot rates.
    Adjustment = (subject_sqft - comparable_sqft) × price_per_sqft
    
    Market Rates (2024):
    - Toronto: $450-550/sqft
    - GTA suburbs: $350-450/sqft
    - Secondary markets: $250-350/sqft
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        market_data: Optional market data with price_per_sqft
        
    Returns:
        AdjustmentItem with size adjustment
        
    Example:
        >>> # Subject: 2,500 sqft, Comparable: 2,400 sqft
        >>> # Toronto rate: $500/sqft
        >>> # Adjustment = 100 sqft × $500 = +$50,000
        >>> adj = calculate_size_adjustment(comp, subject, market_data)
        >>> print(adj.amount)  # 50000.0
    """
    subject_sqft = subject_property.sqft
    comp_sqft = comparable.property_details.sqft
    
    if subject_sqft == 0 or comp_sqft == 0:
        return AdjustmentItem(
            adjustment_category="size",
            amount=0.0,
            percentage=0.0,
            reasoning="Square footage data unavailable for one or both properties"
        )
    
    sqft_diff = subject_sqft - comp_sqft
    
    # No adjustment if difference is less than 5%
    if abs(sqft_diff) / comp_sqft < 0.05:
        return AdjustmentItem(
            adjustment_category="size",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Similar size: subject {subject_sqft:,} sqft vs comparable {comp_sqft:,} sqft (< 5% difference)"
        )
    
    # Get market-specific price per sqft
    price_per_sqft = _get_price_per_sqft(subject_property.city, market_data)
    
    adjustment_amount = sqft_diff * price_per_sqft
    
    if sqft_diff > 0:
        direction = "larger"
        explanation = f"subject is {sqft_diff:,} sqft larger"
    else:
        direction = "smaller"
        explanation = f"subject is {abs(sqft_diff):,} sqft smaller"
    
    reasoning = (
        f"Size adjustment: {explanation} than comparable. "
        f"Subject: {subject_sqft:,} sqft, Comparable: {comp_sqft:,} sqft. "
        f"Adjustment at ${price_per_sqft:,.0f}/sqft ({subject_property.city} market rate)."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (adjustment_amount / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="size",
        amount=round(adjustment_amount, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_room_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate adjustment for bedroom and bathroom differences.
    
    Room count is a significant value factor. Adjustments only made for
    differences of ≥1 full room to avoid over-adjustment.
    
    Canadian Market Values (2024):
    - Per bedroom: $40,000
    - Per full bathroom: $25,000
    - Maximum: 2 room adjustments (prevents over-correction)
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        
    Returns:
        AdjustmentItem with room count adjustment
        
    Example:
        >>> # Subject: 4 bed / 3 bath, Comparable: 3 bed / 2 bath
        >>> # Adjustment = +$40K (bedroom) + $25K (bathroom) = +$65,000
        >>> adj = calculate_room_adjustment(comp, subject)
        >>> print(adj.amount)  # 65000.0
    """
    subject_beds = subject_property.bedrooms
    comp_beds = comparable.property_details.bedrooms
    
    subject_baths = subject_property.bathrooms
    comp_baths = comparable.property_details.bathrooms
    
    bed_diff = subject_beds - comp_beds
    bath_diff = subject_baths - comp_baths
    
    # Only adjust if difference >= 1 room
    bed_diff_int = int(bed_diff) if abs(bed_diff) >= 1 else 0
    bath_diff_int = int(bath_diff) if abs(bath_diff) >= 1 else 0
    
    if bed_diff_int == 0 and bath_diff_int == 0:
        return AdjustmentItem(
            adjustment_category="room_count",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Similar room count: {comp_beds} beds / {comp_baths} baths"
        )
    
    # Cap at 2 room adjustments maximum
    bed_diff_capped = max(-2, min(2, bed_diff_int))
    bath_diff_capped = max(-2, min(2, bath_diff_int))
    
    bedroom_adjustment = bed_diff_capped * BEDROOM_VALUE
    bathroom_adjustment = bath_diff_capped * BATHROOM_VALUE
    
    total_adjustment = bedroom_adjustment + bathroom_adjustment
    
    # Build reasoning
    reasoning_parts = []
    
    if bed_diff_capped != 0:
        if bed_diff_capped > 0:
            reasoning_parts.append(
                f"+{bed_diff_capped} bedroom(s) in subject (+${abs(bedroom_adjustment):,.0f})"
            )
        else:
            reasoning_parts.append(
                f"{bed_diff_capped} fewer bedroom(s) in subject (-${abs(bedroom_adjustment):,.0f})"
            )
    
    if bath_diff_capped != 0:
        if bath_diff_capped > 0:
            reasoning_parts.append(
                f"+{bath_diff_capped} bathroom(s) in subject (+${abs(bathroom_adjustment):,.0f})"
            )
        else:
            reasoning_parts.append(
                f"{bath_diff_capped} fewer bathroom(s) in subject (-${abs(bathroom_adjustment):,.0f})"
            )
    
    if abs(bed_diff_int) > 2 or abs(bath_diff_int) > 2:
        reasoning_parts.append("(adjustment capped at 2 rooms maximum)")
    
    reasoning = (
        f"Room count adjustment: subject has {subject_beds} beds / {subject_baths} baths, "
        f"comparable has {comp_beds} beds / {comp_baths} baths. "
        + "; ".join(reasoning_parts) + "."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (total_adjustment / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="room_count",
        amount=round(total_adjustment, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_lot_size_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate adjustment for lot size differences.
    
    Lot size significantly affects property value, especially for detached homes.
    Only adjust if difference > 10% to avoid minor variations.
    
    Adjustment: (sqft_difference / 1000) × $5,000
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        
    Returns:
        AdjustmentItem with lot size adjustment
        
    Example:
        >>> # Subject: 8,000 sqft lot, Comparable: 7,000 sqft lot
        >>> # Adjustment = 1,000 sqft / 1,000 × $5K = +$5,000
        >>> adj = calculate_lot_size_adjustment(comp, subject)
        >>> print(adj.amount)  # 5000.0
    """
    subject_lot = subject_property.lot_size
    comp_lot = comparable.property_details.lot_size
    
    # Convert to numeric if strings (e.g., "5000 sqft")
    try:
        if isinstance(subject_lot, str):
            subject_lot = float(''.join(filter(str.isdigit, subject_lot))) if subject_lot else None
        if isinstance(comp_lot, str):
            comp_lot = float(''.join(filter(str.isdigit, comp_lot))) if comp_lot else None
    except (ValueError, TypeError):
        subject_lot = None
        comp_lot = None
    
    if not subject_lot or not comp_lot:
        return AdjustmentItem(
            adjustment_category="lot_size",
            amount=0.0,
            percentage=0.0,
            reasoning="Lot size data unavailable for one or both properties"
        )
    
    lot_diff = subject_lot - comp_lot
    
    # Only adjust if difference > 10% of lot size
    if abs(lot_diff) / comp_lot < 0.10:
        return AdjustmentItem(
            adjustment_category="lot_size",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Similar lot sizes: {subject_lot:,.0f} sqft vs {comp_lot:,.0f} sqft (< 10% difference)"
        )
    
    # Calculate adjustment: $5K per 1,000 sqft difference
    adjustment_amount = (lot_diff / 1000) * LOT_SIZE_VALUE_PER_1000_SQFT
    
    if lot_diff > 0:
        direction = "larger"
    else:
        direction = "smaller"
    
    reasoning = (
        f"Lot size adjustment: subject lot is {abs(lot_diff):,.0f} sqft {direction} "
        f"than comparable ({subject_lot:,.0f} sqft vs {comp_lot:,.0f} sqft). "
        f"Adjustment at ${LOT_SIZE_VALUE_PER_1000_SQFT:,.0f} per 1,000 sqft."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (adjustment_amount / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="lot_size",
        amount=round(adjustment_amount, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_basement_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate adjustment for basement finish differences.
    
    Finished basements add significant livable space and value.
    
    Values:
    - Unfinished: $0 (baseline)
    - Partially Finished: +$5,000
    - Fully Finished: +$15,000
    - With Suite (separate entrance): +$25,000
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        
    Returns:
        AdjustmentItem with basement adjustment
        
    Example:
        >>> # Subject: Finished basement with suite
        >>> # Comparable: Unfinished basement
        >>> # Adjustment = $25,000 - $0 = +$25,000
        >>> adj = calculate_basement_adjustment(comp, subject)
        >>> print(adj.amount)  # 25000.0
    """
    subject_basement = _normalize_basement(subject_property.basement_finish)
    comp_basement = _normalize_basement(comparable.property_details.basement_finish)
    
    subject_value = BASEMENT_VALUES.get(subject_basement, 0)
    comp_value = BASEMENT_VALUES.get(comp_basement, 0)
    
    adjustment_amount = subject_value - comp_value
    
    if adjustment_amount == 0:
        return AdjustmentItem(
            adjustment_category="basement",
            amount=0.0,
            percentage=0.0,
            reasoning=f"Same basement finish: {subject_basement}"
        )
    
    if adjustment_amount > 0:
        direction = "better"
        explanation = f"subject has {subject_basement} basement, comparable has {comp_basement}"
    else:
        direction = "worse"
        explanation = f"subject has {subject_basement} basement, comparable has {comp_basement}"
    
    reasoning = (
        f"Basement adjustment: subject's basement is {direction}. "
        f"{explanation}. "
        f"Value difference: ${abs(adjustment_amount):,.0f}."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (adjustment_amount / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="basement",
        amount=round(adjustment_amount, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def calculate_garage_adjustment(
    comparable: ComparableProperty,
    subject_property: PropertyDetails
) -> AdjustmentItem:
    """
    Calculate adjustment for garage/parking differences.
    
    Parking is highly valued in Canadian urban markets.
    
    Values:
    - Per garage space: $15,000
    - Attached garage bonus: +$2,000 vs detached
    
    Args:
        comparable: Comparable property
        subject_property: Subject property
        
    Returns:
        AdjustmentItem with garage adjustment
        
    Example:
        >>> # Subject: 2-car attached garage
        >>> # Comparable: 1-car detached garage
        >>> # Adjustment = (2-1)×$15K + $2K (attached bonus) = +$17,000
        >>> adj = calculate_garage_adjustment(comp, subject)
        >>> print(adj.amount)  # 17000.0
    """
    subject_spaces = subject_property.parking_spaces
    comp_spaces = comparable.property_details.parking_spaces
    
    space_diff = subject_spaces - comp_spaces
    
    if space_diff == 0:
        # Check for attached vs detached difference
        subject_garage = subject_property.garage_type or ""
        comp_garage = comparable.property_details.garage_type or ""
        
        subject_attached = "attach" in subject_garage.lower()
        comp_attached = "attach" in comp_garage.lower()
        
        if subject_attached and not comp_attached:
            return AdjustmentItem(
                adjustment_category="garage_parking",
                amount=ATTACHED_GARAGE_BONUS,
                percentage=round((ATTACHED_GARAGE_BONUS / comparable.sale_price * 100), 2) if comparable.sale_price > 0 else 0.0,
                reasoning=f"Subject has attached garage, comparable has detached (+${ATTACHED_GARAGE_BONUS:,.0f} bonus)"
            )
        elif comp_attached and not subject_attached:
            return AdjustmentItem(
                adjustment_category="garage_parking",
                amount=-ATTACHED_GARAGE_BONUS,
                percentage=round((-ATTACHED_GARAGE_BONUS / comparable.sale_price * 100), 2) if comparable.sale_price > 0 else 0.0,
                reasoning=f"Subject has detached garage, comparable has attached (-${ATTACHED_GARAGE_BONUS:,.0f})"
            )
        else:
            return AdjustmentItem(
                adjustment_category="garage_parking",
                amount=0.0,
                percentage=0.0,
                reasoning=f"Same parking: {subject_spaces} space(s)"
            )
    
    base_adjustment = space_diff * GARAGE_SPACE_VALUE
    
    # Check for attached bonus
    attached_bonus = 0
    if space_diff != 0:
        subject_garage = subject_property.garage_type or ""
        comp_garage = comparable.property_details.garage_type or ""
        
        subject_attached = "attach" in subject_garage.lower()
        comp_attached = "attach" in comp_garage.lower()
        
        if subject_attached and not comp_attached:
            attached_bonus = ATTACHED_GARAGE_BONUS
        elif comp_attached and not subject_attached:
            attached_bonus = -ATTACHED_GARAGE_BONUS
    
    total_adjustment = base_adjustment + attached_bonus
    
    reasoning_parts = []
    
    if space_diff > 0:
        reasoning_parts.append(
            f"subject has {space_diff} more parking space(s) (+${abs(base_adjustment):,.0f})"
        )
    else:
        reasoning_parts.append(
            f"subject has {abs(space_diff)} fewer parking space(s) (-${abs(base_adjustment):,.0f})"
        )
    
    if attached_bonus > 0:
        reasoning_parts.append(f"attached garage bonus (+${attached_bonus:,.0f})")
    elif attached_bonus < 0:
        reasoning_parts.append(f"detached garage penalty (-${abs(attached_bonus):,.0f})")
    
    reasoning = (
        f"Garage/parking adjustment: subject has {subject_spaces} space(s), "
        f"comparable has {comp_spaces} space(s). "
        + "; ".join(reasoning_parts) + "."
    )
    
    percentage = 0.0
    if comparable.sale_price > 0:
        percentage = (total_adjustment / comparable.sale_price) * 100
    
    return AdjustmentItem(
        adjustment_category="garage_parking",
        amount=round(total_adjustment, 2),
        percentage=round(percentage, 2),
        reasoning=reasoning
    )


def reconcile_adjustments(
    adjustments: List[AdjustmentItem],
    comparable_sale_price: float
) -> Tuple[float, float, float, bool]:
    """
    Reconcile all adjustments and calculate final adjusted value with quality metrics.
    
    Per CUSPAP standards:
    - Gross adjustment = sum(|adjustment|) / comparable_price × 100
    - Net adjustment = sum(adjustment) / comparable_price × 100
    - Comparables with gross adjustment >15% are weak
    - Net adjustments typically 3-8% of property value
    
    Args:
        adjustments: List of AdjustmentItem objects
        comparable_sale_price: Original sale price of comparable
        
    Returns:
        Tuple of (adjusted_price, gross_adjustment_percent, net_adjustment_percent, is_weak_comparable)
        
    Example:
        >>> adjustments = [date_adj, location_adj, size_adj, ...]
        >>> adjusted_price, gross_pct, net_pct, is_weak = reconcile_adjustments(adjustments, 500000)
        >>> print(f"Adjusted: ${adjusted_price:,.0f}, Gross: {gross_pct:.1f}%, Net: {net_pct:.1f}%")
        Adjusted: $535,000, Gross: 12.5%, Net: 7.0%
    """
    if comparable_sale_price <= 0:
        logger.error("Invalid comparable sale price for reconciliation")
        return 0.0, 0.0, 0.0, True
    
    # Calculate totals
    total_dollar_adjustment = sum(adj.amount for adj in adjustments)
    total_absolute_adjustment = sum(abs(adj.amount) for adj in adjustments)
    
    # Calculate adjusted price
    adjusted_price = comparable_sale_price + total_dollar_adjustment
    
    # Calculate percentages
    gross_adjustment_percent = (total_absolute_adjustment / comparable_sale_price) * 100
    net_adjustment_percent = (total_dollar_adjustment / comparable_sale_price) * 100
    
    # Flag weak comparable (gross adjustment > 15%)
    is_weak_comparable = gross_adjustment_percent > 15.0
    
    # Log reconciliation details
    logger.info(f"Adjustment Reconciliation:")
    logger.info(f"  Original sale price: ${comparable_sale_price:,.0f}")
    logger.info(f"  Total adjustments: ${total_dollar_adjustment:+,.0f} ({net_adjustment_percent:+.2f}%)")
    logger.info(f"  Gross adjustment: {gross_adjustment_percent:.2f}%")
    logger.info(f"  Adjusted price: ${adjusted_price:,.0f}")
    
    if is_weak_comparable:
        logger.warning(
            f"⚠️  Weak comparable detected: gross adjustment {gross_adjustment_percent:.1f}% exceeds 15% threshold. "
            f"Consider using a more similar comparable property."
        )
    
    # Log individual adjustments
    logger.info(f"  Individual adjustments:")
    for adj in adjustments:
        if adj.amount != 0:
            logger.info(f"    • {adj.adjustment_category}: ${adj.amount:+,.0f} ({adj.percentage:+.2f}%)")
    
    return (
        round(adjusted_price, 2),
        round(gross_adjustment_percent, 2),
        round(net_adjustment_percent, 2),
        is_weak_comparable
    )


# ==================== COMPLETE VALUATION WORKFLOW ====================

def calculate_all_adjustments(
    comparable: ComparableProperty,
    subject_property: PropertyDetails,
    market_data: Dict[str, Any] = None
) -> List[AdjustmentItem]:
    """
    Calculate all standard adjustments for a comparable property.
    
    This is a convenience function that applies all adjustment calculations
    in the correct order per CUSPAP standards:
    1. Date of sale (market trend)
    2. Location
    3. Property type
    4. Condition
    5. Size (square footage)
    6. Room count
    7. Lot size
    8. Basement
    9. Garage/parking
    
    Args:
        comparable: Comparable property to adjust
        subject_property: Subject property being valued
        market_data: Optional market data for adjustment scaling
        
    Returns:
        List of AdjustmentItem objects
        
    Example:
        >>> adjustments = calculate_all_adjustments(comp, subject, market_data)
        >>> adjusted_price, gross_pct, net_pct, is_weak = reconcile_adjustments(
        ...     adjustments, comp.sale_price
        ... )
    """
    if not market_data:
        market_data = {}
    
    adjustments = []
    
    # 1. Date adjustment (applied first per CUSPAP)
    try:
        date_adj = calculate_date_adjustment(comparable, market_data, subject_property)
        adjustments.append(date_adj)
    except Exception as e:
        logger.error(f"Error calculating date adjustment: {e}")
    
    # 2. Location adjustment
    try:
        location_adj = calculate_location_adjustment(comparable, subject_property)
        adjustments.append(location_adj)
    except Exception as e:
        logger.error(f"Error calculating location adjustment: {e}")
    
    # 3. Property type adjustment
    try:
        property_type_adj = calculate_property_type_adjustment(comparable, subject_property)
        adjustments.append(property_type_adj)
    except Exception as e:
        logger.error(f"Error calculating property type adjustment: {e}")
    
    # 4. Condition adjustment
    try:
        condition_adj = calculate_condition_adjustment(comparable, subject_property, market_data)
        adjustments.append(condition_adj)
    except Exception as e:
        logger.error(f"Error calculating condition adjustment: {e}")
    
    # 5. Size adjustment
    try:
        size_adj = calculate_size_adjustment(comparable, subject_property, market_data)
        adjustments.append(size_adj)
    except Exception as e:
        logger.error(f"Error calculating size adjustment: {e}")
    
    # 6. Room count adjustment
    try:
        room_adj = calculate_room_adjustment(comparable, subject_property)
        adjustments.append(room_adj)
    except Exception as e:
        logger.error(f"Error calculating room adjustment: {e}")
    
    # 7. Lot size adjustment
    try:
        lot_adj = calculate_lot_size_adjustment(comparable, subject_property)
        adjustments.append(lot_adj)
    except Exception as e:
        logger.error(f"Error calculating lot size adjustment: {e}")
    
    # 8. Basement adjustment
    try:
        basement_adj = calculate_basement_adjustment(comparable, subject_property)
        adjustments.append(basement_adj)
    except Exception as e:
        logger.error(f"Error calculating basement adjustment: {e}")
    
    # 9. Garage/parking adjustment
    try:
        garage_adj = calculate_garage_adjustment(comparable, subject_property)
        adjustments.append(garage_adj)
    except Exception as e:
        logger.error(f"Error calculating garage adjustment: {e}")
    
    return adjustments


# ==================== MARKET VALUE ESTIMATION ====================

def estimate_market_value(
    subject_property: PropertyDetails,
    comparables: List[ComparableProperty],
    market_data: Dict[str, Any] = None
) -> ValuationResult:
    """
    Estimate market value using Direct Comparison Approach (CUSPAP standards).
    
    FIXED: Now uses actual SOLD PRICES from property history data, not list prices.
    Extracts soldPrice and soldDate from Repliers API 'history' field for accurate
    market valuations based on real comparable sales.
    
    This is the main valuation function that:
    1. Applies all adjustments to each comparable
    2. Filters out weak comparables
    3. Reconciles adjusted values using median approach
    4. Calculates confidence score and value range
    5. Generates comprehensive market analysis
    
    Per CUSPAP standards, this uses median reconciliation from 3-5 best
    comparables after removing weak matches (gross adjustment >15%).
    
    Args:
        subject_property: The property being valued
        comparables: List of 5-8 comparable SOLD properties (actual sale prices)
        market_data: Optional market data for adjustment scaling
        
    Returns:
        ValuationResult with estimated value, range, confidence, and analysis
        
    Raises:
        ValueError: If insufficient comparables (<2) provided
        
    Example:
        >>> result = estimate_market_value(subject, comparables, market_data)
        >>> print(f"Estimated Value: ${result.estimated_value:,.0f}")
        >>> print(f"Range: ${result.value_range[0]:,.0f} - ${result.value_range[1]:,.0f}")
        >>> print(f"Confidence: {result.confidence_score:.1%}")
    """
    
    if not comparables:
        raise ValueError("No comparables provided for valuation")
    
    if len(comparables) < 2:
        raise ValueError(f"Insufficient comparables: need at least 2, got {len(comparables)}")
    
    if not market_data:
        market_data = {}
    
    logger.info("=" * 80)
    logger.info("MARKET VALUE ESTIMATION - DIRECT COMPARISON APPROACH")
    logger.info("=" * 80)
    logger.info(f"Subject Property: {subject_property.address}, {subject_property.city}")
    logger.info(f"Property Type: {subject_property.property_type}")
    logger.info(f"Size: {subject_property.bedrooms} beds, {subject_property.bathrooms} baths, {subject_property.sqft:,} sqft")
    logger.info(f"Number of Comparables: {len(comparables)}")
    logger.info("")
    
    # ==================== STEP 1: ADJUST ALL COMPARABLES ====================
    
    comparable_analyses = []
    
    for i, comparable in enumerate(comparables, 1):
        logger.info(f"Analyzing Comparable #{i}: {comparable.property_details.mls_id}")
        logger.info(f"  Address: {comparable.property_details.address}")
        logger.info(f"  Sale Price: ${comparable.sale_price:,.0f}")
        logger.info(f"  Sale Date: {comparable.sale_date}")
        
        # Calculate all adjustments
        adjustments = calculate_all_adjustments(comparable, subject_property, market_data)
        
        # Reconcile adjustments
        adjusted_price, gross_pct, net_pct, is_weak = reconcile_adjustments(
            adjustments, comparable.sale_price
        )
        
        # Calculate distance (if coordinates available)
        distance_km = None
        if (subject_property.latitude and subject_property.longitude and
            comparable.property_details.latitude and comparable.property_details.longitude):
            distance_km = _calculate_distance_km(
                subject_property.latitude, subject_property.longitude,
                comparable.property_details.latitude, comparable.property_details.longitude
            )
        
        # Calculate recency score (0-100, 100 = most recent)
        if comparable.sale_date:
            days_old = (datetime.now().date() - comparable.sale_date).days
            recency_score = max(0, 100 - (days_old / 3.65))  # Lose 1 point per 3.65 days
        else:
            recency_score = 0
        
        # Calculate similarity score (0-100)
        similarity_score = 100 - gross_pct  # Higher gross adjustment = lower similarity
        
        comparable_analysis = {
            'comparable': comparable,
            'adjustments': adjustments,
            'adjusted_price': adjusted_price,
            'gross_adjustment_percent': gross_pct,
            'net_adjustment_percent': net_pct,
            'is_weak': is_weak,
            'distance_km': distance_km,
            'recency_score': recency_score,
            'similarity_score': similarity_score,
            'relevance_score': (recency_score * 0.4 + similarity_score * 0.6)  # Weighted score
        }
        
        comparable_analyses.append(comparable_analysis)
        
        logger.info(f"  Adjusted Price: ${adjusted_price:,.0f}")
        logger.info(f"  Gross Adjustment: {gross_pct:.1f}%")
        logger.info(f"  Quality: {'❌ WEAK' if is_weak else '✅ STRONG'}")
        logger.info(f"  Relevance Score: {comparable_analysis['relevance_score']:.1f}/100")
        logger.info("")
    
    # ==================== STEP 2: FILTER AND SORT COMPARABLES ====================
    
    # Separate strong and weak comparables
    strong_comparables = [ca for ca in comparable_analyses if not ca['is_weak']]
    weak_comparables = [ca for ca in comparable_analyses if ca['is_weak']]
    
    logger.info(f"Comparable Quality: {len(strong_comparables)} strong, {len(weak_comparables)} weak")
    
    # Decide which comparables to use
    if len(strong_comparables) >= 3:
        # Use only strong comparables if we have at least 3
        usable_comparables = strong_comparables
        logger.info(f"Using {len(usable_comparables)} strong comparables for reconciliation")
    elif len(strong_comparables) >= 2:
        # Use strong comparables + best weak ones
        usable_comparables = strong_comparables
        # Add best weak comparable(s) to reach 3 total
        weak_comparables.sort(key=lambda x: x['relevance_score'], reverse=True)
        needed = min(3 - len(strong_comparables), len(weak_comparables))
        usable_comparables.extend(weak_comparables[:needed])
        logger.warning(f"⚠️  Only {len(strong_comparables)} strong comparables. Including {needed} best weak comparable(s).")
    else:
        # Use all comparables (not ideal but best we can do)
        usable_comparables = comparable_analyses
        logger.warning(f"⚠️  Insufficient strong comparables. Using all {len(usable_comparables)} comparables.")
    
    # Sort by relevance (most relevant first)
    usable_comparables.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    # Select top 3-5 for final reconciliation
    final_comparables = usable_comparables[:min(5, len(usable_comparables))]
    
    logger.info(f"Final Reconciliation: Using top {len(final_comparables)} comparable(s)")
    for i, ca in enumerate(final_comparables, 1):
        logger.info(f"  {i}. MLS#{ca['comparable'].property_details.mls_id}: ${ca['adjusted_price']:,.0f} (relevance: {ca['relevance_score']:.1f})")
    logger.info("")
    
    # ==================== STEP 3: CALCULATE ESTIMATED VALUE ====================
    
    adjusted_prices = [ca['adjusted_price'] for ca in final_comparables]
    
    # Use median for estimated value (CUSPAP standard)
    adjusted_prices_sorted = sorted(adjusted_prices)
    n = len(adjusted_prices_sorted)
    
    if n % 2 == 0:
        estimated_value = (adjusted_prices_sorted[n//2 - 1] + adjusted_prices_sorted[n//2]) / 2
    else:
        estimated_value = adjusted_prices_sorted[n//2]
    
    # Calculate value range (min to max of adjusted prices)
    value_range = (min(adjusted_prices), max(adjusted_prices))
    
    # Ensure estimated value is within range
    estimated_value = max(value_range[0], min(value_range[1], estimated_value))
    
    logger.info(f"Estimated Market Value: ${estimated_value:,.0f}")
    logger.info(f"Value Range: ${value_range[0]:,.0f} - ${value_range[1]:,.0f}")
    logger.info(f"Range Width: ${value_range[1] - value_range[0]:,.0f} ({(value_range[1] - value_range[0]) / estimated_value * 100:.1f}%)")
    logger.info("")
    
    # ==================== STEP 4: CALCULATE CONFIDENCE SCORE ====================
    
    confidence_score = 0.70  # Base confidence: 70%
    confidence_breakdown = {
        'base_confidence': 0.70,
        'factors': []
    }
    
    # Factor 1: Number of strong comparables
    strong_count = len([ca for ca in final_comparables if not ca['is_weak']])
    if strong_count >= 3:
        comp_bonus = 0.15
        confidence_breakdown['factors'].append({
            'factor': 'strong_comparables',
            'description': f'{strong_count} strong comparables (≥3)',
            'impact': comp_bonus
        })
    elif strong_count == 2:
        comp_bonus = 0.10
        confidence_breakdown['factors'].append({
            'factor': 'strong_comparables',
            'description': f'{strong_count} strong comparables',
            'impact': comp_bonus
        })
    else:
        comp_bonus = 0.05
        confidence_breakdown['factors'].append({
            'factor': 'strong_comparables',
            'description': f'Only {strong_count} strong comparable(s)',
            'impact': comp_bonus
        })
    
    confidence_score += comp_bonus
    
    # Factor 2: Price variance (coefficient of variation)
    mean_price = sum(adjusted_prices) / len(adjusted_prices)
    variance = sum((p - mean_price) ** 2 for p in adjusted_prices) / len(adjusted_prices)
    std_dev = sqrt(variance)
    cv = (std_dev / mean_price) if mean_price > 0 else 1.0  # Coefficient of variation
    
    if cv < 0.05:  # Very low variance (<5%)
        variance_impact = 0.10
        variance_desc = 'Very low price variance (<5%)'
    elif cv < 0.10:  # Low variance (<10%)
        variance_impact = 0.05
        variance_desc = 'Low price variance (<10%)'
    elif cv < 0.15:  # Moderate variance
        variance_impact = 0.0
        variance_desc = 'Moderate price variance'
    else:  # High variance
        variance_impact = -0.10
        variance_desc = f'High price variance ({cv*100:.1f}%)'
    
    confidence_breakdown['factors'].append({
        'factor': 'price_variance',
        'description': variance_desc,
        'impact': variance_impact
    })
    confidence_score += variance_impact
    
    # Factor 3: Market stability
    if market_data.get('price_trend_3month') is not None:
        trend_3m = abs(market_data['price_trend_3month'])
        if trend_3m < 0.03:  # Very stable (<3% change)
            market_impact = 0.05
            market_desc = 'Stable market conditions'
        elif trend_3m < 0.08:  # Moderate change
            market_impact = 0.0
            market_desc = 'Moderate market movement'
        else:  # Volatile market
            market_impact = -0.05
            market_desc = f'Volatile market ({trend_3m*100:.1f}% change)'
        
        confidence_breakdown['factors'].append({
            'factor': 'market_stability',
            'description': market_desc,
            'impact': market_impact
        })
        confidence_score += market_impact
    
    # Factor 4: Data recency
    avg_recency = sum(ca['recency_score'] for ca in final_comparables) / len(final_comparables)
    if avg_recency > 90:  # Very recent sales
        recency_impact = 0.05
        recency_desc = 'Very recent comparable sales'
    elif avg_recency > 70:  # Recent sales
        recency_impact = 0.0
        recency_desc = 'Recent comparable sales'
    else:  # Older sales
        recency_impact = -0.05
        recency_desc = 'Older comparable sales'
    
    confidence_breakdown['factors'].append({
        'factor': 'data_recency',
        'description': recency_desc,
        'impact': recency_impact
    })
    confidence_score += recency_impact
    
    # Cap confidence between 0.50 and 0.95
    confidence_score = max(0.50, min(0.95, confidence_score))
    confidence_breakdown['final_confidence'] = confidence_score
    
    logger.info(f"Confidence Score: {confidence_score:.1%}")
    for factor_info in confidence_breakdown['factors']:
        logger.info(f"  • {factor_info['description']}: {factor_info['impact']:+.1%}")
    logger.info("")
    
    # ==================== STEP 5: GENERATE MARKET ANALYSIS ====================
    
    # Calculate price per sqft estimate
    price_per_sqft_estimate = estimated_value / subject_property.sqft if subject_property.sqft > 0 else 0
    
    # Determine market trend
    if market_data.get('price_trend_3month'):
        trend_3m = market_data['price_trend_3month']
        if trend_3m > 0.02:
            market_trend = 'positive'
            trend_desc = f'appreciating at {trend_3m*100:.1f}% (3-month)'
        elif trend_3m < -0.02:
            market_trend = 'negative'
            trend_desc = f'depreciating at {abs(trend_3m)*100:.1f}% (3-month)'
        else:
            market_trend = 'stable'
            trend_desc = 'stable with minimal change'
    else:
        market_trend = 'unknown'
        trend_desc = 'trend data unavailable'
    
    # Estimate absorption time (days to sell)
    if market_data.get('avg_days_on_market'):
        base_dom = market_data['avg_days_on_market']
    else:
        # Use average from comparables
        comp_doms = [c.days_on_market for c in comparables if c.days_on_market]
        base_dom = sum(comp_doms) / len(comp_doms) if comp_doms else 30
    
    # Adjust for property condition and pricing
    condition_factor = 1.0
    if subject_property.condition and 'excellent' in subject_property.condition.lower():
        condition_factor = 0.8  # Faster sale
    elif subject_property.condition and 'poor' in subject_property.condition.lower():
        condition_factor = 1.5  # Slower sale
    
    estimated_absorption_time = int(base_dom * condition_factor)
    
    # Build comparable data for market analysis
    comparable_data = []
    for ca in comparable_analyses:
        comp_data = {
            'mls_id': ca['comparable'].property_details.mls_id,
            'address': ca['comparable'].property_details.address,
            'sale_price': ca['comparable'].sale_price,
            'sale_date': ca['comparable'].sale_date.isoformat() if ca['comparable'].sale_date else None,
            'adjusted_price': ca['adjusted_price'],
            'gross_adjustment_percent': ca['gross_adjustment_percent'],
            'net_adjustment_percent': ca['net_adjustment_percent'],
            'is_weak': ca['is_weak'],
            'relevance_score': ca['relevance_score'],
            'distance_km': ca['distance_km'],
            'adjustments': [
                {
                    'category': adj.adjustment_category,
                    'amount': adj.amount,
                    'percentage': adj.percentage,
                    'reasoning': adj.reasoning
                }
                for adj in ca['adjustments'] if adj.amount != 0
            ]
        }
        comparable_data.append(comp_data)
    
    market_analysis = {
        'comparable_data': comparable_data,
        'price_per_sqft_estimate': round(price_per_sqft_estimate, 2),
        'market_trend': market_trend,
        'market_trend_description': trend_desc,
        'estimated_absorption_time': estimated_absorption_time,
        'confidence_breakdown': confidence_breakdown,
        'valuation_summary': {
            'total_comparables_reviewed': len(comparables),
            'strong_comparables': len(strong_comparables),
            'weak_comparables': len(weak_comparables),
            'comparables_used_final': len(final_comparables),
            'median_adjusted_price': estimated_value,
            'price_range_width_percent': round((value_range[1] - value_range[0]) / estimated_value * 100, 2),
            'valuation_date': datetime.now().date().isoformat()
        }
    }
    
    # Generate overall reasoning
    reasoning = (
        f"Market value estimated using Direct Comparison Approach with {len(final_comparables)} "
        f"comparable propert{'y' if len(final_comparables) == 1 else 'ies'}. "
        f"Median adjusted value: ${estimated_value:,.0f}. "
        f"Value range: ${value_range[0]:,.0f} - ${value_range[1]:,.0f} "
        f"({(value_range[1] - value_range[0]) / estimated_value * 100:.1f}% spread). "
        f"Market is currently {trend_desc}. "
        f"Confidence score of {confidence_score:.1%} based on {len(strong_comparables)} strong comparable(s), "
        f"{'low' if cv < 0.10 else 'moderate' if cv < 0.15 else 'high'} price variance, "
        f"and {'stable' if abs(market_data.get('price_trend_3month', 0)) < 0.03 else 'active'} market conditions. "
        f"Estimated time to sell: {estimated_absorption_time} days. "
        f"Analysis performed on {datetime.now().strftime('%Y-%m-%d')}."
    )
    
    logger.info("=" * 80)
    logger.info("VALUATION COMPLETE")
    logger.info("=" * 80)
    logger.info(f"Final Estimated Value: ${estimated_value:,.0f}")
    logger.info(f"Confidence: {confidence_score:.1%}")
    logger.info(f"Reasoning: {reasoning}")
    logger.info("=" * 80)
    
    # Create and return ValuationResult
    valuation_result = ValuationResult(
        subject_property=subject_property,
        comparables=comparables,
        estimated_value=round(estimated_value, 2),
        value_range=(round(value_range[0], 2), round(value_range[1], 2)),
        confidence_score=round(confidence_score, 2),  # Store as percentage (0-100)
        market_analysis=market_analysis,
        valuation_date=datetime.now().date(),
        methodology='Direct Comparison Approach (CUSPAP)',
        notes=reasoning
    )
    
    return valuation_result


# ==================== TESTING ====================

if __name__ == '__main__':
    print("=" * 80)
    print("CANADIAN REAL ESTATE VALUATION ENGINE - TEST")
    print("=" * 80)
    print()
    
    # Create test properties
    print("Creating test subject and comparable properties...")
    
    subject = PropertyDetails(
        mls_id="TEST-SUBJECT",
        address="123 Main Street",
        city="Toronto",
        province="ON",
        postal_code="M5H 2N2",
        property_type="Detached",
        bedrooms=4,
        bathrooms=3.0,
        sqft=2500,
        lot_size=5000,
        year_built=2010,
        condition="Good",
        style="2-Storey",
        basement_finish="Fully Finished",
        garage_type="Attached",
        parking_spaces=2,
        features=["Hardwood Floors", "Modern Kitchen", "Renovated Bathrooms"],
        latitude=43.6532,
        longitude=-79.3832
    )
    
    comparable = ComparableProperty(
        property_details=PropertyDetails(
            mls_id="TEST-COMP-001",
            address="125 Main Street",
            city="Toronto",
            province="ON",
            postal_code="M5H 2N3",
            property_type="Detached",
            bedrooms=3,
            bathrooms=2.0,
            sqft=2400,
            lot_size=4800,
            year_built=2008,
            condition="Average",
            style="2-Storey",
            basement_finish="Unfinished",
            garage_type="Detached",
            parking_spaces=1,
            features=["Hardwood Floors"],
            latitude=43.6535,
            longitude=-79.3835
        ),
        sale_price=800000,
        sale_date=(datetime.now() - timedelta(days=90)).date(),
        days_on_market=25
    )
    
    market_data = {
        'average_price': 950000,
        'price_per_sqft': 500,
        'price_trend_6month': 0.04,  # 4% appreciation over 6 months
        'avg_days_on_market': 20
    }
    
    print("✅ Test properties created")
    print()
    print("Subject Property:")
    print(f"  {subject.address}, {subject.city}")
    print(f"  {subject.property_type}: {subject.bedrooms} beds, {subject.bathrooms} baths, {subject.sqft:,} sqft")
    print()
    print("Comparable Property:")
    print(f"  {comparable.property_details.address}, {comparable.property_details.city}")
    print(f"  Sold: ${comparable.sale_price:,.0f} on {comparable.sale_date}")
    print(f"  {comparable.property_details.property_type}: {comparable.property_details.bedrooms} beds, {comparable.property_details.bathrooms} baths, {comparable.property_details.sqft:,} sqft")
    print()
    print("=" * 80)
    print("CALCULATING ADJUSTMENTS")
    print("=" * 80)
    print()
    
    # Calculate all adjustments
    adjustments = calculate_all_adjustments(comparable, subject, market_data)
    
    # Display individual adjustments
    for i, adj in enumerate(adjustments, 1):
        if adj.amount != 0:
            print(f"{i}. {adj.adjustment_category.upper().replace('_', ' ')}")
            print(f"   Amount: ${adj.amount:+,.0f} ({adj.percentage:+.2f}%)")
            print(f"   Reasoning: {adj.reasoning}")
            print()
    
    print("=" * 80)
    print("RECONCILIATION")
    print("=" * 80)
    print()
    
    # Reconcile adjustments
    adjusted_price, gross_pct, net_pct, is_weak = reconcile_adjustments(
        adjustments, comparable.sale_price
    )
    
    print(f"Original Sale Price:     ${comparable.sale_price:,.0f}")
    print(f"Adjusted Value:          ${adjusted_price:,.0f}")
    print(f"Total Adjustment:        ${adjusted_price - comparable.sale_price:+,.0f}")
    print()
    print(f"Gross Adjustment:        {gross_pct:.2f}% (sum of absolute values)")
    print(f"Net Adjustment:          {net_pct:+.2f}% (net change)")
    print()
    
    if is_weak:
        print("⚠️  WARNING: This is a weak comparable (gross adjustment > 15%)")
        print("    Consider finding more similar properties for better accuracy")
    else:
        print("✅ This is a strong comparable (gross adjustment ≤ 15%)")
    
    print()
    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


# ==================== NATURAL LANGUAGE EXPLANATION GENERATION ====================

def generate_valuation_explanation(
    valuation_result: ValuationResult,
    subject_price: Optional[float] = None,
    use_ai: bool = True
) -> str:
    """
    Generate a natural language explanation of the property valuation.
    
    Creates a professional, accessible explanation of the valuation results
    suitable for real estate listings, client reports, or chatbot responses.
    
    Integrates with:
    - LLaMA (HuggingFace) for AI-enhanced explanations
    - Claude API as fallback
    - GPT-4 as secondary fallback
    - Template-based generation if AI unavailable
    
    Args:
        valuation_result: Complete valuation result object
        subject_price: Optional asking/list price for comparison
        use_ai: Whether to use AI for enhanced explanations (default: True)
        
    Returns:
        Professional 300-500 word explanation string
        
    Example:
        >>> explanation = generate_valuation_explanation(result, subject_price=950000)
        >>> print(explanation)
        Based on comparable market analysis of 5 sold properties in Toronto...
    """
    logger.info("Generating valuation explanation...")
    
    # Extract key data from valuation result
    subject = valuation_result.subject_property
    estimated_value = valuation_result.estimated_value
    value_range = valuation_result.value_range
    confidence = valuation_result.confidence_score
    comparables = valuation_result.comparables
    market_analysis = valuation_result.market_analysis
    valuation_date = valuation_result.valuation_date
    
    # Determine market trend
    market_trend = market_analysis.get('market_trend', 'stable')
    price_per_sqft = market_analysis.get('price_per_sqft_estimate', 0)
    absorption_time = market_analysis.get('estimated_absorption_time', 30)
    
    # Try AI-enhanced generation first if enabled
    if use_ai:
        try:
            ai_explanation = _generate_ai_explanation(
                valuation_result, subject_price
            )
            if ai_explanation:
                logger.info("Successfully generated AI-enhanced explanation")
                return ai_explanation
        except Exception as e:
            logger.warning(f"AI explanation generation failed: {e}. Falling back to template.")
    
    # Fallback to template-based generation
    logger.info("Using template-based explanation generation")
    return _generate_template_explanation(
        subject, estimated_value, value_range, confidence,
        comparables, market_analysis, valuation_date, subject_price
    )


def _generate_ai_explanation(
    valuation_result: ValuationResult,
    subject_price: Optional[float] = None
) -> Optional[str]:
    """
    Generate AI-enhanced explanation using LLaMA, Claude, or GPT-4.
    
    Tries in order:
    1. Local LLaMA (via HuggingFace)
    2. Claude API (Anthropic)
    3. GPT-4 API (OpenAI)
    
    Returns None if all fail.
    """
    # Try LLaMA first (your existing integration)
    try:
        from services.qwen_omni_service import generate_text_response
        
        prompt = _build_ai_prompt(valuation_result, subject_price)
        response = generate_text_response(prompt, max_tokens=600)
        
        if response and len(response) > 100:
            logger.info("Generated explanation using LLaMA")
            return response
    except Exception as e:
        logger.debug(f"LLaMA not available: {e}")
    
    # Try Claude API
    try:
        response = _generate_claude_explanation(valuation_result, subject_price)
        if response:
            logger.info("Generated explanation using Claude")
            return response
    except Exception as e:
        logger.debug(f"Claude API not available: {e}")
    
    # Try GPT-4 API
    try:
        response = _generate_gpt4_explanation(valuation_result, subject_price)
        if response:
            logger.info("Generated explanation using GPT-4")
            return response
    except Exception as e:
        logger.debug(f"GPT-4 API not available: {e}")
    
    return None


def _build_ai_prompt(
    valuation_result: ValuationResult,
    subject_price: Optional[float] = None
) -> str:
    """Build comprehensive prompt for AI models."""
    subject = valuation_result.subject_property
    estimated_value = valuation_result.estimated_value
    value_range = valuation_result.value_range
    confidence = valuation_result.confidence_score
    comparables = valuation_result.comparables
    market_analysis = valuation_result.market_analysis
    
    # Build comparables summary
    comp_list = []
    for i, comp in enumerate(comparables[:3], 1):
        comp_list.append(
            f"  {i}. {comp.property_details.address}: "
            f"Sold ${comp.sale_price:,.0f} on {comp.sale_date.strftime('%B %Y')}"
        )
    comparables_text = "\n".join(comp_list)
    
    # Build key adjustments summary
    comparable_data = market_analysis.get('comparable_data', [])
    adj_list = []
    if comparable_data:
        # Get adjustments from first comparable (they all have similar patterns)
        for adj_item in comparable_data[0].get('adjustments', [])[:3]:
            if adj_item.amount != 0:
                adj_list.append(
                    f"  • {adj_item.adjustment_category}: ${adj_item.amount:+,.0f}"
                )
    adjustments_text = "\n".join(adj_list) if adj_list else "  • Minimal adjustments needed"
    
    # Price comparison
    price_comparison = ""
    if subject_price:
        diff_pct = ((subject_price - estimated_value) / estimated_value) * 100
        if diff_pct > 5:
            price_comparison = f"The asking price of ${subject_price:,.0f} is {diff_pct:.1f}% above estimated market value."
        elif diff_pct < -5:
            price_comparison = f"The asking price of ${subject_price:,.0f} represents a {abs(diff_pct):.1f}% discount to estimated market value."
        else:
            price_comparison = f"The asking price of ${subject_price:,.0f} is well-aligned with estimated market value."
    
    # Market trend description
    market_trend = market_analysis.get('market_trend', 'stable')
    if market_trend == 'positive':
        trend_desc = "appreciating market"
    elif market_trend == 'negative':
        trend_desc = "softening market"
    else:
        trend_desc = "stable market"
    
    prompt = f"""Generate a professional real estate valuation explanation (350-450 words).

PROPERTY DETAILS:
Address: {subject.address}, {subject.city}, {subject.province}
Type: {subject.property_type}
Size: {subject.bedrooms} bed, {subject.bathrooms} bath, {subject.sqft:,} sqft
{f"Asking Price: ${subject_price:,.0f}" if subject_price else ""}

VALUATION RESULTS:
Estimated Market Value: ${estimated_value:,.0f}
Value Range: ${value_range[0]:,.0f} - ${value_range[1]:,.0f}
Confidence Score: {confidence:.0f}%
Analysis Date: {valuation_result.valuation_date.strftime('%B %d, %Y')}

TOP COMPARABLE PROPERTIES:
{comparables_text}

KEY ADJUSTMENTS MADE:
{adjustments_text}

MARKET CONDITIONS:
Market Trend: {trend_desc}
Estimated Days on Market: {market_analysis.get('estimated_absorption_time', 30)} days
Price per Sqft: ${market_analysis.get('price_per_sqft_estimate', 0):.0f}

{price_comparison}

Please write a professional explanation that:
1. Opens with a clear valuation summary
2. {f"Compares the asking price to estimated value" if subject_price else "Explains the valuation approach"}
3. Describes the comparable properties analysis
4. Highlights key value drivers and adjustments
5. Assesses current market conditions and future appreciation potential
6. Includes confidence assessment and any limitations

Use professional but accessible language suitable for homebuyers and real estate clients.
Format with clear paragraphs for easy reading."""

    return prompt


def _generate_claude_explanation(
    valuation_result: ValuationResult,
    subject_price: Optional[float] = None
) -> Optional[str]:
    """Generate explanation using Claude API."""
    try:
        from anthropic import Anthropic
        
        # Get API key from environment or config
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            return None
        
        client = Anthropic(api_key=api_key)
        prompt = _build_ai_prompt(valuation_result, subject_price)
        
        message = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=800,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract text from response
        if message.content and len(message.content) > 0:
            return message.content[0].text
        
        return None
        
    except ImportError:
        logger.debug("Anthropic library not installed")
        return None
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return None


def _generate_gpt4_explanation(
    valuation_result: ValuationResult,
    subject_price: Optional[float] = None
) -> Optional[str]:
    """Generate explanation using GPT-4 API."""
    try:
        import openai
        
        # Get API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return None
        
        openai.api_key = api_key
        prompt = _build_ai_prompt(valuation_result, subject_price)
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional real estate appraiser writing valuation explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        
        return None
        
    except ImportError:
        logger.debug("OpenAI library not installed")
        return None
    except Exception as e:
        logger.error(f"GPT-4 API error: {e}")
        return None


def _generate_template_explanation(
    subject: PropertyDetails,
    estimated_value: float,
    value_range: Tuple[float, float],
    confidence: float,
    comparables: List[ComparableProperty],
    market_analysis: Dict[str, Any],
    valuation_date: datetime,
    subject_price: Optional[float] = None
) -> str:
    """
    Generate template-based explanation (fallback when AI unavailable).
    
    Uses structured templates with dynamic content insertion.
    """
    # Intro paragraph
    num_comps = len(comparables)
    city_name = subject.city
    
    # Calculate months of sales data
    if comparables:
        oldest_sale = min(comp.sale_date for comp in comparables)
        months_span = (datetime.now().date() - oldest_sale).days // 30
    else:
        months_span = 6
    
    explanation_parts = []
    
    # 1. Valuation Summary
    explanation_parts.append(
        f"Based on comparable market analysis of {num_comps} similar **active listings** in "
        f"{city_name} from the past {months_span} months, we estimate "
        f"{subject.address} is worth approximately ${estimated_value:,.0f} "
        f"as of {valuation_date.strftime('%B %d, %Y')}. "
        f"The estimated value range is ${value_range[0]:,.0f} to ${value_range[1]:,.0f}, "
        f"representing normal market variance for properties of this type."
    )
    
    # 1a. Important Disclaimer about Active Listings
    explanation_parts.append(
        f"⚠️ **Important Note:** This valuation is based on current **asking prices** of similar "
        f"properties on the market, not actual sold prices. Active listing prices may be higher "
        f"than what properties ultimately sell for. The actual market value could be 5-10% lower "
        f"depending on negotiation and market conditions. For a more accurate valuation based on "
        f"recent sold data, please consult a licensed real estate appraiser."
    )
    
    # 2. Price Comparison (if asking price provided)
    if subject_price:
        diff_amount = subject_price - estimated_value
        diff_pct = (diff_amount / estimated_value) * 100
        
        if diff_pct > 10:
            explanation_parts.append(
                f"The asking price of ${subject_price:,.0f} appears {abs(diff_pct):.1f}% "
                f"above current market value (${abs(diff_amount):,.0f} premium). "
                f"This pricing may result in extended market time or require price adjustment "
                f"to attract buyers. Properties priced above market typically take "
                f"{int(market_analysis.get('estimated_absorption_time', 30) * 1.5)} days or more to sell."
            )
        elif diff_pct > 5:
            explanation_parts.append(
                f"The asking price of ${subject_price:,.0f} is {abs(diff_pct):.1f}% above "
                f"estimated market value. This slight premium may be justified for properties "
                f"with exceptional features or in highly desirable micro-locations. "
                f"Expect {market_analysis.get('estimated_absorption_time', 30)} to "
                f"{int(market_analysis.get('estimated_absorption_time', 30) * 1.2)} days on market."
            )
        elif diff_pct < -10:
            explanation_parts.append(
                f"The asking price of ${subject_price:,.0f} represents a {abs(diff_pct):.1f}% "
                f"discount to estimated market value (${abs(diff_amount):,.0f} savings). "
                f"This presents excellent value for buyers and suggests the property may "
                f"generate strong interest. Properties priced below market typically receive "
                f"multiple offers and sell within {int(market_analysis.get('estimated_absorption_time', 30) * 0.6)} days."
            )
        elif diff_pct < -5:
            explanation_parts.append(
                f"The asking price of ${subject_price:,.0f} is {abs(diff_pct):.1f}% below "
                f"estimated market value, representing good value for buyers. This competitive "
                f"pricing should attract strong buyer interest and may result in a quicker sale."
            )
        else:
            explanation_parts.append(
                f"The asking price of ${subject_price:,.0f} is well-aligned with estimated "
                f"market value (within {abs(diff_pct):.1f}%). This fair market pricing should "
                f"result in steady buyer interest and a sale within the typical "
                f"{market_analysis.get('estimated_absorption_time', 30)} day market absorption period."
            )
    
    # 3. Comparable Properties Analysis
    top_comps = comparables[:3]
    comp_descriptions = []
    for comp in top_comps:
        comp_prop = comp.property_details
        comp_descriptions.append(
            f"{comp_prop.address} (${comp.sale_price:,.0f}, "
            f"{comp.sale_date.strftime('%b %Y')})"
        )
    
    # Handle empty comparables list for simple valuation method
    if comp_descriptions:
        comp_text = ", ".join(comp_descriptions[:-1]) + ", and " + comp_descriptions[-1] if len(comp_descriptions) > 1 else comp_descriptions[0]
        
        explanation_parts.append(
            f"Our analysis examined {num_comps} comparable active listings, with primary focus on "
            f"{comp_text}. These properties were selected based on similarity in property type, "
            f"size, location, and recent listing date. "
        )
    else:
        # Simple valuation without comparables
        explanation_parts.append(
            f"This valuation uses a market-adjusted approach based on current listing price, "
            f"property characteristics, days on market, and local market conditions in {subject.city}. "
        )
    
    # 4. Key Adjustments and Value Drivers
    comparable_data = market_analysis.get('comparable_data', [])
    if comparable_data and comparable_data[0].get('adjustments'):
        major_adjustments = []
        for adj in comparable_data[0]['adjustments']:
            # Handle both dict and AdjustmentItem objects
            adj_amount = adj.get('amount') if isinstance(adj, dict) else adj.amount
            adj_category = adj.get('adjustment_category') if isinstance(adj, dict) else adj.adjustment_category
            
            if adj_category and abs(adj_amount) > 10000:  # Only mention significant adjustments
                adj_type = adj_category.replace('_', ' ').title()
                if adj_amount > 0:
                    major_adjustments.append(f"superior {adj_type.lower()}")
                else:
                    major_adjustments.append(f"lesser {adj_type.lower()}")
        
        if major_adjustments:
            adj_text = ", ".join(major_adjustments[:2])
            explanation_parts.append(
                f"Key value adjustments were made for {adj_text} relative to the comparable properties. "
                f"These adjustments follow Canadian appraisal standards (CUSPAP) and reflect current "
                f"{city_name} market rates for property features and characteristics."
            )
    
    # 5. Market Conditions and Appreciation
    market_trend = market_analysis.get('market_trend', 'stable')
    price_per_sqft = market_analysis.get('price_per_sqft_estimate', 0)
    
    if market_trend == 'positive':
        trend_desc = "appreciating"
        outlook = "continue upward"
        appreciation_range = "3-5%"
    elif market_trend == 'negative':
        trend_desc = "softening"
        outlook = "stabilize"
        appreciation_range = "0-2%"
    else:
        trend_desc = "stable"
        outlook = "remain steady"
        appreciation_range = "2-3%"
    
    explanation_parts.append(
        f"The {city_name} market is currently {trend_desc}, with properties averaging "
        f"${price_per_sqft:.0f} per square foot and typical market time of "
        f"{market_analysis.get('estimated_absorption_time', 30)} days. "
        f"Based on recent trends, we expect the market to {outlook} over the next 12 months, "
        f"with potential appreciation of {appreciation_range} for well-maintained properties "
        f"in desirable locations. This property's {subject.property_type.lower()} style and "
        f"{subject.bedrooms}-bedroom configuration align well with current buyer preferences "
        f"in the market."
    )
    
    # 6. Confidence and Limitations
    if confidence >= 90:
        confidence_desc = "very high confidence"
        reliability = "highly reliable"
    elif confidence >= 80:
        confidence_desc = "high confidence"
        reliability = "reliable"
    elif confidence >= 70:
        confidence_desc = "good confidence"
        reliability = "reasonably reliable"
    else:
        confidence_desc = "moderate confidence"
        reliability = "indicative"
    
    explanation_parts.append(
        f"This valuation has {confidence_desc} ({confidence:.0f}%) based on {num_comps} "
        f"comparable sales with minimal adjustments required. The estimate is {reliability} "
        f"as of {valuation_date.strftime('%B %d, %Y')}. Please note that this analysis is "
        f"based on historical sales data and current market trends. Actual sale price may vary "
        f"based on specific buyer motivations, property condition details not captured in MLS data, "
        f"negotiation dynamics, and market conditions at time of sale. For official appraisal "
        f"purposes, we recommend engaging a certified Canadian residential appraiser."
    )
    
    # Join all parts with proper spacing
    return "\n\n".join(explanation_parts)


# ==================== TESTING ====================
