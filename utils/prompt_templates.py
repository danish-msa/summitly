#!/usr/bin/env python3
"""
Prompt Templates for Real Estate AI Assistant
Canadian Market Focus - English and French Support
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass

@dataclass
class PromptTemplate:
    """Container for prompt template with metadata"""
    name: str
    template: str
    description: str
    language: str = "en"
    variables: List[str] = None
    category: str = "general"
    
    def __post_init__(self):
        if self.variables is None:
            self.variables = []

class RealEstatePromptTemplates:
    """
    Comprehensive prompt templates for Canadian real estate AI assistant
    Supports both English and French for the Canadian market
    """
    
    # ===== SYSTEM PROMPTS =====
    
    SYSTEM_PROMPTS = {
        "general_en": PromptTemplate(
            name="general_system",
            template="""You are a knowledgeable and friendly Canadian real estate assistant specializing in helping clients find their perfect home. You have expertise in the Canadian real estate market, particularly the Greater Toronto Area (GTA), Vancouver, Montreal, and other major Canadian cities.

Your role is to:
- Help clients understand the Canadian real estate market
- Provide insights about neighborhoods, pricing, and market trends
- Guide them through property searches based on their preferences
- Explain Canadian real estate processes, including mortgages, CMHC insurance, and closing procedures
- Connect them with appropriate real estate professionals when needed

Always be conversational, helpful, and focus on Canadian real estate specifics. Use Canadian terminology (realtor, MLS, CMHC, etc.) and reference Canadian cities, neighborhoods, and market conditions.""",
            description="General system prompt for Canadian real estate assistant",
            language="en",
            category="system"
        ),
        
        "general_fr": PromptTemplate(
            name="general_system_french",
            template="""Vous êtes un assistant immobilier canadien compétent et amical, spécialisé dans l'aide aux clients pour trouver leur maison parfaite. Vous avez une expertise du marché immobilier canadien, particulièrement la région du Grand Toronto (RGT), Vancouver, Montréal et d'autres grandes villes canadiennes.

Votre rôle est de :
- Aider les clients à comprendre le marché immobilier canadien
- Fournir des aperçus sur les quartiers, les prix et les tendances du marché
- Les guider dans la recherche de propriétés selon leurs préférences
- Expliquer les processus immobiliers canadiens, y compris les hypothèques, l'assurance SCHL et les procédures de clôture
- Les connecter avec des professionnels de l'immobilier appropriés quand nécessaire

Soyez toujours conversationnel, utile, et concentrez-vous sur les spécificités immobilières canadiennes. Utilisez la terminologie canadienne et référez-vous aux villes, quartiers et conditions de marché canadiens.""",
            description="Prompt système général pour assistant immobilier canadien",
            language="fr",
            category="system"
        ),
        
        "property_search_en": PromptTemplate(
            name="property_search_system",
            template="""You are a Canadian real estate search specialist. Your expertise includes:

- Understanding Canadian property types: detached homes, semi-detached, townhouses, condos, and co-ops
- Knowledge of major Canadian markets: GTA (Toronto, Mississauga, Brampton, Markham), Vancouver (downtown, Richmond, Burnaby), Montreal, Calgary, Edmonton
- Familiarity with Canadian price ranges, market trends, and neighborhood characteristics
- Understanding of Canadian mortgage requirements, down payment rules (minimum 5% for first $500K, 10% for portion above), and CMHC insurance

When helping with property searches:
1. Ask clarifying questions about budget, location preferences, property type, and timeline
2. Provide realistic expectations based on current Canadian market conditions
3. Explain neighborhood benefits and characteristics
4. Mention relevant factors like schools, transportation, amenities
5. Guide them toward next steps like viewing properties or connecting with a realtor

Always use Canadian dollars (CAD) and reference Canadian-specific information.""",
            description="System prompt for property search assistance",
            language="en",
            category="system"
        ),
        
        "first_time_buyer_en": PromptTemplate(
            name="first_time_buyer_system",
            template="""You are a patient and educational Canadian real estate assistant specializing in helping first-time home buyers. Your expertise includes:

Canadian First-Time Buyer Programs:
- First-Time Home Buyer Incentive (shared equity with government)
- Home Buyers' Plan (HBP) - withdrawing from RRSP
- Provincial first-time buyer programs
- Municipal land transfer tax rebates

Key Canadian Requirements:
- Minimum down payment: 5% for first $500,000, 10% for portion above
- CMHC insurance required for down payments under 20%
- Stress test requirements (qualify at higher rate)
- Closing costs typically 1.5-4% of purchase price

Your approach:
1. Explain complex concepts in simple terms
2. Break down the buying process step by step
3. Help them understand all costs involved
4. Guide them through pre-approval process
5. Educate about Canadian real estate terminology
6. Provide encouragement and realistic expectations

Always emphasize the importance of getting pre-approved and working with qualified Canadian mortgage professionals.""",
            description="System prompt for first-time buyer assistance",
            language="en",
            category="system"
        )
    }
    
    # ===== CONVERSATION STARTERS =====
    
    CONVERSATION_STARTERS = {
        "greeting_en": PromptTemplate(
            name="greeting_conversation",
            template="""Hello! I'm your Canadian real estate assistant, and I'm excited to help you find your perfect home. 

Whether you're looking for:
🏠 A family home in the suburbs
🏢 A downtown condo with city views  
🏘️ A townhouse in a growing community
💰 An investment property opportunity

I'm here to guide you through the Canadian real estate market. I have expertise in major markets like Toronto, Vancouver, Montreal, and many other cities across Canada.

What type of property interests you most, and which area are you considering?""",
            description="Friendly greeting to start conversation",
            language="en",
            variables=["user_name"],
            category="greeting"
        ),
        
        "location_inquiry_en": PromptTemplate(
            name="location_inquiry",
            template="""I'd love to tell you about {location}! It's a {area_type} with some really interesting characteristics.

Here's what makes {location} special:

🏙️ **Neighborhood Character**: {neighborhood_character}
🚌 **Transportation**: {transportation_info}
🏫 **Schools & Education**: {education_info}
🛍️ **Amenities**: {amenities_info}
💹 **Market Trends**: {market_trends}

The typical price range for {property_type} in {location} is {price_range}.

What specific aspects of {location} would you like to know more about? Are you interested in the lifestyle, investment potential, or specific neighborhoods within the area?""",
            description="Template for location-specific information",
            language="en",
            variables=["location", "area_type", "neighborhood_character", "transportation_info", "education_info", "amenities_info", "market_trends", "property_type", "price_range"],
            category="location"
        ),
        
        "budget_discussion_en": PromptTemplate(
            name="budget_discussion",
            template="""Great! With a budget of {budget_range}, you have some excellent options in the Canadian market.

Let me break down what this means for you:

💰 **Purchase Price**: {budget_range}
📊 **Down Payment Needed**: {down_payment_info}
🏦 **Estimated Monthly Payment**: {monthly_payment_estimate}
💸 **Closing Costs**: {closing_costs_estimate}

In {preferred_location}, this budget typically gets you:
- {property_options}

**Canadian Mortgage Insights**:
- {mortgage_insights}
- {first_time_buyer_programs}

Have you been pre-approved for a mortgage yet? This is always the first step I recommend, as it gives you a clear picture of your buying power and shows sellers you're a serious buyer.

Would you like me to explain more about the Canadian mortgage process or start looking at specific properties in your range?""",
            description="Template for budget and financing discussion",
            language="en",
            variables=["budget_range", "down_payment_info", "monthly_payment_estimate", "closing_costs_estimate", "preferred_location", "property_options", "mortgage_insights", "first_time_buyer_programs"],
            category="financial"
        )
    }
    
    # ===== PROPERTY ANALYSIS TEMPLATES =====
    
    PROPERTY_ANALYSIS = {
        "property_overview_en": PromptTemplate(
            name="property_overview",
            template="""🏠 **{property_title}** looks like a fantastic opportunity! Let me give you my analysis:

**📍 Location Analysis**:
{location_analysis}

**💰 Value Assessment**:
- Listed at {listing_price}
- Market value assessment: {market_value_opinion}
- Price per square foot: {price_per_sqft}
- Compared to area average: {comparison_to_market}

**🏘️ Neighborhood Highlights**:
{neighborhood_highlights}

**📈 Investment Potential**:
{investment_analysis}

**🎯 Best For**: {ideal_buyer_profile}

**⚠️ Considerations**: {important_considerations}

This property scored {overall_score}/10 in my analysis based on location, value, and market factors.

What aspects of this property interest you most? Would you like me to dive deeper into the neighborhood, financing options, or help you compare it with similar properties?""",
            description="Comprehensive property analysis template",
            language="en",
            variables=["property_title", "location_analysis", "listing_price", "market_value_opinion", "price_per_sqft", "comparison_to_market", "neighborhood_highlights", "investment_analysis", "ideal_buyer_profile", "important_considerations", "overall_score"],
            category="analysis"
        ),
        
        "market_comparison_en": PromptTemplate(
            name="market_comparison",
            template="""📊 **Market Comparison for {location}**

I've analyzed similar {property_type} properties in {location}, and here's what I found:

**Recently Sold (Last 3 months)**:
{recent_sales}

**Currently Available**:
{current_listings}

**Market Trends**:
- Average price trend: {price_trend}
- Average days on market: {days_on_market}
- Inventory levels: {inventory_status}

**This Property vs Market**:
- Price position: {price_position}
- Value proposition: {value_assessment}
- Competitive advantages: {competitive_advantages}

**Market Outlook**:
{market_outlook}

**My Recommendation**: {recommendation}

Would you like me to show you some of the comparable properties, or shall we discuss what this means for your negotiation strategy?""",
            description="Market comparison and analysis template",
            language="en",
            variables=["location", "property_type", "recent_sales", "current_listings", "price_trend", "days_on_market", "inventory_status", "price_position", "value_assessment", "competitive_advantages", "market_outlook", "recommendation"],
            category="market"
        )
    }
    
    # ===== FOLLOW-UP QUESTIONS =====
    
    FOLLOW_UP_QUESTIONS = {
        "property_search_followup": PromptTemplate(
            name="property_search_followup",
            template="""Based on what you've told me, I have a few questions to help narrow down the perfect properties for you:

{dynamic_questions}

These details will help me find properties that truly match your lifestyle and needs. Canadian real estate markets can be quite specific to neighborhoods, so the more I understand your preferences, the better I can guide you!""",
            description="Dynamic follow-up questions for property search",
            language="en",
            variables=["dynamic_questions"],
            category="followup"
        ),
        
        "investment_followup": PromptTemplate(
            name="investment_followup",
            template="""Since you're considering this as an investment property, let me ask a few key questions:

1. **Investment Timeline**: Are you looking for short-term gains, long-term appreciation, or rental income?

2. **Risk Tolerance**: Are you comfortable with newer markets/developments, or do you prefer established neighborhoods?

3. **Management**: Would you manage the property yourself or hire a property management company?

4. **Financing**: Are you looking at conventional financing, or considering other investment strategies?

5. **Portfolio**: Is this your first investment property, or are you expanding an existing portfolio?

Understanding your investment strategy helps me identify properties with the best potential returns in the current Canadian market!""",
            description="Follow-up questions for investment properties",
            language="en",
            category="investment"
        )
    }
    
    # ===== ERROR AND FALLBACK TEMPLATES =====
    
    FALLBACK_RESPONSES = {
        "general_fallback": PromptTemplate(
            name="general_fallback",
            template="""I want to make sure I give you the most helpful information possible. Let me connect you with one of our Canadian real estate specialists who can provide detailed, current market insights for your specific needs.

In the meantime, I can help you with:
- General information about Canadian real estate markets
- Explaining the home buying process in Canada
- Understanding mortgage requirements and programs
- Exploring different neighborhoods and their characteristics

What would you like to explore while I arrange for a specialist to assist you with the more detailed aspects of your search?""",
            description="Fallback response when AI can't provide specific information",
            language="en",
            category="fallback"
        ),
        
        "technical_error": PromptTemplate(
            name="technical_error_response",
            template="""I'm experiencing some technical difficulties right now, but I don't want that to slow down your property search!

Here's what I can do for you immediately:
- Connect you directly with one of our Canadian real estate specialists
- Send you our latest market reports for {location}
- Schedule a call to discuss your specific needs
- Provide you with our property search portal access

Your time is valuable, and finding the right property is important. Let me make sure you get the expert assistance you deserve right away.

Would you prefer a call back within the next hour, or would you like me to send you direct contact information for our team?""",
            description="Response for technical errors with helpful alternatives",
            language="en",
            variables=["location"],
            category="error"
        )
    }
    
    # ===== CANADIAN MARKET SPECIFIC TEMPLATES =====
    
    CANADIAN_MARKET_INSIGHTS = {
        "gta_market_update": PromptTemplate(
            name="gta_market_trends",
            template="""🏙️ **Greater Toronto Area (GTA) Market Update**

The GTA market is showing some interesting trends right now:

**Current Market Conditions**:
- Average home price: {avg_price}
- Market activity: {market_activity}
- Inventory levels: {inventory_levels}

**Hot Areas**: {hot_neighborhoods}

**Best Value Areas**: {value_neighborhoods}

**First-Time Buyer Opportunities**: {ftb_opportunities}

**Investment Hotspots**: {investment_areas}

**Upcoming Developments**: {future_developments}

The GTA market is always dynamic, with each area offering different opportunities. Whether you're looking in Toronto proper, the 905 regions, or emerging areas, there are strategic advantages to consider.

Which GTA area interests you most, and what's driving your preference - commute, lifestyle, investment potential, or family considerations?""",
            description="GTA-specific market insights and trends",
            language="en",
            variables=["avg_price", "market_activity", "inventory_levels", "hot_neighborhoods", "value_neighborhoods", "ftb_opportunities", "investment_areas", "future_developments"],
            category="market_specific"
        )
    }
    
    @classmethod
    def get_template(cls, template_name: str, language: str = "en") -> Optional[PromptTemplate]:
        """Get a specific template by name and language"""
        template_key = f"{template_name}_{language}"
        
        # Search through all template categories
        all_templates = {
            **cls.SYSTEM_PROMPTS,
            **cls.CONVERSATION_STARTERS,
            **cls.PROPERTY_ANALYSIS,
            **cls.FOLLOW_UP_QUESTIONS,
            **cls.FALLBACK_RESPONSES,
            **cls.CANADIAN_MARKET_INSIGHTS
        }
        
        return all_templates.get(template_key) or all_templates.get(template_name)
    
    @classmethod
    def format_template(cls, template_name: str, variables: Dict[str, Any], language: str = "en") -> str:
        """Format a template with provided variables"""
        template = cls.get_template(template_name, language)
        if not template:
            return f"Template '{template_name}' not found"
        
        try:
            return template.template.format(**variables)
        except KeyError as e:
            return f"Missing variable for template '{template_name}': {e}"
    
    @classmethod
    def get_templates_by_category(cls, category: str, language: str = "en") -> List[PromptTemplate]:
        """Get all templates in a specific category"""
        all_templates = {
            **cls.SYSTEM_PROMPTS,
            **cls.CONVERSATION_STARTERS,
            **cls.PROPERTY_ANALYSIS,
            **cls.FOLLOW_UP_QUESTIONS,
            **cls.FALLBACK_RESPONSES,
            **cls.CANADIAN_MARKET_INSIGHTS
        }
        
        return [template for template in all_templates.values() 
                if template.category == category and template.language == language]
    
    @classmethod
    def build_context_enhanced_prompt(
        cls, 
        user_message: str, 
        user_preferences: Dict[str, Any] = None,
        conversation_history: List[Dict] = None,
        real_estate_context: Dict[str, Any] = None,
        intent: str = "general",
        language: str = "en"
    ) -> str:
        """Build a context-enhanced prompt for the AI model"""
        
        # Get appropriate system prompt
        system_template = cls.get_template(f"{intent}_system", language) or cls.get_template("general_system", language)
        system_prompt = system_template.template if system_template else cls.SYSTEM_PROMPTS["general_en"].template
        
        # Build context sections
        context_parts = [system_prompt]
        
        # Add user preferences context
        if user_preferences:
            pref_context = "User Preferences:\n"
            if user_preferences.get("location"):
                pref_context += f"- Preferred location: {user_preferences['location']}\n"
            if user_preferences.get("budget_max"):
                pref_context += f"- Budget: Up to ${user_preferences['budget_max']:,} CAD\n"
            if user_preferences.get("property_type"):
                pref_context += f"- Property type: {user_preferences['property_type']}\n"
            if user_preferences.get("bedrooms"):
                pref_context += f"- Bedrooms: {user_preferences['bedrooms']}\n"
            if user_preferences.get("first_time_buyer"):
                pref_context += "- First-time home buyer\n"
            
            context_parts.append(pref_context)
        
        # Add real estate context
        if real_estate_context:
            if real_estate_context.get("current_properties"):
                context_parts.append("Currently discussing specific properties from recent search results.")
            if real_estate_context.get("market_data"):
                context_parts.append("Market analysis data is available for reference.")
            if real_estate_context.get("broker_assigned"):
                context_parts.append("User has been assigned to a real estate broker.")
        
        # Add conversation history (last few turns)
        if conversation_history:
            recent_history = conversation_history[-3:]  # Last 3 turns
            history_context = "Recent Conversation:\n"
            for turn in recent_history:
                if turn.get("role") == "user":
                    history_context += f"Human: {turn.get('content', '')}\n"
                elif turn.get("role") == "assistant":
                    history_context += f"Assistant: {turn.get('content', '')}\n"
            context_parts.append(history_context)
        
        # Add Canadian market reminders
        if intent in ["property_search", "investment_inquiry", "market_analysis"]:
            context_parts.append("Remember to focus on Canadian real estate markets, use CAD currency, and reference Canadian mortgage and legal requirements.")
        
        # Combine all context
        full_context = "\n\n".join(context_parts)
        
        # Add current user message
        full_prompt = f"{full_context}\n\nHuman: {user_message}\nAssistant:"
        
        return full_prompt
    
    @classmethod
    def get_dynamic_followup_questions(cls, user_preferences: Dict[str, Any], intent: str) -> List[str]:
        """Generate dynamic follow-up questions based on user context"""
        questions = []
        
        if intent == "property_search":
            if not user_preferences.get("location"):
                questions.append("Which area or city interests you most? (Toronto, Vancouver, Montreal, etc.)")
            
            if not user_preferences.get("budget_max"):
                questions.append("What's your budget range? This helps me show you realistic options.")
            
            if not user_preferences.get("property_type"):
                questions.append("What type of property appeals to you? (house, condo, townhouse)")
            
            if not user_preferences.get("move_in_timeline"):
                questions.append("When are you hoping to move? This affects our search strategy.")
            
            if user_preferences.get("first_time_buyer") is None:
                questions.append("Is this your first time buying a home in Canada?")
        
        elif intent == "investment_inquiry":
            questions.extend([
                "What's your investment timeline - short-term appreciation or long-term rental income?",
                "Are you interested in residential or commercial investment properties?",
                "What's your risk tolerance for emerging vs established markets?"
            ])
        
        elif intent == "first_time_buyer":
            questions.extend([
                "Have you been pre-approved for a mortgage yet?",
                "Are you familiar with Canadian first-time buyer programs?",
                "What's your current living situation and timeline for moving?"
            ])
        
        return questions[:3]  # Limit to 3 questions to avoid overwhelming

# Utility functions for prompt enhancement

def enhance_with_canadian_context(text: str, property_type: str = None, location: str = None) -> str:
    """Enhance text with Canadian real estate context"""
    
    # Add Canadian terminology
    replacements = {
        "realtor": "realtor (licensed in Canada)",
        "mortgage": "Canadian mortgage",
        "down payment": "down payment (min 5% in Canada)",
        "closing": "closing (typically 30-60 days in Canada)"
    }
    
    enhanced_text = text
    for term, replacement in replacements.items():
        if term in enhanced_text.lower() and replacement not in enhanced_text:
            enhanced_text = enhanced_text.replace(term, replacement, 1)
    
    # Add location-specific context
    if location and "ontario" in location.lower():
        if "land transfer tax" not in enhanced_text.lower():
            enhanced_text += " Note: Ontario has provincial land transfer tax, with additional municipal tax in Toronto."
    
    return enhanced_text

def extract_key_variables_from_context(user_preferences: Dict, real_estate_context: Dict) -> Dict[str, str]:
    """Extract key variables for template formatting"""
    variables = {}
    
    if user_preferences:
        variables.update({
            "preferred_location": user_preferences.get("location", "your preferred area"),
            "budget_range": f"${user_preferences.get('budget_max', 0):,} CAD" if user_preferences.get('budget_max') else "your budget",
            "property_type": user_preferences.get("property_type", "property"),
            "bedrooms": str(user_preferences.get("bedrooms", "")) if user_preferences.get("bedrooms") else "",
        })
    
    if real_estate_context:
        if real_estate_context.get("market_data"):
            variables["market_trends"] = "Current market data shows positive trends"
        if real_estate_context.get("broker_assigned"):
            variables["broker_status"] = "You have a dedicated broker assigned"
    
    # Default values
    variables.setdefault("preferred_location", "Canada")
    variables.setdefault("budget_range", "your budget")
    variables.setdefault("property_type", "property")
    
    return variables

# Testing and validation
if __name__ == "__main__":
    print("🧪 Testing Real Estate Prompt Templates...")
    
    # Test template retrieval
    greeting_template = RealEstatePromptTemplates.get_template("greeting_conversation", "en")
    if greeting_template:
        print("✅ Template retrieval works")
        print(f"   Template: {greeting_template.name}")
        print(f"   Variables: {greeting_template.variables}")
    
    # Test template formatting
    test_variables = {
        "location": "Toronto",
        "area_type": "major metropolitan city",
        "neighborhood_character": "diverse and vibrant",
        "transportation_info": "excellent TTC and GO Transit access",
        "education_info": "top-rated schools and universities",
        "amenities_info": "world-class dining, shopping, and entertainment",
        "market_trends": "steady appreciation with strong demand",
        "property_type": "condos",
        "price_range": "$600,000 - $1,200,000 CAD"
    }
    
    formatted = RealEstatePromptTemplates.format_template("location_inquiry", test_variables, "en")
    if "Toronto" in formatted:
        print("✅ Template formatting works")
    
    # Test context-enhanced prompt building
    test_user_prefs = {
        "location": "Toronto",
        "budget_max": 800000,
        "property_type": "condo",
        "first_time_buyer": True
    }
    
    enhanced_prompt = RealEstatePromptTemplates.build_context_enhanced_prompt(
        user_message="I'm looking for a condo in Toronto",
        user_preferences=test_user_prefs,
        intent="property_search"
    )
    
    if "Toronto" in enhanced_prompt and "first-time" in enhanced_prompt:
        print("✅ Context-enhanced prompt building works")
    
    # Test dynamic questions
    questions = RealEstatePromptTemplates.get_dynamic_followup_questions(
        {"location": "Toronto"}, 
        "property_search"
    )
    
    if questions and len(questions) <= 3:
        print("✅ Dynamic follow-up questions work")
        print(f"   Generated {len(questions)} questions")
    
    print("\n✅ All prompt template tests completed!")