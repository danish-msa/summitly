"""
ChatGPT-Style GPT-4 Service for Real Estate Chatbot
===================================================
Provides intelligent, context-aware responses using GPT-4/GPT-4o.

Features:
- Maintains full conversation history like ChatGPT
- Context-aware responses based on conversation state
- Smart property descriptions and summaries
- Natural language generation
- Follow-up question suggestions

Author: Summitly Team
Date: December 12, 2025
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from openai import OpenAI

logger = logging.getLogger(__name__)

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

# Global client
_client = None


def get_client() -> Optional[OpenAI]:
    """Get or create OpenAI client."""
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            logger.warning("⚠️ OPENAI_API_KEY not set")
            return None
        try:
            _client = OpenAI(api_key=OPENAI_API_KEY)
            logger.info("✅ OpenAI client initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI: {e}")
            return None
    return _client


# System prompt for real estate expert
REAL_ESTATE_SYSTEM_PROMPT = """You are a professional Canadian real estate assistant with deep expertise in the Greater Toronto Area (GTA) and Ontario real estate market.

**Your Expertise:**
- Toronto neighborhoods (Downtown, Yorkville, Liberty Village, North York, Scarborough, Etobicoke)
- GTA cities (Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington)
- Canadian real estate regulations (RECO, TREB, Tarion warranties)
- Ontario land transfer tax and first-time buyer rebates
- CMHC insurance requirements
- Toronto transit (TTC, GO Transit)
- Market trends and investment opportunities
- Condo vs house comparisons
- Pre-construction developments

**Your Communication Style:**
- Concise, clear, and conversational (like ChatGPT)
- 2-3 paragraphs maximum per response
- Use bullet points when listing multiple items
- Natural, friendly, professional tone
- Avoid real estate jargon unless necessary
- Always end with helpful suggestions

**Your Goal:**
Help users find their perfect property by understanding their needs, providing expert guidance, and maintaining context throughout the conversation.
"""


class ChatGPTStyleService:
    """
    GPT-4 service that behaves like ChatGPT for real estate conversations.
    """
    
    def __init__(self):
        """Initialize the service."""
        self.client = get_client()
        logger.info("ChatGPTStyleService initialized")
    
    def generate_response(
        self,
        user_message: str,
        conversation_state: Dict[str, Any],
        search_results: Optional[List[Dict]] = None,
        context: Optional[str] = None
    ) -> str:
        """
        Generate a ChatGPT-style response based on user message and conversation state.
        
        Args:
            user_message: The user's latest message
            conversation_state: Current conversation state (from ConversationState.to_dict())
            search_results: Optional property search results to reference
            context: Optional additional context
            
        Returns:
            Natural language response
        """
        if not self.client:
            return self._fallback_response(user_message, search_results)
        
        try:
            # Build conversation history
            messages = [{"role": "system", "content": REAL_ESTATE_SYSTEM_PROMPT}]
            
            # Add conversation history (last 10 turns for context)
            history = conversation_state.get('conversation_history', [])
            for turn in history[-10:]:
                messages.append({
                    "role": turn['role'],
                    "content": turn['content']
                })
            
            # Add current state context
            state_summary = self._build_state_summary(conversation_state, search_results)
            if state_summary:
                messages.append({
                    "role": "system",
                    "content": f"Current search context:\n{state_summary}"
                })
            
            # Add user message
            messages.append({"role": "user", "content": user_message})
            
            # Call GPT-4
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=500,  # Keep responses concise
            )
            
            answer = response.choices[0].message.content.strip()
            logger.info(f"✅ Generated response ({len(answer)} chars)")
            return answer
        
        except Exception as e:
            logger.error(f"❌ GPT-4 error: {e}")
            return self._fallback_response(user_message, search_results)
    
    def generate_property_summary(
        self,
        properties: List[Dict],
        search_criteria: Dict[str, Any]
    ) -> str:
        """
        Generate a natural summary of property search results.
        
        Args:
            properties: List of property dictionaries
            search_criteria: Search filters used
            
        Returns:
            Conversational summary
        """
        if not self.client:
            return self._fallback_property_summary(properties, search_criteria)
        
        try:
            # Build property data summary
            property_summaries = []
            for i, prop in enumerate(properties[:5], 1):  # Top 5 properties
                summary = f"{i}. "
                if prop.get('address'):
                    summary += f"{prop['address']}, "
                if prop.get('bedrooms'):
                    summary += f"{prop['bedrooms']} bed, "
                if prop.get('bathrooms'):
                    summary += f"{prop['bathrooms']} bath, "
                if prop.get('price'):
                    summary += f"${prop['price']:,}"
                property_summaries.append(summary)
            
            criteria_text = self._format_search_criteria(search_criteria)
            
            prompt = f"""Summarize these property search results in a conversational way:

Search Criteria: {criteria_text}
Total Results: {len(properties)}

Top Properties:
{chr(10).join(property_summaries)}

Provide a brief, friendly summary (2-3 sentences) highlighting the key findings."""
            
            messages = [
                {"role": "system", "content": REAL_ESTATE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
            
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=200,
            )
            
            summary = response.choices[0].message.content.strip()
            logger.info("✅ Generated property summary")
            return summary
        
        except Exception as e:
            logger.error(f"❌ Property summary error: {e}")
            return self._fallback_property_summary(properties, search_criteria)
    
    def generate_follow_up_suggestions(
        self,
        conversation_state: Dict[str, Any],
        search_results: Optional[List[Dict]] = None
    ) -> List[str]:
        """
        Generate 3 contextual follow-up question suggestions.
        
        Args:
            conversation_state: Current conversation state
            search_results: Optional search results
            
        Returns:
            List of 3 suggestion strings
        """
        suggestions = []
        
        # Get current filters
        location = conversation_state.get('location')
        bedrooms = conversation_state.get('bedrooms')
        property_type = conversation_state.get('property_type')
        listing_type = conversation_state.get('listing_type', 'sale')
        price_range = conversation_state.get('price_range')
        amenities = conversation_state.get('amenities', [])
        
        has_results = search_results and len(search_results) > 0
        
        # Suggestion 1: Toggle sale/rent
        if listing_type == 'sale':
            suggestions.append("Show me rentals instead")
        else:
            suggestions.append("Show me properties for sale")
        
        # Suggestion 2: Adjust bedrooms or property type
        if bedrooms:
            if bedrooms == 2:
                suggestions.append("How about 3 bedrooms?")
            elif bedrooms >= 3:
                suggestions.append("Show me 2 bedroom options")
            else:
                suggestions.append("Show me 2 bedroom properties")
        elif property_type:
            if property_type == 'condo':
                suggestions.append("What about townhouses?")
            else:
                suggestions.append("Show me condos instead")
        else:
            suggestions.append("Filter by number of bedrooms")
        
        # Suggestion 3: Add amenities, adjust price, or explore details
        if has_results:
            if not amenities:
                suggestions.append("Show properties with pools")
            elif len(search_results) > 3:
                suggestions.append("Tell me more about the first property")
            else:
                suggestions.append("Show similar properties nearby")
        else:
            if price_range and price_range[1]:
                # Suggest increasing budget
                suggestions.append("Increase my budget range")
            elif location:
                suggestions.append(f"Show properties near {location}")
            else:
                suggestions.append("Adjust my search criteria")
        
        logger.info(f"✅ Generated {len(suggestions)} follow-up suggestions")
        return suggestions[:3]  # Always return exactly 3
    
    def _build_state_summary(
        self, 
        state: Dict[str, Any],
        search_results: Optional[List[Dict]] = None
    ) -> str:
        """Build a text summary of conversation state for GPT-4 context."""
        parts = []
        
        if state.get('location'):
            parts.append(f"Location: {state['location']}")
        if state.get('bedrooms'):
            parts.append(f"Bedrooms: {state['bedrooms']}")
        if state.get('bathrooms'):
            parts.append(f"Bathrooms: {state['bathrooms']}")
        if state.get('property_type'):
            parts.append(f"Type: {state['property_type']}")
        if state.get('listing_type'):
            parts.append(f"Listing: {state['listing_type']}")
        if state.get('price_range'):
            min_p, max_p = state['price_range']
            if min_p and max_p:
                parts.append(f"Price: ${min_p:,} - ${max_p:,}")
            elif max_p:
                parts.append(f"Max Price: ${max_p:,}")
            elif min_p:
                parts.append(f"Min Price: ${min_p:,}")
        if state.get('amenities'):
            parts.append(f"Amenities: {', '.join(state['amenities'])}")
        
        if search_results:
            parts.append(f"Search Results: {len(search_results)} properties found")
        
        return "\n".join(parts) if parts else "No search criteria set yet"
    
    def _format_search_criteria(self, criteria: Dict[str, Any]) -> str:
        """Format search criteria into readable text."""
        parts = []
        
        if criteria.get('location'):
            parts.append(f"{criteria['location']}")
        if criteria.get('bedrooms'):
            parts.append(f"{criteria['bedrooms']} bedrooms")
        if criteria.get('property_type'):
            parts.append(f"{criteria['property_type']}")
        if criteria.get('listing_type'):
            parts.append(f"for {criteria['listing_type']}")
        
        return ", ".join(parts) if parts else "general search"
    
    def _fallback_response(
        self, 
        message: str, 
        results: Optional[List[Dict]] = None
    ) -> str:
        """Generate a basic response when GPT-4 is unavailable."""
        if results:
            count = len(results)
            if count == 0:
                return "I couldn't find any properties matching your criteria. Try adjusting your search filters."
            else:
                return f"I found {count} {'property' if count == 1 else 'properties'} matching your search. What would you like to know about them?"
        else:
            return "I'm here to help you find properties. What are you looking for?"
    
    def _fallback_property_summary(
        self, 
        properties: List[Dict],
        criteria: Dict[str, Any]
    ) -> str:
        """Generate basic property summary when GPT-4 unavailable."""
        count = len(properties)
        criteria_text = self._format_search_criteria(criteria)
        
        if count == 0:
            return f"No properties found matching: {criteria_text}"
        elif count == 1:
            return f"Found 1 property matching: {criteria_text}"
        else:
            return f"Found {count} properties matching: {criteria_text}"


# Global service instance
chatgpt_service = ChatGPTStyleService()


def generate_chatgpt_response(
    user_message: str,
    conversation_state: Dict[str, Any],
    search_results: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """
    Main function to generate complete ChatGPT-style response.
    
    Args:
        user_message: User's message
        conversation_state: Current conversation state
        search_results: Optional search results
        
    Returns:
        Dictionary with:
            - response: Main response text
            - suggestions: List of 3 follow-up suggestions
            - properties: Search results (if any)
    """
    service = chatgpt_service
    
    # Generate main response
    response = service.generate_response(
        user_message=user_message,
        conversation_state=conversation_state,
        search_results=search_results
    )
    
    # Generate follow-up suggestions
    suggestions = service.generate_follow_up_suggestions(
        conversation_state=conversation_state,
        search_results=search_results
    )
    
    # Build complete response
    result = {
        'response': response,
        'suggestions': suggestions,
    }
    
    if search_results:
        result['properties'] = search_results
        result['property_count'] = len(search_results)
    
    return result


if __name__ == "__main__":
    # Test the service
    print("🧪 Testing ChatGPTStyleService...\n")
    
    service = ChatGPTStyleService()
    
    # Test 1: Basic response
    print("1️⃣  Testing basic response generation")
    state = {
        'location': 'Toronto',
        'bedrooms': 2,
        'property_type': 'condo',
        'listing_type': 'sale',
        'conversation_history': []
    }
    
    response = service.generate_response(
        user_message="Show me 2 bedroom condos in Toronto",
        conversation_state=state
    )
    print(f"Response: {response[:100]}...\n")
    
    # Test 2: Follow-up suggestions
    print("2️⃣  Testing follow-up suggestions")
    suggestions = service.generate_follow_up_suggestions(state)
    for i, suggestion in enumerate(suggestions, 1):
        print(f"   {i}. {suggestion}")
    print()
    
    # Test 3: Property summary
    print("3️⃣  Testing property summary")
    mock_properties = [
        {'address': '123 King St', 'bedrooms': 2, 'bathrooms': 2, 'price': 650000},
        {'address': '456 Queen St', 'bedrooms': 2, 'bathrooms': 1, 'price': 580000},
    ]
    summary = service.generate_property_summary(
        properties=mock_properties,
        search_criteria={'location': 'Toronto', 'bedrooms': 2}
    )
    print(f"Summary: {summary}\n")
    
    print("✅ All tests completed!")
