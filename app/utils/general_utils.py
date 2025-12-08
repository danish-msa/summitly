"""
General utility functions for the Voice Assistant
"""
from typing import Dict, List, Optional
import re


def is_affirmative_response(text: str) -> bool:
    """Check if user response is affirmative"""
    affirmatives = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'y', 'absolutely', 'definitely']
    return any(word in text.lower().split() for word in affirmatives)


def is_negative_response(text: str) -> bool:
    """Check if user response is negative"""
    negatives = ['no', 'nope', 'not', 'never', 'none', 'cancel', 'stop', 'quit', 'exit']
    return any(word in text.lower().split() for word in negatives)


def extract_price_number(price_str: str) -> int:
    """Extract numeric price from price string like '$850,000'"""
    try:
        # Remove all non-digit characters except decimal point
        cleaned = re.sub(r'[^\d.]', '', str(price_str))
        return int(float(cleaned))
    except:
        return 0


def extract_location_from_message(message: str) -> str:
    """Extract location/neighborhood from user message"""
    message_lower = message.lower()
    
    # Common Toronto neighborhoods
    toronto_areas = [
        "yorkville", "downtown", "north york", "scarborough", "etobicoke", 
        "mississauga", "markham", "richmond hill", "vaughan", "brampton",
        "king west", "entertainment district", "financial district",
        "distillery district", "liberty village", "queen west", "kensington market",
        "corktown", "riverdale", "leslieville", "beaches", "rosedale",
        "forest hill", "lawrence park", "leaside", "danforth"
    ]
    
    for area in toronto_areas:
        if area in message_lower:
            return area.title()
    
    # Check for general city mentions
    if "toronto" in message_lower:
        return "Toronto"
    elif "vancouver" in message_lower:
        return "Vancouver"
    elif "montreal" in message_lower:
        return "Montreal"
    elif "calgary" in message_lower:
        return "Calgary"
    elif "ottawa" in message_lower:
        return "Ottawa"
    
    return "Toronto"  # Default to Toronto


def generate_follow_up_questions(text: str, topic: str) -> List[str]:
    """Generate intelligent follow-up questions based on content"""
    questions = []
    
    # Extract key entities from text
    has_price = bool(re.search(r'\$[\d,]+', text))
    has_location = bool(re.search(r'\b(?:Toronto|Mississauga|Brampton|Ottawa|Vancouver)\b', text, re.IGNORECASE))
    has_property_type = bool(re.search(r'\b(?:condo|house|townhouse|apartment)\b', text, re.IGNORECASE))
    
    # Generate contextual questions
    if has_price:
        questions.append("What's your budget range for comparison?")
    
    if has_location:
        questions.extend([
            "Would you like to explore nearby areas?",
            "Are you interested in neighborhood amenities?",
            "Should I show you school ratings for this area?"
        ])
    
    if has_property_type:
        questions.append("Would you like to see similar property types?")
    
    # Add generic intelligent questions
    if 'investment' in text.lower() or 'roi' in text.lower():
        questions.append("Would you like an investment analysis?")
    
    if 'neighborhood' in text.lower() or 'area' in text.lower():
        questions.append("Should I provide detailed area insights?")
    
    if 'school' in text.lower():
        questions.append("Do you need school district information?")
    
    # Ensure we have at least 2-3 questions
    default_questions = [
        "Would you like to see comparable properties?",
        "Should I analyze the local market trends?",
        "Do you want neighborhood amenities information?"
    ]
    
    questions.extend(default_questions)
    
    # Return unique questions, limited to 3
    return list(dict.fromkeys(questions))[:3]


def clean_text_for_tts(text: str) -> str:
    """Clean text for text-to-speech processing"""
    # Remove emojis
    clean_text = re.sub(r'[🏠✨📸🔗💬📍💰🌟🎯]', '', text)
    # Remove markdown bold
    clean_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_text)
    # Remove markdown links
    clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)
    return clean_text.strip()