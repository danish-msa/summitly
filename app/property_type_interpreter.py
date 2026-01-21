"""
Property Type Interpreter
========================
Analyzes user messages to determine if they're looking for residential or commercial properties.
Routes to appropriate handler (voice_assistant_clean.py or commercialapp.py).

Uses OpenAI GPT-4 for accurate classification.
"""

import os
import re
from typing import Dict, List, Literal, Optional, Tuple
from enum import Enum
from pathlib import Path

# Load .env file manually
def load_env_file():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / 'config' / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env_file()

# Lazy import OpenAI to avoid initialization errors
_openai_client = None

def get_openai_client():
    """Get or create OpenAI client (lazy initialization)"""
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


class PropertyType(str, Enum):
    """Property type classification"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    CONDO = "condo"  # Condo properties (new)
    MIXED = "mixed"  # User wants both
    UNKNOWN = "unknown"


class PropertyTypeInterpreter:
    """
    Fast property type detection with high accuracy.
    Uses keyword matching for 95% of cases, GPT-4 for edge cases.
    """
    
    # Commercial property indicators (STRONG signals)
    COMMERCIAL_KEYWORDS = {
        # Business types
        "office", "retail", "store", "shop", "restaurant", "warehouse", "industrial",
        "commercial", "business", "storefront", "plaza", "mall", "strip mall",
        "commercial building", "commercial property",
        
        # Specific commercial uses
        "bakery", "salon", "spa", "gym", "fitness", "medical office", "clinic",
        "auto shop", "mechanic", "car wash", "gas station", "convenience store",
        "grocery store", "pharmacy", "bank", "hotel", "motel", "inn",
        "daycare", "school building", "church", "theater", "cinema",
        
        # Commercial zoning/features
        "zoned commercial", "commercial zoning", "c1", "c2", "c3", "c4",
        "loading dock", "storefront", "commercial kitchen", "commercial space",
        
        # Investment terms
        "investment property", "income property", "multi-tenant", "tenants",
        "cap rate", "noi", "net operating income", "lease", "leased",
        
        # Mixed use (leans commercial)
        "mixed use", "mixed-use", "live/work", "work/live",
        
        # Building types
        "commercial building", "office building", "industrial building",
        "retail building", "shopping center", "business park"
    }
    
    # Residential property indicators (STRONG signals)
    RESIDENTIAL_KEYWORDS = {
        # Property types
        "house", "home", "condo", "condominium", "apartment", "townhouse",
        "townhome", "duplex", "triplex", "fourplex", "bungalow", "cottage",
        "villa", "mansion", "estate", "detached", "semi-detached", "semi detached",
        
        # Room specifications
        "bedroom", "bedrooms", "bathroom", "bathrooms", "master bedroom",
        "guest room", "family room", "living room", "dining room",
        
        # Residential features
        "backyard", "front yard", "driveway", "garage", "finished basement",
        "swimming pool", "hot tub", "deck", "patio", "fireplace",
        
        # Family/lifestyle
        "family home", "starter home", "retirement home", "downsizing",
        "first time buyer", "growing family", "kids", "children",
        
        # Zoning
        "residential zoning", "r1", "r2", "r3", "r4", "residential area",
        
        # Common residential phrases
        "place to live", "somewhere to live", "moving to", "relocating to"
    }
    
    # Bedroom patterns (STRONG residential signal)
    BEDROOM_PATTERN = re.compile(r'\b(\d+)\s*[+-]?\s*(bed|bedroom|br|bd)\b', re.IGNORECASE)
    
    def __init__(self):
        """Initialize interpreter"""
        self.use_gpt_fallback = True
    
    def interpret(self, message: str, context: Optional[List[str]] = None) -> Dict:
        """
        Determine property type from user message using OpenAI GPT-4.
        ALWAYS uses GPT-4 for accurate classification instead of keyword matching.
        
        Args:
            message: User's input message
            context: Previous messages in conversation (optional)
        
        Returns:
            {
                "property_type": PropertyType,
                "confidence": float (0-1),
                "reasoning": str,
                "method": "gpt4"
            }
        """
        # ALWAYS use GPT-4 for accurate classification
        return self._gpt4_classify(message, context)
    
    def _keyword_match(self, message_lower: str) -> Dict:
        """Fast keyword-based classification"""
        commercial_score = 0
        residential_score = 0
        matched_commercial = []
        matched_residential = []
        
        # Check commercial keywords (higher weight for "commercial" itself)
        for keyword in self.COMMERCIAL_KEYWORDS:
            if keyword in message_lower:
                # Give extra weight to "commercial" word itself
                weight = 3 if "commercial" in keyword else 1
                commercial_score += weight
                matched_commercial.append(keyword)
        
        # Check residential keywords
        for keyword in self.RESIDENTIAL_KEYWORDS:
            if keyword in message_lower:
                residential_score += 1
                matched_residential.append(keyword)
        
        # Bedroom pattern is VERY strong residential signal
        if self.BEDROOM_PATTERN.search(message_lower):
            residential_score += 5
            matched_residential.append("bedroom count")
        
        # Determine property type
        total_score = commercial_score + residential_score
        
        if total_score == 0:
            return {
                "property_type": PropertyType.UNKNOWN,
                "confidence": 0.0,
                "reasoning": "No clear indicators found",
                "method": "keyword",
                "matched_keywords": {}
            }
        
        # Calculate confidence
        if commercial_score > residential_score:
            confidence = commercial_score / (total_score + 2)  # +2 prevents overconfidence
            property_type = PropertyType.COMMERCIAL
            keywords = matched_commercial
        elif residential_score > commercial_score:
            confidence = residential_score / (total_score + 2)
            property_type = PropertyType.RESIDENTIAL
            keywords = matched_residential
        else:
            # Equal scores - could be mixed
            confidence = 0.5
            property_type = PropertyType.MIXED
            keywords = matched_commercial + matched_residential
        
        reasoning = f"Found {len(keywords)} {property_type.value} indicators: {', '.join(keywords[:3])}"
        
        return {
            "property_type": property_type,
            "confidence": min(confidence, 0.95),  # Cap at 95% for keyword matching
            "reasoning": reasoning,
            "method": "keyword",
            "matched_keywords": {
                "commercial": matched_commercial,
                "residential": matched_residential
            }
        }
    
    def _check_context(self, context: List[str]) -> Dict:
        """Check conversation context for property type hints"""
        if not context:
            return {
                "property_type": PropertyType.UNKNOWN,
                "confidence": 0.0,
                "reasoning": "No context available",
                "method": "context"
            }
        
        # Analyze last 3 messages
        recent_context = " ".join(context[-3:]).lower()
        
        # Use keyword matching on context
        result = self._keyword_match(recent_context)
        result["method"] = "context"
        result["reasoning"] = f"From conversation context: {result['reasoning']}"
        
        # Lower confidence slightly for context-based
        result["confidence"] *= 0.9
        
        return result
    
    def _gpt4_classify(self, message: str, context: Optional[List[str]] = None) -> Dict:
        """Use GPT-4 to classify ambiguous messages"""
        try:
            client = get_openai_client()
            
            context_str = ""
            if context:
                context_str = "Previous messages:\n" + "\n".join(f"- {msg}" for msg in context[-3:])
            
            prompt = f"""Analyze this real estate query and determine the property type the user is looking for.

Current message: "{message}"
{context_str}

Respond with ONLY a JSON object:
{{
    "property_type": "residential" | "commercial" | "condo" | "mixed" | "unknown",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation"
}}

CRITICAL CLASSIFICATION RULES:
- "condo": User explicitly says "condo", "condominium", "condo apartment", or "apartment condo". THIS IS HIGHEST PRIORITY - if user says "condo", ALWAYS return "condo" NOT "residential".
- "residential": Houses, detached homes, semi-detached, townhouses, bungalows, cottages - but NOT condos
- "commercial": Offices, retail, industrial, business properties, restaurants, spas, salons, clinics, shops, stores
- "mixed": User wants multiple types
- "unknown": Not enough information

IMPORTANT:
- Words "condo" or "condominium" in the query → ALWAYS return "condo" (confidence 0.95+)
- Bedrooms + condo → "condo" 
- Bedrooms without condo → "residential"
- Spa, salon, restaurant, retail, office, shop, store → "commercial"

Examples:
- "2 bedroom condo in Toronto" → condo (explicit "condo" mentioned)
- "condos under $700K" → condo (explicit "condo" mentioned)  
- "condo with gym and pool" → condo (explicit "condo" mentioned)
- "3 bedroom house in Ottawa" → residential (house, not condo)
- "townhouse with backyard" → residential (townhouse is residential)
- "spa space in Toronto" → commercial (spa = business)
- "office space downtown" → commercial (office = commercial)
- "retail store" → commercial (retail = commercial)
- "property in Ottawa" → unknown (need more info)
"""
            
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=200
            )
            
            import json
            result = json.loads(response.choices[0].message.content.strip())
            result["method"] = "gpt4"
            
            return {
                "property_type": PropertyType(result.get("property_type", "unknown")),
                "confidence": float(result.get("confidence", 0.5)),
                "reasoning": result.get("reasoning", "GPT-4 analysis"),
                "method": "gpt4"
            }
            
        except Exception as e:
            print(f"⚠️ GPT-4 classification failed: {e}")
            return {
                "property_type": PropertyType.UNKNOWN,
                "confidence": 0.0,
                "reasoning": f"GPT-4 error: {str(e)}",
                "method": "gpt4"
            }


# Singleton instance
_interpreter = None

def get_property_type_interpreter() -> PropertyTypeInterpreter:
    """Get singleton interpreter instance"""
    global _interpreter
    if _interpreter is None:
        _interpreter = PropertyTypeInterpreter()
    return _interpreter


# Convenience function
def classify_property_type(message: str, context: Optional[List[str]] = None) -> Dict:
    """
    Classify property type from message.
    
    Usage:
        result = classify_property_type("Show me 2 bedroom condos in Toronto")
        if result["property_type"] == PropertyType.RESIDENTIAL:
            # Route to residential handler
        elif result["property_type"] == PropertyType.COMMERCIAL:
            # Route to commercial handler
    """
    interpreter = get_property_type_interpreter()
    return interpreter.interpret(message, context)


if __name__ == "__main__":
    # Test cases
    test_messages = [
        "Show me 2 bedroom condos in Toronto",
        "Looking for office space downtown",
        "I need a retail store with good foot traffic",
        "Family home with backyard in Ottawa",
        "Commercial building for lease",
        "Apartment with parking",
        "Bakery for sale in Vancouver",
        "House near good schools",
        "Property in Montreal"  # Ambiguous
    ]
    
    interpreter = get_property_type_interpreter()
    
    print("=" * 80)
    print("PROPERTY TYPE INTERPRETER - TEST RESULTS")
    print("=" * 80)
    
    for msg in test_messages:
        result = interpreter.interpret(msg)
        icon = "🏠" if result["property_type"] == PropertyType.RESIDENTIAL else "🏢" if result["property_type"] == PropertyType.COMMERCIAL else "❓"
        print(f"\n{icon} Message: {msg}")
        print(f"   Type: {result['property_type'].value.upper()}")
        print(f"   Confidence: {result['confidence']:.0%}")
        print(f"   Method: {result['method']}")
        print(f"   Reasoning: {result['reasoning']}")
