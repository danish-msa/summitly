"""
OpenAI Service for Canadian Real Estate Chatbot
==============================================

This module provides OpenAI integration optimized for Canadian real estate market.
Includes 7 specialized functions for enhanced user experience.

Author: Summitly Team
Date: December 3, 2025
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from openai import OpenAI

# Configure logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')  # Cost-effective model

# Global client instance
_openai_client = None


def get_openai_client():
    """Get or create OpenAI client instance."""
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY:
            logger.warning("⚠️ OPENAI_API_KEY not set in environment")
            return None
        try:
            _openai_client = OpenAI(api_key=OPENAI_API_KEY)
            logger.info("✅ OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI client: {e}")
            return None
    return _openai_client


def is_openai_available() -> bool:
    """Check if OpenAI is available and configured."""
    return get_openai_client() is not None


# =============================================================================
# FUNCTION 1: Enhanced Conversational Intelligence
# =============================================================================

def enhance_conversational_response(
    user_message: str,
    context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Generate intelligent, context-aware conversational responses.
    Optimized for Canadian real estate market.
    
    Args:
        user_message: The user's message
        context: Additional context (location, preferences, etc.)
        conversation_history: Previous conversation turns
    
    Returns:
        Enhanced conversational response
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"🤖 [OPENAI] Enhancing conversational response for: {user_message[:50]}...")
        
        # Build context-aware system prompt
        system_prompt = """You are an expert Canadian real estate assistant specializing in Toronto, Ontario, and the Greater Toronto Area (GTA). 

Your expertise includes:
- Toronto neighborhoods (Downtown, Yorkville, Liberty Village, North York, Scarborough, Etobicoke)
- GTA cities (Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington)
- Canadian real estate regulations (RECO, TREB, Tarion warranties)
- Ontario land transfer tax and first-time buyer rebates
- CMHC insurance requirements and benefits
- Toronto transit (TTC subway, streetcar, GO Transit)
- Market trends and investment opportunities
- Condo vs house comparisons
- Pre-construction developments

Always provide:
- Accurate, helpful information about Canadian real estate
- Context-aware responses based on user's needs
- Professional yet friendly tone
- Specific Toronto/GTA neighborhood insights
- Canadian financial considerations (CAD pricing, taxes, insurance)

Keep responses concise (2-3 paragraphs max) but informative."""

        # Add context if available
        if context:
            context_info = f"\n\nCurrent Context: {json.dumps(context, indent=2)}"
            system_prompt += context_info
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            for turn in conversation_history[-5:]:  # Last 5 turns for context
                messages.append(turn)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Make API call
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            top_p=0.9
        )
        
        enhanced_response = response.choices[0].message.content.strip()
        
        # Log token usage for cost tracking
        tokens_used = response.usage.total_tokens
        logger.info(f"✅ [OPENAI] Enhanced response generated ({tokens_used} tokens)")
        
        return enhanced_response
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error enhancing response: {e}")
        return None


# =============================================================================
# FUNCTION 2: Smart Property Descriptions
# =============================================================================

def generate_smart_property_description(
    property_data: Dict[str, Any],
    tone: str = "professional"
) -> str:
    """
    Generate engaging, AI-enhanced property descriptions.
    
    Args:
        property_data: Property details (MLS, price, bedrooms, etc.)
        tone: Description tone (professional, casual, luxury)
    
    Returns:
        Enhanced property description
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"🏠 [OPENAI] Generating smart property description...")
        
        # Extract key property details
        mls = property_data.get('mls_number', 'N/A')
        price = property_data.get('price', 'N/A')
        bedrooms = property_data.get('bedrooms', 'N/A')
        bathrooms = property_data.get('bathrooms', 'N/A')
        sqft = property_data.get('sqft', 'N/A')
        property_type = property_data.get('type', 'Property')
        address = property_data.get('address', 'Toronto')
        description = property_data.get('description', '')
        features = property_data.get('features', [])
        
        # Build prompt
        prompt = f"""Transform this real estate listing into an engaging, compelling property description.

Property Details:
- MLS: {mls}
- Price: ${price:,} CAD
- Type: {property_type}
- Bedrooms: {bedrooms}
- Bathrooms: {bathrooms}
- Square Feet: {sqft}
- Location: {address}
- Original Description: {description}
- Features: {', '.join(features) if features else 'N/A'}

Requirements:
- Tone: {tone}
- Length: 2-3 paragraphs
- Highlight unique selling points
- Mention Toronto/GTA location benefits
- Include lifestyle appeal
- Use vivid, descriptive language
- Mention investment potential if applicable
- Keep it honest and accurate

Generate an enhanced description that will excite potential buyers:"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert real estate copywriter specializing in Toronto luxury properties."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=400
        )
        
        enhanced_description = response.choices[0].message.content.strip()
        
        tokens_used = response.usage.total_tokens
        logger.info(f"✅ [OPENAI] Property description generated ({tokens_used} tokens)")
        
        return enhanced_description
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error generating property description: {e}")
        return None


# =============================================================================
# FUNCTION 3: Intelligent Query Understanding
# =============================================================================

def analyze_user_intent(
    user_message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Deeply understand user intent and extract structured information.
    
    Args:
        user_message: User's query
        conversation_history: Previous conversation
    
    Returns:
        Structured intent analysis with extracted entities
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"🔍 [OPENAI] Analyzing user intent...")
        
        prompt = f"""Analyze this Canadian real estate query and extract structured information.

User Query: "{user_message}"

Extract and return JSON with:
{{
    "intent": "search|valuation|information|comparison|investment",
    "property_type": "condo|house|townhouse|apartment|any",
    "location": "specific location or 'Toronto'",
    "budget_min": number or null,
    "budget_max": number or null,
    "bedrooms": number or null,
    "bathrooms": number or null,
    "must_have_features": ["feature1", "feature2"],
    "buyer_type": "first_time|investor|upgrader|downsizer|unknown",
    "urgency": "high|medium|low",
    "questions": ["specific question 1", "question 2"],
    "preferences": {{"key": "value"}},
    "investment_focused": true|false
}}

Analyze the query and return ONLY valid JSON:"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a real estate query analysis expert. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        intent_data = json.loads(response.choices[0].message.content)
        
        logger.info(f"✅ [OPENAI] Intent analyzed: {intent_data.get('intent', 'unknown')}")
        
        return intent_data
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error analyzing intent: {e}")
        return None


# =============================================================================
# FUNCTION 4: Professional Market Analysis Reports
# =============================================================================

def generate_market_analysis_report(
    location: str,
    property_type: str = "all",
    market_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate comprehensive market analysis reports for Canadian real estate.
    
    Args:
        location: Toronto neighborhood or GTA city
        property_type: Type of property to analyze
        market_data: Current market statistics
    
    Returns:
        Professional market analysis report
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"📊 [OPENAI] Generating market analysis for {location}...")
        
        market_info = ""
        if market_data:
            market_info = f"\n\nCurrent Market Data: {json.dumps(market_data, indent=2)}"
        
        prompt = f"""Generate a comprehensive Canadian real estate market analysis report.

Location: {location}
Property Type: {property_type}
{market_info}

Create a professional report covering:

1. **Current Market Overview**
   - Market temperature (hot/balanced/cool)
   - Recent trends (last 6-12 months)
   - Supply and demand dynamics

2. **Pricing Analysis**
   - Average prices for {property_type}
   - Price trends (appreciation/depreciation)
   - Price forecasts (next 12 months)

3. **Best Neighborhoods**
   - Top 3-5 neighborhoods in {location}
   - Why each is attractive
   - Price ranges for each

4. **Investment Opportunities**
   - Best investment strategies for this market
   - Rental income potential
   - ROI expectations

5. **Risk Factors**
   - Interest rate impact
   - Market risks to consider
   - Economic factors

6. **Recommendations**
   - Best time to buy/sell
   - Negotiation strategies
   - What to watch for

Keep it professional, data-driven, and actionable. Use Toronto/Canadian context."""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a senior Canadian real estate market analyst with expertise in Toronto and GTA markets."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=1200
        )
        
        report = response.choices[0].message.content.strip()
        
        tokens_used = response.usage.total_tokens
        logger.info(f"✅ [OPENAI] Market analysis generated ({tokens_used} tokens)")
        
        return report
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error generating market analysis: {e}")
        return None


# =============================================================================
# FUNCTION 5: Investment Analysis with Explanations
# =============================================================================

def generate_investment_analysis(
    property_data: Dict[str, Any],
    buyer_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate detailed investment analysis with clear explanations.
    
    Args:
        property_data: Property details
        buyer_profile: Buyer's financial profile
    
    Returns:
        Investment analysis with ROI, cash flow, and recommendations
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"💰 [OPENAI] Generating investment analysis...")
        
        price = property_data.get('price', 0)
        property_type = property_data.get('type', 'Property')
        location = property_data.get('address', 'Toronto')
        sqft = property_data.get('sqft', 'N/A')
        
        buyer_info = ""
        if buyer_profile:
            buyer_info = f"\n\nBuyer Profile: {json.dumps(buyer_profile, indent=2)}"
        
        prompt = f"""Analyze this Toronto property as an investment opportunity.

Property Details:
- Price: ${price:,} CAD
- Type: {property_type}
- Location: {location}
- Size: {sqft} sqft
{buyer_info}

Provide detailed investment analysis covering:

1. **Return on Investment (ROI)**
   - Expected annual appreciation (Toronto historical: 4-6%)
   - Rental income potential
   - Total ROI over 5 years
   - Total ROI over 10 years

2. **Cash Flow Analysis**
   - Expected rental income (monthly/annual)
   - Operating expenses (property tax, condo fees, insurance, maintenance)
   - Mortgage costs (assume 20% down, current rates ~5-6%)
   - Net monthly/annual cash flow
   - Break-even timeline

3. **Financial Metrics**
   - Cap rate
   - Cash-on-cash return
   - Gross rent multiplier
   - Debt service coverage ratio

4. **Market Position**
   - How this property compares to similar investments
   - Location advantages for rental/appreciation
   - Tenant demand for this area/type

5. **Risk Assessment**
   - Market risks
   - Liquidity considerations
   - Interest rate sensitivity
   - Vacancy risk

6. **Recommendation**
   - Is this a good investment? (Yes/No/Maybe)
   - Why or why not?
   - Best strategy (buy-and-hold, flip, rental)
   - Exit strategy suggestions

Return as detailed JSON with:
{{
    "summary": "One paragraph summary",
    "roi_5year": {{"percentage": X, "explanation": "..."}},
    "roi_10year": {{"percentage": X, "explanation": "..."}},
    "cash_flow": {{"monthly": X, "annual": X, "explanation": "..."}},
    "metrics": {{"cap_rate": X, "cash_on_cash": X}},
    "recommendation": {{"verdict": "buy|hold|pass", "reasoning": "..."}},
    "detailed_analysis": "Full analysis text"
}}

Return ONLY valid JSON:"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a Canadian real estate investment analyst. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        
        tokens_used = response.usage.total_tokens
        logger.info(f"✅ [OPENAI] Investment analysis generated ({tokens_used} tokens)")
        
        return analysis
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error generating investment analysis: {e}")
        return None


# =============================================================================
# FUNCTION 6: Comparative Market Analysis (CMA)
# =============================================================================

def generate_cma_report(
    target_property: Dict[str, Any],
    comparable_properties: List[Dict[str, Any]]
) -> str:
    """
    Generate professional Comparative Market Analysis report.
    
    Args:
        target_property: The property being analyzed
        comparable_properties: List of similar properties
    
    Returns:
        Professional CMA report
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"📋 [OPENAI] Generating CMA report...")
        
        target_price = target_property.get('price', 'N/A')
        target_mls = target_property.get('mls_number', 'N/A')
        
        # Format comparables
        comps_text = "\n".join([
            f"- ${comp.get('price', 'N/A'):,} | {comp.get('bedrooms', 'N/A')}BR/{comp.get('bathrooms', 'N/A')}BA | {comp.get('sqft', 'N/A')} sqft | {comp.get('address', 'N/A')}"
            for comp in comparable_properties[:5]  # Top 5 comps
        ])
        
        prompt = f"""Generate a professional Comparative Market Analysis (CMA) report.

TARGET PROPERTY:
- MLS: {target_mls}
- Price: ${target_price:,} CAD
- Type: {target_property.get('type', 'N/A')}
- Beds/Baths: {target_property.get('bedrooms', 'N/A')}/{target_property.get('bathrooms', 'N/A')}
- Size: {target_property.get('sqft', 'N/A')} sqft
- Location: {target_property.get('address', 'Toronto')}

COMPARABLE PROPERTIES:
{comps_text}

Generate a professional CMA report including:

1. **Executive Summary**
   - Property overview
   - Recommended price range
   - Market position assessment

2. **Comparative Analysis**
   - How target property compares to each comparable
   - Price per square foot analysis
   - Feature comparison
   - Location comparison

3. **Price Justification**
   - Why the asking price is fair/high/low
   - Market data supporting the price
   - Adjustment factors

4. **Market Positioning**
   - Where this property stands in the market
   - Competitive advantages
   - Potential concerns

5. **Negotiation Strategy**
   - Recommended offer range
   - Negotiation leverage points
   - Market conditions to consider

6. **Conclusion**
   - Final recommendation
   - Key takeaways
   - Action items

Format professionally with clear sections and data-driven insights."""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional Canadian real estate appraiser creating detailed CMA reports."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1500
        )
        
        cma_report = response.choices[0].message.content.strip()
        
        tokens_used = response.usage.total_tokens
        logger.info(f"✅ [OPENAI] CMA report generated ({tokens_used} tokens)")
        
        return cma_report
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error generating CMA report: {e}")
        return None


# =============================================================================
# FUNCTION 7: Smart Follow-up Questions Generator
# =============================================================================

def generate_followup_questions(
    user_message: str,
    context: Optional[Dict[str, Any]] = None,
    properties_shown: Optional[List[Dict[str, Any]]] = None
) -> List[str]:
    """
    Generate contextually relevant follow-up questions.
    
    Args:
        user_message: User's last message
        context: Current conversation context
        properties_shown: Properties displayed to user
    
    Returns:
        List of 3-5 smart follow-up questions
    """
    client = get_openai_client()
    if not client:
        return None
    
    try:
        logger.info(f"❓ [OPENAI] Generating follow-up questions...")
        
        context_info = ""
        if context:
            context_info = f"\n\nContext: {json.dumps(context, indent=2)}"
        
        properties_info = ""
        if properties_shown:
            properties_info = f"\n\nProperties Shown: {len(properties_shown)} properties"
        
        prompt = f"""Generate 3-5 smart follow-up questions for a Canadian real estate conversation.

User's Last Message: "{user_message}"
{context_info}
{properties_info}

Generate questions that:
- Are contextually relevant to what the user just asked
- Help move the conversation forward
- Uncover deeper needs or preferences
- Are specific to Canadian/Toronto real estate
- Sound natural and conversational
- Help qualify the buyer/investor better

Return as JSON array of strings:
{{"questions": ["Question 1?", "Question 2?", "Question 3?"]}}

Return ONLY valid JSON:"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert at asking relevant follow-up questions in real estate conversations. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        questions = result.get('questions', [])
        
        logger.info(f"✅ [OPENAI] Generated {len(questions)} follow-up questions")
        
        return questions
        
    except Exception as e:
        logger.error(f"❌ [OPENAI] Error generating follow-up questions: {e}")
        return None


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_token_usage_stats() -> Dict[str, int]:
    """Get API usage statistics (if available)."""
    # This would require additional tracking implementation
    return {
        "total_requests": 0,
        "total_tokens": 0,
        "estimated_cost": 0.0
    }


def test_openai_connection() -> bool:
    """Test if OpenAI API is working."""
    try:
        client = get_openai_client()
        if not client:
            return False
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        
        logger.info("✅ OpenAI connection test successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ OpenAI connection test failed: {e}")
        return False


# =============================================================================
# MODULE INITIALIZATION
# =============================================================================

if __name__ == "__main__":
    # Test the module
    print("🧪 Testing OpenAI Service Module...")
    print(f"API Key configured: {'Yes' if OPENAI_API_KEY else 'No'}")
    print(f"Model: {OPENAI_MODEL}")
    
    if test_openai_connection():
        print("✅ All systems operational!")
    else:
        print("❌ OpenAI service not configured properly")
