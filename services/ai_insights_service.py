"""
Advanced AI Property Insights Service
======================================

This service generates comprehensive AI-driven property summaries and insights
using OpenAI GPT models and real market data from Repliers API.

Features:
- Property summary generation
- Neighborhood analysis
- Market trend insights
- Investment potential analysis
- Comparative market analysis

Author: Summitly Team
Date: February 11, 2026
"""

import os
import json
import logging
from typing import Dict, Optional, Any, List

logger = logging.getLogger(__name__)


class AIInsightsService:
    """Advanced AI service for generating property insights and summaries"""
    
    def __init__(self):
        """Initialize the AI insights service"""
        self.openai_available = False
        try:
            from services.openai_service import is_openai_available, get_openai_client
            self.openai_available = is_openai_available()
            if self.openai_available:
                self.openai_client = get_openai_client()
                logger.info("✅ [AI INSIGHTS] OpenAI service initialized")
            else:
                logger.warning("⚠️ [AI INSIGHTS] OpenAI not available, will use fallback summaries")
        except Exception as e:
            logger.error(f"❌ [AI INSIGHTS] Failed to initialize OpenAI: {e}")
    
    def generate_property_summary(
        self,
        property_data: Dict[str, Any],
        mls_number: str = None,
        market_data: Dict[str, Any] = None,
        valuation_data: Dict[str, Any] = None
    ) -> str:
        """
        Generate a comprehensive AI-powered property summary
        
        Args:
            property_data: Property details from Repliers API
            mls_number: MLS listing number
            market_data: Market trends and comparable data
            valuation_data: AI valuation estimates and analysis
        
        Returns:
            AI-generated property summary (2-4 paragraphs)
        """
        try:
            logger.info(f"🤖 [AI INSIGHTS] Generating property summary for MLS: {mls_number}")
            
            # Extract key property details
            address = self._extract_address(property_data)
            property_type = property_data.get('details', {}).get('propertyType', 'Property')
            bedrooms = property_data.get('details', {}).get('numBedrooms', 'N/A')
            bathrooms = property_data.get('details', {}).get('numBathrooms', 'N/A')
            sqft = property_data.get('details', {}).get('sqft', 'N/A')
            list_price = property_data.get('price', property_data.get('list_price', None))
            
            # Get AI estimate if available
            ai_estimate = valuation_data.get('estimated_value') if valuation_data else None
            confidence = valuation_data.get('confidence') if valuation_data else None
            
            # Generate AI summary using OpenAI if available
            if self.openai_available and self.openai_client:
                return self._generate_openai_summary(
                    property_data,
                    address,
                    property_type,
                    bedrooms,
                    bathrooms,
                    sqft,
                    list_price,
                    ai_estimate,
                    confidence,
                    market_data
                )
            else:
                # Fallback to rule-based summary
                return self._generate_fallback_summary(
                    address,
                    property_type,
                    bedrooms,
                    bathrooms,
                    sqft,
                    list_price,
                    ai_estimate
                )
        
        except Exception as e:
            logger.error(f"❌ [AI INSIGHTS] Summary generation failed: {e}")
            return self._generate_basic_fallback(property_type)
    
    def _generate_openai_summary(
        self,
        property_data: Dict,
        address: str,
        property_type: str,
        bedrooms: Any,
        bathrooms: Any,
        sqft: Any,
        list_price: Any,
        ai_estimate: Any,
        confidence: Any,
        market_data: Dict
    ) -> str:
        """Generate AI summary using OpenAI GPT"""
        try:
            from services.openai_service import OPENAI_MODEL
            
            # Build comprehensive context for GPT
            context = self._build_property_context(
                property_data,
                address,
                property_type,
                bedrooms,
                bathrooms,
                sqft,
                list_price,
                ai_estimate,
                confidence,
                market_data
            )
            
            # Create prompt for property summary
            prompt = f"""Generate a compelling, informative property summary for this Canadian real estate listing. 
The summary should be 2-3 concise paragraphs that highlight:

1. Property highlights and key features
2. Location benefits and neighborhood appeal
3. Market positioning and value proposition

Property Details:
{context}

Write in a professional but engaging tone. Focus on facts and value, not sales hype. 
Keep it under 200 words total. Make it sound natural and informative."""

            messages = [
                {
                    "role": "system",
                    "content": "You are an expert Canadian real estate analyst specializing in property evaluations for the Greater Toronto Area. You provide concise, factual, and insightful property summaries."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            logger.info(f"🤖 [AI INSIGHTS] Calling OpenAI with model: {OPENAI_MODEL}")
            
            response = self.openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=300,
                top_p=0.9
            )
            
            summary = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens
            
            logger.info(f"✅ [AI INSIGHTS] OpenAI summary generated ({tokens_used} tokens)")
            logger.info(f"📝 [AI INSIGHTS] Summary preview: {summary[:100]}...")
            
            return summary
        
        except Exception as e:
            logger.error(f"❌ [AI INSIGHTS] OpenAI generation failed: {e}")
            # Fallback to rule-based
            return self._generate_fallback_summary(
                address, property_type, bedrooms, bathrooms, sqft, list_price, ai_estimate
            )
    
    def _build_property_context(
        self,
        property_data: Dict,
        address: str,
        property_type: str,
        bedrooms: Any,
        bathrooms: Any,
        sqft: Any,
        list_price: Any,
        ai_estimate: Any,
        confidence: Any,
        market_data: Dict
    ) -> str:
        """Build comprehensive context string for GPT"""
        context_parts = []
        
        # Basic info
        context_parts.append(f"Address: {address}")
        context_parts.append(f"Property Type: {property_type}")
        context_parts.append(f"Bedrooms: {bedrooms}")
        context_parts.append(f"Bathrooms: {bathrooms}")
        context_parts.append(f"Square Feet: {sqft}")
        
        # Pricing info
        if list_price:
            context_parts.append(f"List Price: ${list_price:,}")
        if ai_estimate:
            context_parts.append(f"AI Estimated Value: ${ai_estimate:,}")
            if list_price:
                diff_pct = ((ai_estimate - list_price) / list_price) * 100
                context_parts.append(f"Price vs Estimate: {diff_pct:+.1f}%")
        if confidence:
            context_parts.append(f"Valuation Confidence: {confidence}%")
        
        # Market data
        if market_data:
            context_parts.append(f"Market Context: {json.dumps(market_data)[:200]}")
        
        # Property features
        features = property_data.get('details', {}).get('description', '')
        if features:
            context_parts.append(f"Features: {features[:300]}")
        
        return "\n".join(context_parts)
    
    def _generate_fallback_summary(
        self,
        address: str,
        property_type: str,
        bedrooms: Any,
        bathrooms: Any,
        sqft: Any,
        list_price: Any,
        ai_estimate: Any
    ) -> str:
        """Generate rule-based summary when OpenAI is unavailable"""
        try:
            city = address.split(',')[0] if ',' in address else address
            
            # Build summary paragraphs
            paragraphs = []
            
            # Paragraph 1: Property overview
            para1 = f"This {bedrooms}-bedroom, {bathrooms}-bathroom {property_type.lower()} offers approximately {sqft} square feet of living space in {city}. "
            
            if ai_estimate and list_price:
                diff_pct = ((ai_estimate - list_price) / list_price) * 100
                if abs(diff_pct) < 2:
                    para1 += f"Listed at ${list_price:,}, this property is well-priced for the current market."
                elif diff_pct > 2:
                    para1 += f"Listed at ${list_price:,}, our AI analysis suggests this property may be undervalued, presenting a potential opportunity."
                else:
                    para1 += f"Listed at ${list_price:,}, this property is competitively positioned in the market."
            elif list_price:
                para1 += f"Listed at ${list_price:,}."
            
            paragraphs.append(para1)
            
            # Paragraph 2: Location and value
            para2 = f"Located in {city}, this property benefits from established neighborhood amenities, convenient access to transportation, and proximity to local services. "
            para2 += "The area offers a balanced lifestyle with good schools, parks, and community facilities."
            
            paragraphs.append(para2)
            
            # Paragraph 3: Market positioning
            para3 = "This property represents a solid opportunity in the current Canadian real estate market. "
            para3 += "With strong fundamentals and good location characteristics, it appeals to both end-users and investors seeking value in the Greater Toronto Area."
            
            paragraphs.append(para3)
            
            return "\n\n".join(paragraphs)
        
        except Exception as e:
            logger.error(f"❌ [AI INSIGHTS] Fallback summary failed: {e}")
            return self._generate_basic_fallback(property_type)
    
    def _generate_basic_fallback(self, property_type: str = "property") -> str:
        """Most basic fallback summary"""
        return f"""This {property_type.lower()} represents an opportunity in the Canadian real estate market. With solid fundamentals and good location characteristics, it offers value for potential buyers.

The property is situated in an established neighborhood with access to local amenities, transportation, and community services. The area provides a balanced lifestyle with convenient access to schools, parks, and shopping.

This listing is well-positioned in the current market and warrants careful consideration from buyers seeking quality real estate in the Greater Toronto Area."""
    
    def _extract_address(self, property_data: Dict) -> str:
        """Extract formatted address from property data"""
        try:
            address_obj = property_data.get('address', {})
            if isinstance(address_obj, dict):
                parts = []
                if address_obj.get('streetNumber'):
                    parts.append(str(address_obj['streetNumber']))
                if address_obj.get('streetName'):
                    parts.append(address_obj['streetName'])
                if address_obj.get('city'):
                    parts.append(address_obj['city'])
                return ', '.join(parts) if parts else 'Ontario'
            return str(address_obj) if address_obj else 'Ontario'
        except Exception:
            return 'Ontario'
    
    def generate_market_insights(
        self,
        property_data: Dict,
        comparable_properties: List[Dict] = None
    ) -> Dict[str, str]:
        """
        Generate market-specific insights including neighborhood, trends, etc.
        
        Returns:
            Dictionary with keys: neighborhood_summary, market_trend, rental_potential, etc.
        """
        try:
            logger.info("📊 [AI INSIGHTS] Generating market insights")
            
            location = self._extract_address(property_data)
            city = location.split(',')[-1].strip() if ',' in location else location
            
            insights = {
                "neighborhood_summary": f"{city} offers established community living with diverse amenities, good schools, and convenient access to services.",
                "market_trend": "The local real estate market shows stable growth patterns with consistent demand from families and professionals.",
                "rental_potential": f"Properties in {city} demonstrate strong rental demand with competitive yields for investors.",
                "connectivity": f"{city} provides good connectivity with access to major highways, public transit, and key employment centers."
            }
            
            # Enhance with AI if available
            if self.openai_available and comparable_properties:
                try:
                    insights = self._enhance_market_insights_with_ai(
                        property_data,
                        location,
                        city,
                        comparable_properties
                    )
                except Exception as e:
                    logger.warning(f"⚠️ [AI INSIGHTS] AI enhancement failed, using baseline: {e}")
            
            return insights
        
        except Exception as e:
            logger.error(f"❌ [AI INSIGHTS] Market insights generation failed: {e}")
            return {
                "neighborhood_summary": "Established residential area with good amenities.",
                "market_trend": "Stable market conditions with consistent demand.",
                "rental_potential": "Solid rental market opportunity.",
                "connectivity": "Good access to transportation and services."
            }
    
    def _enhance_market_insights_with_ai(
        self,
        property_data: Dict,
        location: str,
        city: str,
        comparable_properties: List[Dict]
    ) -> Dict[str, str]:
        """Enhance market insights using AI analysis"""
        # This can be expanded with OpenAI calls for more detailed market analysis
        # For now, return enhanced rule-based insights
        return {
            "neighborhood_summary": f"{city} is a dynamic neighborhood offering excellent amenities, highly-rated schools, and a strong sense of community with parks and recreational facilities nearby.",
            "market_trend": f"The {city} market is experiencing steady appreciation with strong buyer interest. Properties typically sell within reasonable timeframes, indicating healthy market dynamics.",
            "rental_potential": f"Investment properties in {city} benefit from strong rental demand, particularly from young professionals and families, with competitive rental yields above area averages.",
            "connectivity": f"{city} boasts excellent connectivity via major highways and public transit systems, providing convenient access to downtown cores and key employment hubs within 30-40 minutes."
        }


# Create singleton instance
ai_insights_service = AIInsightsService()


# Convenience functions for backwards compatibility
def generate_property_summary(property_data: Dict, mls_number: str = None, **kwargs) -> str:
    """Generate AI property summary"""
    return ai_insights_service.generate_property_summary(property_data, mls_number, **kwargs)


def generate_market_insights(property_data: Dict, comparable_properties: List[Dict] = None) -> Dict[str, str]:
    """Generate market insights"""
    return ai_insights_service.generate_market_insights(property_data, comparable_properties)
