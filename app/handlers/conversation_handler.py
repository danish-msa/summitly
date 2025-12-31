"""
Conversation processing and session management handlers
"""
from typing import Dict, List, Optional
from app.models.models import Session
from app.config.config import LEAD_COLLECTION_QUESTIONS


def extract_property_preferences_naturally(user_text: str, session: Session) -> Dict:
    """Extract property preferences from natural conversation"""
    try:
        user_lower = user_text.lower().strip()
        
        # Initialize extracted data
        extracted = {}
        
        # Extract location - consistent with main search logic with typo handling
        location_keywords = {
            'mississauga': 'Mississauga',
            'missiauga': 'Mississauga',
            'mississuaga': 'Mississauga',
            'markham': 'Markham', 
            'vaughan': 'Vaughan',
            'vaughn': 'Vaughan',
            'brampton': 'Brampton',
            'toronto': 'Toronto',
            'toranto': 'Toronto',
            'scarborough': 'Scarborough',
            'scarbrough': 'Scarborough',
            'north york': 'North York',
            'northyork': 'North York',
            'etobicoke': 'Etobicoke',
            'etobicok': 'Etobicoke',
            'richmond hill': 'Richmond Hill',
            'richmondhill': 'Richmond Hill',
            'oakville': 'Oakville',
            'oakvile': 'Oakville',
            'burlington': 'Burlington',
            'hamilton': 'Hamilton'
        }
        
        # Find the most specific location match
        for keyword, city_name in location_keywords.items():
            if keyword in user_lower:
                extracted['location'] = city_name
                print(f"🎯 [HANDLER LOCATION] Found '{keyword}' -> {city_name}")
                break
        
        # Extract property type
        if any(word in user_lower for word in ['house', 'home', 'detached']):
            extracted['property_type'] = 'House'
        elif any(word in user_lower for word in ['condo', 'condominium', 'apartment']):
            extracted['property_type'] = 'Condo'
        elif 'townhouse' in user_lower or 'townhome' in user_lower:
            extracted['property_type'] = 'Townhouse'
        
        # Extract budget (simple pattern matching)
        import re
        budget_match = re.search(r'\$?(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|million|m)?', user_lower)
        if budget_match:
            amount_str = budget_match.group(1).replace(',', '')
            amount = float(amount_str)
            
            # Handle k/thousand/million suffixes
            if 'k' in user_lower or 'thousand' in user_lower:
                amount *= 1000
            elif 'million' in user_lower or 'm' in user_lower:
                amount *= 1000000
                
            extracted['budget'] = f"${amount:,.0f}"
        
        # Extract bedrooms/bathrooms
        bed_match = re.search(r'(\d+)\s*(?:bed|bedroom)', user_lower)
        if bed_match:
            extracted['bedrooms'] = int(bed_match.group(1))
            
        bath_match = re.search(r'(\d+)\s*(?:bath|bathroom)', user_lower)
        if bath_match:
            extracted['bathrooms'] = int(bath_match.group(1))
        
        print(f"🔍 Extracted preferences: {extracted}")
        return extracted
    
    except Exception as e:
        print(f"❌ Error extracting preferences: {e}")
        return {}


def handle_property_conversation(user_text: str, session: Session) -> str:
    """Handle natural conversation after properties are shown"""
    user_lower = user_text.lower().strip()
    
    # Natural conversation responses
    if any(word in user_lower for word in ['more', 'other', 'different', 'else']):
        return "I'd be happy to show you more properties! What specific features are you looking for?"
    
    elif any(word in user_lower for word in ['interested', 'like', 'love', 'good']):
        return "Great! I'm glad you found something interesting. Would you like more details about this property or see similar options?"
    
    elif any(word in user_lower for word in ['budget', 'price', 'cheaper', 'expensive']):
        return "I can help you find properties within your budget range. What's your preferred price range?"
    
    elif any(word in user_lower for word in ['location', 'area', 'neighborhood', 'where']):
        return "Location is important! Which areas are you most interested in? I can show you properties in specific neighborhoods."
    
    elif any(word in user_lower for word in ['tell', 'about', 'analysis', 'analyze']):
        return "I can provide detailed analysis of any property including market trends, neighborhood insights, and investment potential. Which property would you like me to analyze?"
    
    else:
        return "I'm here to help with your property search! You can ask about specific areas, property types, or request detailed analysis of any listing."


def process_conversation_stage(session: Session, user_text: str) -> str:
    """Process conversation with Summitly integration and lead management"""
    print(f"\n🔄 Processing stage: {session.stage}")
    
    # Check for location insights intent (before property search)
    user_lower = user_text.lower().strip()
    
    location_insight_keywords = [
        'tell me about', 'what is', 'what\'s', 'about', 'area', 'neighborhood',
        'live in', 'living in', 'move to', 'moving to', 'relocate to',
        'community', 'schools', 'education', 'safety', 'transport', 'lifestyle',
        'insights', 'market', 'prices', 'demographics', 'amenities'
    ]
    
    # Location names for insights
    insight_locations = [
        'toronto', 'mississauga', 'vancouver', 'markham', 'richmond hill',
        'waterfront', 'downtown', 'north york', 'scarborough', 'etobicoke',
        'port credit', 'square one', 'unionville', 'thornhill'
    ]
    
    has_location_insight_intent = any(keyword in user_lower for keyword in location_insight_keywords)
    has_location_mention = any(location in user_lower for location in insight_locations)
    
    if has_location_insight_intent and has_location_mention:
        # Extract location for insights
        for location in insight_locations:
            if location in user_lower:
                session.stage = 'location_insights'
                session.user_data['insight_location'] = location.title()
                return f"I'll provide comprehensive insights about {location.title()}. Let me gather the latest market data, demographics, amenities, and lifestyle information for this area."
    
    # Check if user is directly asking for properties (bypass greeting flow)
    property_keywords = ['show me properties', 'find properties', 'search properties', 'properties in', 'looking for properties', 'want to see properties', 'show properties', 'search for properties', 'find me properties']
    location_indicators = ['in toronto', 'in mississauga', 'in markham', 'in brampton', 'in ontario', 'in scarborough', 'in north york']
    
    # Direct property request detection
    is_property_request = (
        any(keyword in user_lower for keyword in property_keywords) or
        any(location in user_lower for location in location_indicators) or
        ('properties' in user_lower and ('show' in user_lower or 'find' in user_lower or 'search' in user_lower))
    )
    
    if is_property_request:
        session.stage = 'natural_conversation'
        return extract_property_preferences_naturally(user_text, session)
    
    if session.stage == 'greeting':
        session.stage = 'natural_conversation'
        return "Hello! I'm your AI real estate assistant. I can help you find properties, provide market insights, or analyze specific areas. What would you like to explore today?"
    
    elif session.stage == 'natural_conversation':
        # Try to extract preferences and provide conversational response
        preferences = extract_property_preferences_naturally(user_text, session)
        session.user_data.update(preferences)
        
        if preferences:
            return f"I understand you're looking for properties. Based on our conversation, let me search for options that match your preferences."
        else:
            return handle_property_conversation(user_text, session)
    
    elif session.stage == 'ask_form_consent':
        from utils.general_utils import is_affirmative_response
        if is_affirmative_response(user_text):
            session.stage = 'form'
            return f"Great! Let's start with some details. {LEAD_COLLECTION_QUESTIONS[0][1]}"
        else:
            session.stage = 'done'
            return "No problem! Feel free to continue browsing properties or ask me any questions about real estate."
    
    elif session.stage == 'ready_to_search':
        session.stage = 'done'
        return "Perfect! I'm ready to help you search for properties based on your preferences."
    
    elif session.stage == 'qa':
        # Handle Q&A stage
        return f"That's a great question about real estate. Let me provide you with detailed information..."
    
    elif session.stage == 'form':
        # Handle form collection
        if session.question_index < len(LEAD_COLLECTION_QUESTIONS):
            key, _ = LEAD_COLLECTION_QUESTIONS[session.question_index]
            session.user_data[key] = user_text
            session.question_index += 1
            
            if session.question_index < len(LEAD_COLLECTION_QUESTIONS):
                _, next_question = LEAD_COLLECTION_QUESTIONS[session.question_index]
                return next_question
            else:
                # Form complete
                session.stage = 'form_complete'
                return "Thank you for providing all the details! I'm now assigning you to one of our expert brokers who will contact you shortly."
        else:
            session.stage = 'done'
            return "Thank you for the information!"
    
    elif session.stage == 'done':
        return handle_property_conversation(user_text, session)
    
    return "I'm here to help! Ask about properties or let's fill out our form."


def generate_contextual_response(user_message: str, user_preferences: Dict) -> str:
    """Generate contextual response when advanced services are unavailable"""
    location = user_preferences.get('location', 'Toronto')
    budget = user_preferences.get('budget_max', 800000)
    property_type = user_preferences.get('property_type', 'property')
    
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['buy', 'purchase', 'looking for', 'find', 'search']):
        return f"I can help you find {property_type}s in {location} within your budget range of ${budget:,}. What specific features are you looking for?"
    
    elif any(word in message_lower for word in ['invest', 'investment', 'roi', 'rental']):
        return f"For investment properties in {location}, I'd recommend looking at areas with strong rental demand and growth potential. Would you like me to analyze specific properties?"
    
    elif any(word in message_lower for word in ['market', 'price', 'trend', 'analysis']):
        return f"The {location} market has been showing steady activity. I can provide detailed market analysis for specific neighborhoods or property types. What area interests you most?"
    
    else:
        return "I'm here to help with all your real estate needs. You can ask about properties, market trends, neighborhood insights, or investment opportunities."