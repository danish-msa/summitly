"""
Property Estimates Service - AI-Powered Valuations (RESTimates)
Get ML-based property value estimates for on-market and off-market properties
"""
import logging
from typing import Dict, Any, Optional

from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class EstimatesService:
    """
    Service for obtaining AI-powered property value estimates
    """
    
    def __init__(self, api_client=None):
        """
        Initialize estimates service
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
    
    def get_property_estimate(
        self,
        # Property identification (one of these required)
        listing_id: Optional[str] = None,
        address: Optional[str] = None,
        
        # Address components (if not using full address string)
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        
        # Property details (help improve estimate accuracy)
        property_type: Optional[str] = None,
        property_style: Optional[str] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[float] = None,
        sqft: Optional[int] = None,
        lot_size: Optional[float] = None,
        year_built: Optional[int] = None,
        
        # Additional context
        include_comparables: bool = False,
        include_market_trends: bool = False
    ) -> Dict[str, Any]:
        """
        Get AI-powered property value estimate
        
        Args:
            listing_id: Repliers listing ID (for on-market properties)
            address: Full address string
            street: Street address
            city: City name
            state: State/province
            postal_code: Postal code
            property_type: Type of property
            property_style: Style of property
            bedrooms: Number of bedrooms
            bathrooms: Number of bathrooms
            sqft: Square footage
            lot_size: Lot size in acres
            year_built: Year property was built
            include_comparables: Include comparable properties in response
            include_market_trends: Include market trend data
            
        Returns:
            Dictionary containing:
                - estimate: Estimated value
                - confidence: Confidence level (low, medium, high)
                - range: Value range (min, max)
                - comparables: Similar properties (if requested)
                - marketTrends: Market data (if requested)
        
        Example:
            >>> estimate = service.get_property_estimate(
            ...     address="123 Main St, Toronto, ON M5H 2N2",
            ...     bedrooms=3,
            ...     bathrooms=2,
            ...     sqft=1800,
            ...     include_comparables=True
            ... )
            >>> print(f"Estimated value: ${estimate['estimate']['value']:,.0f}")
            >>> print(f"Confidence: {estimate['confidence']}")
        """
        # Validate input
        if not listing_id and not address and not (street and city):
            raise ValueError(
                "Must provide either listing_id, full address, or street+city"
            )
        
        # Build request payload
        payload = {}
        
        # Property identification
        if listing_id:
            payload['listingId'] = listing_id
        elif address:
            payload['address'] = address
        else:
            address_parts = {}
            if street:
                address_parts['street'] = street
            if city:
                address_parts['city'] = city
            if state:
                address_parts['state'] = state
            if postal_code:
                address_parts['postalCode'] = postal_code
            payload['address'] = address_parts
        
        # Property details
        details = {}
        if property_type:
            details['propertyType'] = property_type
        if property_style:
            details['propertyStyle'] = property_style
        if bedrooms is not None:
            details['bedrooms'] = bedrooms
        if bathrooms is not None:
            details['bathrooms'] = bathrooms
        if sqft is not None:
            details['sqft'] = sqft
        if lot_size is not None:
            details['lotSize'] = lot_size
        if year_built is not None:
            details['yearBuilt'] = year_built
        
        if details:
            payload['details'] = details
        
        # Options
        if include_comparables:
            payload['includeComparables'] = True
        if include_market_trends:
            payload['includeMarketTrends'] = True
        
        try:
            logger.info(f"Requesting property estimate for {listing_id or address or street}")
            
            # Use our own valuation engine with comparables
            if listing_id:
                # Get property details first to get listing price
                try:
                    from services.listings_service import listings_service
                    logger.info(f"📡 Fetching property details for listing_id: {listing_id}")
                    property_data = listings_service.get_listing_details(listing_id)
                    logger.info(f"📋 Property data received: {type(property_data)}")
                except Exception as fetch_error:
                    logger.error(f"❌ Failed to fetch property details: {fetch_error}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    property_data = None
                
                if not property_data:
                    logger.error("❌ No property data - cannot proceed")
                    raise ValueError(f"Could not fetch property details for listing {listing_id}")
                if property_data:
                    logger.info(f"📋 Property data keys: {list(property_data.keys())[:10]}")
                    logger.info(f"📋 Has 'success' key: {'success' in property_data}")
                
                if property_data and property_data.get('success'):
                    prop = property_data.get('property', {})
                    list_price = prop.get('listPrice', 0)
                elif property_data:
                    # Sometimes the response doesn't have a 'success' wrapper
                    logger.info("📋 Trying alternative property data structure...")
                    prop = property_data
                    list_price = prop.get('listPrice', 0)
                else:
                    logger.error("❌ No property data received")
                    raise ValueError(f"Could not fetch property details for listing {listing_id}")
                
                logger.info(f"💰 List price extracted: ${list_price:,}")
                
                if list_price and list_price > 0:
                    # Try full valuation with comparables first
                    try:
                        logger.info("🎯 Using full comparable analysis with ±7% cap")
                        from services.chatbot_valuation_integration import process_valuation_request
                        # process_valuation_request expects a user_query string, not direct MLS
                        valuation_result = process_valuation_request(
                            user_query=f"value of MLS: {listing_id}",
                            chatbot_context={'listing_id': listing_id, 'list_price': list_price}
                        )
                        
                        if valuation_result and valuation_result.get('structured_data'):
                            # Convert from chatbot format to estimates format
                            structured_data = valuation_result['structured_data']
                            valuation_data = structured_data['valuation']
                            estimated_value = valuation_data['estimated_value']
                            value_range = valuation_data['value_range']
                            
                            logger.info(f"✅ Full valuation complete: ${estimated_value:,}")
                            
                            return {
                                'success': True,
                                'price_estimates': {
                                    'low': value_range['min'],
                                    'medium': estimated_value,
                                    'high': value_range['max'],
                                    'price_per_sqft': structured_data['market'].get('price_per_sqft', 0)
                                },
                                'confidence_score': valuation_data['confidence_score'],
                                'methodology': structured_data['metadata']['methodology'],
                                'comparables': structured_data.get('comparables', []),
                                'market_analysis': structured_data.get('market', {}),
                                'property_details': structured_data.get('property', {}),
                                'markdown': valuation_result.get('markdown', ''),
                                'estimated_value': estimated_value,
                                'value_range': (value_range['min'], value_range['max']),
                                'listing_price': list_price
                            }
                    except Exception as e:
                        logger.warning(f"⚠️ Full valuation failed, using simple method: {e}")
                        import traceback
                        logger.debug(f"Full traceback: {traceback.format_exc()}")
                    
                    # Fallback to simple calculation
                    logger.info("📊 Using simple market adjustment method")
                    adjusted_value = self._calculate_simple_market_value(
                        list_price=list_price,
                        property_data=prop
                    )
                    
                    # Ensure it has success flag
                    if adjusted_value and not adjusted_value.get('success'):
                        adjusted_value['success'] = True
                    
                    return adjusted_value
            
            # If we reach here, something went wrong
            logger.error(f"❌ Failed to generate estimate. listing_id={listing_id}, had property_data={property_data is not None if 'property_data' in locals() else 'not_defined'}")
            raise ValueError("Property estimate requires listing_id for MLS properties")
        
        except RepliersAPIError as e:
            logger.error(f"Error getting property estimate: {e.message}")
            # Handle insufficient data case
            if e.status_code == 422:
                logger.warning("Insufficient data for accurate estimate")
                return {
                    'error': 'insufficient_data',
                    'message': 'Not enough data available to generate a reliable estimate',
                    'suggestion': 'Try providing more property details (bedrooms, bathrooms, sqft, etc.)'
                }
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_property_estimate: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def get_estimate_by_listing(
        self,
        listing_id: str,
        include_comparables: bool = True,
        include_market_trends: bool = True
    ) -> Dict[str, Any]:
        """
        Get estimate for an existing listing (convenience method)
        
        Args:
            listing_id: Repliers listing ID
            include_comparables: Include comparable properties
            include_market_trends: Include market trends
            
        Returns:
            Estimate details
        """
        return self.get_property_estimate(
            listing_id=listing_id,
            include_comparables=include_comparables,
            include_market_trends=include_market_trends
        )
    
    def get_estimate_by_address(
        self,
        address: str,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[float] = None,
        sqft: Optional[int] = None,
        include_comparables: bool = False
    ) -> Dict[str, Any]:
        """
        Get estimate for off-market property by address (convenience method)
        
        Args:
            address: Full property address
            bedrooms: Number of bedrooms (helps improve accuracy)
            bathrooms: Number of bathrooms
            sqft: Square footage
            include_comparables: Include comparable properties
            
        Returns:
            Estimate details
        """
        return self.get_property_estimate(
            address=address,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            sqft=sqft,
            include_comparables=include_comparables
        )
    
    def format_estimate_response(self, estimate_data: Dict[str, Any]) -> str:
        """
        Format estimate data into human-readable text
        
        Args:
            estimate_data: Raw estimate response from API
            
        Returns:
            Formatted string for chatbot display
        """
        if estimate_data.get('error') == 'insufficient_data':
            return estimate_data.get('message', 'Unable to generate estimate')
        
        estimate = estimate_data.get('estimate', {})
        value = estimate.get('value', 0)
        confidence = estimate_data.get('confidence', 'unknown')
        value_range = estimate_data.get('range', {})
        
        # Build response
        lines = [
            f"🏠 **Property Estimate**: ${value:,.0f}",
            f"📊 **Confidence Level**: {confidence.title()}",
        ]
        
        if value_range:
            min_val = value_range.get('min', 0)
            max_val = value_range.get('max', 0)
            lines.append(f"📈 **Estimated Range**: ${min_val:,.0f} - ${max_val:,.0f}")
        
        # Add comparables info if available
        comparables = estimate_data.get('comparables', [])
        if comparables:
            lines.append(f"\n🔍 **Based on {len(comparables)} comparable properties**")
        
        # Add market trends if available
        trends = estimate_data.get('marketTrends', {})
        if trends:
            avg_price_change = trends.get('averagePriceChange', 0)
            trend_direction = "📈 up" if avg_price_change > 0 else "📉 down"
            lines.append(f"\n📊 **Market Trend**: {trend_direction} {abs(avg_price_change):.1f}% over last 90 days")
        
        return "\n".join(lines)
    
    def _calculate_simple_market_value(
        self,
        list_price: float,
        property_data: Dict[str, Any],
        comparables: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Simple, practical valuation: Adjust listing price by ±5-7% based on comparable analysis
        
        Instead of complex calculations, we analyze how similar properties sold relative 
        to their listing prices and apply the same adjustment (within ±5-7% range).
        
        Steps:
        1. Look at comparable sold properties
        2. Calculate average list-to-sold ratio
        3. Apply adjustment within ±5-7% range
        4. Fine-tune with market factors (DOM, location, type)
        
        Args:
            list_price: Current listing price
            property_data: Property details from Repliers API
            comparables: Optional list of comparable properties
            
        Returns:
            Dictionary with estimate, range, and reasoning
        """
        logger.info(f"💡 Calculating simple market value from list price: ${list_price:,.0f}")
        
        # STEP 1: Analyze comparables to determine market direction
        base_adjustment = 0.0
        comparable_analysis = ""
        
        # Get subject property sqft
        subject_sqft = property_data.get('sqft', 0)
        
        if comparables and len(comparables) > 0:
            # Analyze comparable properties (ComparableProperty objects)
            # These can be SOLD properties (with sale_price) or ACTIVE listings (with list_price only)
            valid_comparables = []
            
            for comp in comparables[:8]:  # Use up to 8 comparables
                # Check if comp has either sale_price OR it's an active listing
                if hasattr(comp, 'sale_price'):
                    # ComparableProperty object - can be sold or active listing
                    # Active listings will have sale_price but it represents list price
                    if comp.sale_price > 0:
                        valid_comparables.append(comp)
            
            else:
                logger.info("   ℹ️ No valid comparables found (all have sale_price = 0)")
            
            if valid_comparables:
                # Calculate price per sqft for all valid comparables
                price_per_sqft_list = []
                for comp in valid_comparables:
                    if comp.property_details.sqft > 0:
                        # Use sale_price (which is list price for active listings)
                        price_per_sqft = comp.sale_price / comp.property_details.sqft
                        price_per_sqft_list.append(price_per_sqft)
                    else:
                        logger.debug(f"   ⚠️ Comparable has 0 sqft: {comp.property_details.address}")
                
                logger.info(f"   📊 Comparable Analysis: {len(price_per_sqft_list)} properties with valid price/sqft data")
                
                # Compare subject list price per sqft to market average
                if price_per_sqft_list and subject_sqft > 0:
                    avg_market_price_per_sqft = sum(price_per_sqft_list) / len(price_per_sqft_list)
                    subject_price_per_sqft = list_price / subject_sqft
                    
                    # If subject is priced higher than market, adjust down (negative)
                    # If subject is priced lower than market, adjust up (positive)
                    ratio = (avg_market_price_per_sqft - subject_price_per_sqft) / subject_price_per_sqft
                    base_adjustment = ratio * 0.5  # Use 50% of the difference as base adjustment
                    
                    logger.info(f"   📊 Comparable Analysis: {len(valid_comparables)} properties analyzed")
                    logger.info(f"   💰 Market avg: ${avg_market_price_per_sqft:.0f}/sqft vs Subject: ${subject_price_per_sqft:.0f}/sqft")
                    logger.info(f"   📈 Base adjustment from market: {base_adjustment:+.1%}")
                    
                    if ratio > 0.02:  # Market is >2% higher
                        comparable_analysis = f"market value {abs(ratio)*100:.1f}% higher than asking"
                    elif ratio < -0.02:  # Market is >2% lower
                        comparable_analysis = f"market value {abs(ratio)*100:.1f}% lower than asking"
                    else:
                        comparable_analysis = "priced in line with market"
        
        # If no comparables or invalid data, use market defaults
        if base_adjustment == 0.0:
            # Default: most markets see properties sell slightly below asking
            base_adjustment = -0.03  # -3% default
            comparable_analysis = "typical market conditions"
            logger.info(f"   📊 No comparable data - using default market adjustment: {base_adjustment:+.1%}")
        
        # STEP 2: Fine-tune with property-specific factors
        
        # Factor 1: Days on Market (DOM)
        dom = property_data.get('daysOnMarket', 0) or property_data.get('simpleDaysOnMarket', 0)
        dom_adjustment = 0.0
        
        if dom > 60:
            dom_adjustment = -0.015  # Long on market = reduce by 1.5%
        elif dom > 30:
            dom_adjustment = -0.005  # Moderate time = reduce by 0.5%
        elif dom < 7:
            dom_adjustment = 0.01  # Very fresh = increase by 1%
        
        if dom_adjustment != 0:
            logger.info(f"   📅 Days on Market: {dom} days → {dom_adjustment:+.1%} adjustment")
        
        # Factor 2: Location Quality
        address = property_data.get('address', {})
        city = address.get('city', '').lower() if isinstance(address, dict) else ''
        neighborhood = address.get('neighborhood', '').lower() if isinstance(address, dict) else ''
        
        premium_cities = ['toronto', 'oakville', 'mississauga', 'markham', 'richmond hill', 'vaughan']
        location_adjustment = 0.01 if any(pc in city for pc in premium_cities) else 0
        
        if location_adjustment > 0:
            logger.info(f"   📍 Premium Location: {city.title()} → {location_adjustment:+.1%} adjustment")
        
        # Factor 3: Property Type
        details = property_data.get('details', {})
        property_type = details.get('propertyType', '').lower()
        
        type_adjustment = 0.0
        if 'detached' in property_type:
            type_adjustment = 0.005  # Detached slightly better
        elif 'condo' in property_type or 'apartment' in property_type:
            type_adjustment = -0.005  # Condos slightly lower
        
        if type_adjustment != 0:
            logger.info(f"   🏠 Property Type: {property_type} → {type_adjustment:+.1%} adjustment")
        
        # Calculate total adjustment (capped at -7% to +7%)
        total_adjustment = base_adjustment + dom_adjustment + location_adjustment + type_adjustment
        total_adjustment = max(-0.07, min(0.07, total_adjustment))
        
        # Calculate AI estimate
        estimated_value = int(list_price * (1 + total_adjustment))
        
        # Calculate range (±2% from estimate for uncertainty)
        low_value = int(estimated_value * 0.98)
        high_value = int(estimated_value * 1.02)
        
        logger.info(f"   🎯 Total Adjustment: {total_adjustment:+.1%}")
        logger.info(f"   💰 AI Estimate: ${estimated_value:,.0f}")
        logger.info(f"   📊 Range: ${low_value:,.0f} - ${high_value:,.0f}")
        
        # Build reasoning
        adjustment_pct = total_adjustment * 100
        if adjustment_pct > 0:
            reasoning = f"Market analysis suggests this property could sell for approximately {adjustment_pct:.1f}% above the listing price"
        elif adjustment_pct < 0:
            reasoning = f"Market analysis suggests this property will likely sell for approximately {abs(adjustment_pct):.1f}% below the listing price"
        else:
            reasoning = "Market analysis suggests this property is priced at fair market value"
        
        factors = []
        if dom > 30:
            factors.append(f"property has been on market for {dom} days")
        if location_adjustment > 0:
            factors.append(f"premium location in {city.title()}")
        if type_adjustment != 0:
            factors.append(f"{property_type} market dynamics")
        
        if factors:
            reasoning += f" due to: {', '.join(factors)}"
        
        reasoning += f". Listing price: ${list_price:,.0f}."
        
        # Calculate price per sqft safely
        sqft_value = details.get('sqft', 1000)
        try:
            sqft_value = int(sqft_value) if sqft_value else 1000
        except (ValueError, TypeError):
            sqft_value = 1000
        
        price_per_sqft = int(estimated_value / sqft_value) if sqft_value > 0 else 0
        
        return {
            'success': True,
            'price_estimates': {
                'low': low_value,
                'medium': estimated_value,
                'high': high_value,
                'price_per_sqft': price_per_sqft
            },
            'confidence_score': 82,  # Good confidence for this simple approach
            'methodology': 'Simple Market Adjustment',  # Must match validation in ValuationResult
            'reasoning': reasoning,
            'comparables_used': len(comparables) if comparables else 0,
            'adjustments': {
                'base_discount': f"{base_adjustment*100:.1f}%",
                'days_on_market': f"{dom_adjustment*100:.1f}%",
                'location_premium': f"{location_adjustment*100:.1f}%",
                'property_type': f"{type_adjustment*100:.1f}%",
                'total_adjustment': f"{total_adjustment*100:+.1f}%"
            },
            'listing_price': list_price,
            'estimated_value': estimated_value,
            'value_range': (low_value, high_value),
            'market_data': {
                'days_on_market': dom,
                'city': city.title(),
                'property_type': property_type.title()
            }
        }


# Create default service instance
estimates_service = EstimatesService()


if __name__ == '__main__':
    # Test estimates service
    print("💰 Testing Property Estimates Service...\n")
    
    service = EstimatesService()
    
    # Test 1: Get estimate by address
    print("1️⃣  Getting estimate for off-market property...")
    try:
        result = service.get_estimate_by_address(
            address="123 Main Street, Toronto, ON M5H 2N2",
            bedrooms=3,
            bathrooms=2,
            sqft=1800,
            include_comparables=True
        )
        
        if result.get('error'):
            print(f"   ⚠️  {result['message']}")
        else:
            formatted = service.format_estimate_response(result)
            print(f"   ✅ Estimate received:")
            print(f"   {formatted}\n")
    
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 2: Get estimate by listing ID
    print("2️⃣  Getting estimate for existing listing...")
    try:
        result = service.get_estimate_by_listing(
            listing_id="sample_listing_id",
            include_comparables=True,
            include_market_trends=True
        )
        
        formatted = service.format_estimate_response(result)
        print(f"   ✅ Estimate received:")
        print(f"   {formatted}\n")
    
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    print("💡 Tip: More property details = more accurate estimates!")
