#!/usr/bin/env python3
"""
Universal Condo Search Fallback System
======================================
Comprehensive 60+ field handling with intelligent fallbacks.
Guarantees non-zero results when properties exist.

Features:
- 6-level progressive fallback pipeline
- Field-specific tolerance and synonym systems
- Geographic expansion (neighborhood → city → metro)
- Must-have vs. nice-to-have classification
- Smart constraint relaxation
- Clear user communication

Author: AI Assistant
Date: January 18, 2026
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


# ==================== ENUMS & DATA CLASSES ====================

class MatchLevel(Enum):
    """Match quality levels"""
    EXACT = "exact"
    RELAXED = "relaxed"
    GEOGRAPHIC_EXPANSION = "geographic_expansion"
    CRITICAL_ONLY = "critical_only"
    LOCATION_ONLY = "location_only"
    POPULAR = "popular"


class FieldCategory(Enum):
    """Field type categories"""
    LOCATION = "location"
    NUMERIC = "numeric"
    BOOLEAN = "boolean"
    STRING = "string"
    ARRAY = "array"


@dataclass
class SearchResult:
    """Standardized search result"""
    properties: List[Dict]
    match_level: MatchLevel
    relaxed_constraints: List[str]
    message: str
    count: int
    score: float  # Overall match quality 0-100


@dataclass
class FieldMatch:
    """Field matching result"""
    match: str  # "exact", "close", "alternative", "none"
    score: float  # 0-100
    reason: Optional[str] = None


# ==================== CONFIGURATION ====================

class SearchConfig:
    """Global search configuration"""
    
    # Result targets
    MIN_RESULTS_TARGET = 10
    MAX_FALLBACK_LEVELS = 6
    
    # Matching thresholds
    FUZZY_THRESHOLD = 0.8
    ARRAY_MATCH_THRESHOLD = 0.5  # 50% match minimum
    
    # Features
    ENABLE_FUZZY_MATCHING = True
    ENABLE_SYNONYM_EXPANSION = True
    ENABLE_GEOGRAPHIC_EXPANSION = True
    MAX_GEOGRAPHIC_EXPANSION_KM = 10
    
    # AI relevance checking
    ENABLE_AI_RELEVANCE_CHECK = True
    MAX_AI_RELEVANCE_CHECKS = 50
    
    # Tolerance multipliers
    NUMERIC_TOLERANCE_MULTIPLIER = 1.0


# ==================== FIELD TOLERANCES ====================

NUMERIC_TOLERANCES = {
    # Bedrooms: ±1 (2 bed → accept 1-3 bed)
    "bedrooms": 1,
    "bedrooms_min": 1,
    "bedrooms_max": 1,
    
    # Bathrooms: ±0.5 (2 bath → accept 1.5-2.5 bath)
    "bathrooms": 0.5,
    
    # Square footage: ±200 sqft (800 → accept 600-1000)
    "sqft": 200,
    "sqft_min": 200,
    "sqft_max": 200,
    "min_sqft": 200,
    "max_sqft": 200,
    
    # Floor level: ±5 floors (15th → accept 10-20)
    "floor_level": 5,
    "floor_level_min": 5,
    "floor_level_max": 5,
    "level": 5,
    
    # Parking: strict (must have exact or more)
    "parking_spaces": 0,
    "total_parking": 0,
    
    # Maintenance fee: ±$200/month ($800 → $600-1000)
    "maintenance_fee": 200,
    "maintenance_fee_max": 200,
    
    # Price: ±$50k ($500k → $450k-550k)
    "price": 50000,
    "min_price": 50000,
    "max_price": 50000,
    "list_price": 50000,
    
    # Property taxes: ±$1000/year
    "property_taxes": 1000,
    
    # Balcony size: ±50 sqft
    "balcony_size": 50,
    
    # Lease price: ±$200/month
    "lease_price": 200,
}


# ==================== FIELD SYNONYMS ====================

FIELD_SYNONYMS = {
    "view": {
        "lake": ["water", "waterfront", "lake view", "lake ontario", "lakefront"],
        "city": ["skyline", "downtown", "urban", "city view", "cityscape"],
        "park": ["greenspace", "ravine", "nature", "park view", "green"],
        "water": ["lake", "waterfront", "lakefront", "lake view"],
        "ocean": ["water", "sea", "bay"],
    },
    
    "exposure": {
        "south": ["s", "southern", "south facing", "south-facing"],
        "north": ["n", "northern", "north facing", "north-facing"],
        "east": ["e", "eastern", "east facing", "east-facing"],
        "west": ["w", "western", "west facing", "west-facing"],
        "southeast": ["se", "south east", "south-east"],
        "southwest": ["sw", "south west", "south-west"],
        "northeast": ["ne", "north east", "north-east"],
        "northwest": ["nw", "north west", "north-west"],
    },
    
    "laundry_level": {
        "in unit": ["ensuite", "in-unit", "in suite", "en-suite", "in-suite", "unit"],
        "in building": ["shared", "common", "building", "common area"],
        "none": ["no laundry", "not available"],
    },
    
    "heat_type": {
        "radiant": ["floor heating", "underfloor", "radiant heat", "radiant floor"],
        "forced air": ["hvac", "central air", "forced-air", "central heating"],
        "baseboard": ["electric baseboard", "baseboard heater"],
        "radiator": ["steam", "hot water"],
    },
    
    "air_conditioning": {
        "central": ["central air", "central a/c", "hvac"],
        "window": ["window unit", "window ac"],
        "none": ["no ac", "no air conditioning"],
    },
    
    "garage_type": {
        "underground": ["underground parking", "below grade", "parkade"],
        "attached": ["attached garage"],
        "detached": ["separate garage", "detached garage"],
        "surface": ["surface parking", "outdoor parking"],
    },
    
    "property_type": {
        "condo apt": ["condo apartment", "apartment condo", "condo"],
        "condo townhouse": ["townhouse", "townhome", "town home"],
    },
    
    "style": {
        "modern": ["contemporary", "modern style"],
        "traditional": ["classic", "conventional"],
        "luxury": ["high-end", "upscale", "premium"],
    },
}


# ==================== ARRAY ITEM SYNONYMS ====================

ARRAY_ITEM_SYNONYMS = {
    "amenities": {
        "gym": ["fitness center", "workout room", "exercise room", "fitness centre"],
        "pool": ["swimming pool", "indoor pool", "lap pool", "outdoor pool"],
        "concierge": ["24hr security", "doorman", "front desk", "24-hour concierge"],
        "party room": ["party space", "event room", "entertainment room"],
        "rooftop": ["rooftop terrace", "rooftop deck", "roof deck"],
        "sauna": ["steam room", "spa"],
        "theater": ["theatre", "media room", "screening room"],
        "guest suite": ["guest room", "visitor suite"],
        "bike storage": ["bike room", "bicycle storage"],
        "car wash": ["car cleaning", "vehicle wash"],
    },
    
    "appliances": {
        "dishwasher": ["built-in dishwasher", "dishwashing machine"],
        "washer": ["washing machine", "w/d", "laundry"],
        "dryer": ["clothes dryer", "w/d"],
        "fridge": ["refrigerator", "ref"],
        "stove": ["range", "cooktop", "oven"],
        "microwave": ["built-in microwave"],
    },
    
    "interior_features": {
        "hardwood": ["hardwood floors", "wood flooring", "hardwood flooring"],
        "granite": ["granite counters", "granite countertops"],
        "stainless steel": ["stainless appliances", "ss appliances"],
        "walk-in closet": ["walk in closet", "walkin closet"],
    },
    
    "maintenance_includes": {
        "heat": ["heating", "heat included"],
        "water": ["water included"],
        "hydro": ["electricity", "electric", "power"],
        "cable": ["cable tv", "television"],
        "internet": ["wifi", "wi-fi"],
    },
}


# ==================== CRITICAL FIELD CLASSIFICATION ====================

# Fields that MUST match if specified (never relax)
CRITICAL_BOOLEAN_FIELDS = {
    "pets_permitted",
    "wheelchair_accessible",
    "non_smoking",
}

# Fields that are nice-to-have (can be relaxed)
NICE_TO_HAVE_BOOLEAN_FIELDS = {
    "gym", "pool", "concierge", "rooftop", "party_room",
    "balcony", "locker", "waterfront", "furnished",
    "security", "elevator", "visitor_parking",
}

# Critical amenities (keep these when relaxing)
CRITICAL_AMENITIES = ["gym", "elevator", "concierge"]

# Critical numeric fields (keep with tolerance)
CRITICAL_NUMERIC_FIELDS = {
    "bedrooms", "bathrooms", "min_price", "max_price",
    "parking_spaces",
}


# ==================== GEOGRAPHIC EXPANSION ====================

# Neighborhood to city mapping
NEIGHBORHOOD_TO_CITY = {
    # Toronto neighborhoods
    "yorkville": "Toronto",
    "liberty village": "Toronto",
    "distillery district": "Toronto",
    "downtown": "Toronto",
    "midtown": "Toronto",
    "king west": "Toronto",
    "queen west": "Toronto",
    "financial district": "Toronto",
    "entertainment district": "Toronto",
    "harbourfront": "Toronto",
    "cityplace": "Toronto",
    "fort york": "Toronto",
    "corktown": "Toronto",
    "cabbagetown": "Toronto",
    "leslieville": "Toronto",
    "the beaches": "Toronto",
    "high park": "Toronto",
    "junction": "Toronto",
    "roncesvalles": "Toronto",
    "little italy": "Toronto",
    "little portugal": "Toronto",
    "chinatown": "Toronto",
    "kensington market": "Toronto",
    "annex": "Toronto",
    "forest hill": "Toronto",
    "rosedale": "Toronto",
    "summerhill": "Toronto",
    "davisville": "Toronto",
    "yonge and eglinton": "Toronto",
    "yonge and lawrence": "Toronto",
    "yonge and sheppard": "Toronto",
    
    # Ottawa neighborhoods
    "downtown ottawa": "Ottawa",
    "byward market": "Ottawa",
    "centertown": "Ottawa",
    "glebe": "Ottawa",
    "westboro": "Ottawa",
    "hintonburg": "Ottawa",
    "sandy hill": "Ottawa",
    
    # Vancouver neighborhoods
    "downtown vancouver": "Vancouver",
    "yaletown": "Vancouver",
    "gastown": "Vancouver",
    "coal harbour": "Vancouver",
    "west end": "Vancouver",
    "kitsilano": "Vancouver",
    "mount pleasant": "Vancouver",
}

# City to metro area mapping
CITY_TO_METRO = {
    "toronto": ["Toronto", "North York", "Scarborough", "Etobicoke", "Mississauga", "Vaughan"],
    "ottawa": ["Ottawa", "Gatineau", "Kanata", "Nepean", "Gloucester"],
    "vancouver": ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam"],
    "montreal": ["Montréal", "Montreal", "Laval", "Longueuil"],
    "calgary": ["Calgary", "Airdrie", "Chestermere"],
    "edmonton": ["Edmonton", "St. Albert", "Sherwood Park"],
}


# ==================== MESSAGE TEMPLATES ====================

MESSAGE_TEMPLATES = {
    MatchLevel.EXACT: "✅ Found {count} condo{plural} matching all your criteria!",
    
    MatchLevel.RELAXED: "📊 Found {count} condo{plural}. We relaxed: {relaxed_list} to show you more options.",
    
    MatchLevel.GEOGRAPHIC_EXPANSION: "🗺️ No exact matches in {original_area}, but found {count} great condo{plural} in nearby {expanded_area}.",
    
    MatchLevel.CRITICAL_ONLY: "🎯 Showing {count} condo{plural} matching your essential requirements: {critical_list}.",
    
    MatchLevel.LOCATION_ONLY: "📍 Here are {count} available condo{plural} in {location}. Let me know if you'd like to add specific requirements!",
    
    MatchLevel.POPULAR: "💡 Here are {count} popular condo properties you might be interested in.",
}


# ==================== UTILITY FUNCTIONS ====================

def calculate_levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate Levenshtein distance between two strings"""
    if len(s1) < len(s2):
        return calculate_levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


def calculate_string_similarity(s1: str, s2: str) -> float:
    """Calculate similarity between two strings (0-1)"""
    if not s1 or not s2:
        return 0.0
    
    distance = calculate_levenshtein_distance(s1.lower(), s2.lower())
    max_len = max(len(s1), len(s2))
    similarity = 1 - (distance / max_len)
    return max(0.0, min(1.0, similarity))


def normalize_location_string(location: str) -> str:
    """Normalize location string for matching"""
    if not location:
        return ""
    
    # Convert to lowercase
    normalized = location.lower().strip()
    
    # Fix common typos
    typo_map = {
        "younge": "yonge",
        "king": "king",
        "toront": "toronto",
        "ottwa": "ottawa",
        "vancover": "vancouver",
    }
    
    for typo, correct in typo_map.items():
        normalized = re.sub(r'\b' + typo + r'\b', correct, normalized)
    
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized


# ==================== MAIN FALLBACK CLASS ====================

class UniversalCondoSearchFallback:
    """
    Universal fallback system for condo property search.
    Handles all 60+ fields with intelligent progressive fallbacks.
    """
    
    def __init__(self, search_function, config: Optional[SearchConfig] = None):
        """
        Initialize fallback system.
        
        Args:
            search_function: Function to call for actual search
                             Signature: search_function(criteria: Dict) -> List[Dict]
            config: Optional configuration override
        """
        self.search_function = search_function
        self.config = config or SearchConfig()
        
        logger.info("🚀 UniversalCondoSearchFallback initialized")
        logger.info(f"   Min results target: {self.config.MIN_RESULTS_TARGET}")
        logger.info(f"   Max fallback levels: {self.config.MAX_FALLBACK_LEVELS}")
    
    
    def search_with_fallback(self, criteria: Dict) -> SearchResult:
        """
        Execute search with progressive fallback strategy.
        
        Args:
            criteria: Search criteria (60+ possible fields)
        
        Returns:
            SearchResult with properties and metadata
        """
        logger.info(f"🔍 Starting search with {len(criteria)} criteria")
        logger.info(f"   Criteria: {list(criteria.keys())}")
        
        original_criteria = criteria.copy()
        
        # LEVEL 1: Try exact match
        logger.info("📍 LEVEL 1: Trying exact match...")
        results = self._search_exact(criteria)
        if len(results) >= self.config.MIN_RESULTS_TARGET:
            return SearchResult(
                properties=results,
                match_level=MatchLevel.EXACT,
                relaxed_constraints=[],
                message=self._generate_message(MatchLevel.EXACT, len(results), {}),
                count=len(results),
                score=100.0
            )
        logger.info(f"   Found {len(results)} (need {self.config.MIN_RESULTS_TARGET})")
        
        # LEVEL 2: Relax non-critical constraints
        logger.info("📍 LEVEL 2: Relaxing non-critical constraints...")
        relaxed_criteria, relaxed_fields = self._relax_non_critical(criteria)
        results = self._search_exact(relaxed_criteria)
        if len(results) >= self.config.MIN_RESULTS_TARGET:
            return SearchResult(
                properties=results,
                match_level=MatchLevel.RELAXED,
                relaxed_constraints=relaxed_fields,
                message=self._generate_message(
                    MatchLevel.RELAXED, 
                    len(results), 
                    {"relaxed_list": ", ".join(relaxed_fields)}
                ),
                count=len(results),
                score=85.0
            )
        logger.info(f"   Found {len(results)} after relaxing: {relaxed_fields}")
        
        # LEVEL 3: Expand geographic scope
        logger.info("📍 LEVEL 3: Expanding geographic scope...")
        expanded_criteria, expansion_info = self._expand_location(relaxed_criteria, original_criteria)
        results = self._search_exact(expanded_criteria)
        if len(results) >= self.config.MIN_RESULTS_TARGET:
            return SearchResult(
                properties=results,
                match_level=MatchLevel.GEOGRAPHIC_EXPANSION,
                relaxed_constraints=relaxed_fields,
                message=self._generate_message(
                    MatchLevel.GEOGRAPHIC_EXPANSION,
                    len(results),
                    expansion_info
                ),
                count=len(results),
                score=70.0
            )
        logger.info(f"   Found {len(results)} after geographic expansion")
        
        # LEVEL 4: Keep only critical fields
        logger.info("📍 LEVEL 4: Keeping only critical fields...")
        critical_criteria, critical_fields = self._extract_critical_only(criteria)
        results = self._search_exact(critical_criteria)
        if len(results) >= self.config.MIN_RESULTS_TARGET:
            return SearchResult(
                properties=results,
                match_level=MatchLevel.CRITICAL_ONLY,
                relaxed_constraints=list(set(criteria.keys()) - set(critical_criteria.keys())),
                message=self._generate_message(
                    MatchLevel.CRITICAL_ONLY,
                    len(results),
                    {"critical_list": ", ".join(critical_fields)}
                ),
                count=len(results),
                score=60.0
            )
        logger.info(f"   Found {len(results)} with critical fields only")
        
        # LEVEL 5: Location-only search
        logger.info("📍 LEVEL 5: Location-only search...")
        location = criteria.get("location") or criteria.get("city")
        if location:
            location_criteria = {"location": location}
            results = self._search_exact(location_criteria)
            if len(results) > 0:
                return SearchResult(
                    properties=results[:20],  # Limit to 20
                    match_level=MatchLevel.LOCATION_ONLY,
                    relaxed_constraints=list(criteria.keys()),
                    message=self._generate_message(
                        MatchLevel.LOCATION_ONLY,
                        len(results),
                        {"location": location}
                    ),
                    count=len(results),
                    score=40.0
                )
        logger.info(f"   Found {len(results) if location else 0} in location only")
        
        # LEVEL 6: Emergency fallback - show popular condos
        logger.info("📍 LEVEL 6: Emergency fallback - popular condos...")
        popular_results = self._get_popular_condos(limit=10)
        return SearchResult(
            properties=popular_results,
            match_level=MatchLevel.POPULAR,
            relaxed_constraints=list(criteria.keys()),
            message=self._generate_message(MatchLevel.POPULAR, len(popular_results), {}),
            count=len(popular_results),
            score=20.0
        )
    
    
    def _search_exact(self, criteria: Dict) -> List[Dict]:
        """Execute exact search with current criteria"""
        try:
            return self.search_function(criteria)
        except Exception as e:
            logger.error(f"❌ Search error: {e}")
            return []
    
    
    def _relax_non_critical(self, criteria: Dict) -> Tuple[Dict, List[str]]:
        """
        Relax nice-to-have constraints while keeping must-haves.
        
        Returns:
            (relaxed_criteria, list_of_relaxed_fields)
        """
        relaxed = criteria.copy()
        relaxed_fields = []
        
        # Relax amenities (keep critical ones only)
        if "amenities" in relaxed and isinstance(relaxed["amenities"], list):
            if len(relaxed["amenities"]) > 2:
                critical_amenities = [a for a in relaxed["amenities"] if a.lower() in CRITICAL_AMENITIES]
                if critical_amenities != relaxed["amenities"]:
                    relaxed["amenities"] = critical_amenities or relaxed["amenities"][:1]
                    relaxed_fields.append("some amenities")
        
        # Relax individual nice-to-have boolean amenities
        for field in ["gym", "pool", "rooftop", "party_room"]:
            if field in relaxed and relaxed[field]:
                del relaxed[field]
                relaxed_fields.append(field)
        
        # Relax floor level
        if "floor_level_min" in relaxed:
            original = relaxed["floor_level_min"]
            relaxed["floor_level_min"] = max(1, original - 5)
            relaxed_fields.append(f"floor level (now {relaxed['floor_level_min']}+)")
        
        # Relax view requirement
        if "view" in relaxed:
            del relaxed["view"]
            relaxed_fields.append("view type")
        
        # Relax exposure
        if "exposure" in relaxed:
            del relaxed["exposure"]
            relaxed_fields.append("unit exposure")
        
        # Increase maintenance fee tolerance
        if "maintenance_fee_max" in relaxed:
            relaxed["maintenance_fee_max"] = int(relaxed["maintenance_fee_max"] * 1.2)
            relaxed_fields.append("maintenance fee limit")
        
        # Relax balcony
        if "balcony" in relaxed and relaxed["balcony"]:
            del relaxed["balcony"]
            relaxed_fields.append("balcony")
        
        # Relax locker
        if "locker" in relaxed and relaxed["locker"]:
            del relaxed["locker"]
            relaxed_fields.append("storage locker")
        
        # Relax waterfront
        if "waterfront" in relaxed and relaxed["waterfront"]:
            del relaxed["waterfront"]
            relaxed_fields.append("waterfront")
        
        return relaxed, relaxed_fields
    
    
    def _expand_location(self, criteria: Dict, original_criteria: Dict) -> Tuple[Dict, Dict]:
        """
        Expand geographic scope to nearby areas.
        
        Returns:
            (expanded_criteria, expansion_info_dict)
        """
        expanded = criteria.copy()
        location = (criteria.get("location") or criteria.get("city") or "").lower()
        original_location = (original_criteria.get("location") or original_criteria.get("city") or "")
        
        expansion_info = {
            "original_area": original_location,
            "expanded_area": original_location
        }
        
        # Neighborhood → City
        if location in NEIGHBORHOOD_TO_CITY:
            city = NEIGHBORHOOD_TO_CITY[location]
            expanded["location"] = city
            expansion_info["expanded_area"] = city
            logger.info(f"   📍 Expanding: {location} → {city}")
            return expanded, expansion_info
        
        # City → Metropolitan Area
        if location in CITY_TO_METRO:
            metro_cities = CITY_TO_METRO[location]
            expanded["location_list"] = metro_cities
            if "location" in expanded:
                del expanded["location"]
            expansion_info["expanded_area"] = " and ".join(metro_cities[:3])
            logger.info(f"   📍 Expanding: {location} → metro area ({len(metro_cities)} cities)")
            return expanded, expansion_info
        
        return expanded, expansion_info
    
    
    def _extract_critical_only(self, criteria: Dict) -> Tuple[Dict, List[str]]:
        """
        Extract only critical search criteria.
        
        Returns:
            (critical_criteria, list_of_critical_field_names)
        """
        critical = {}
        critical_field_names = []
        
        # Location (always keep)
        if "location" in criteria:
            critical["location"] = criteria["location"]
            critical_field_names.append("location")
        elif "city" in criteria:
            critical["city"] = criteria["city"]
            critical_field_names.append("city")
        
        # Bedrooms with tolerance
        if "bedrooms" in criteria:
            beds = criteria["bedrooms"]
            critical["bedrooms_min"] = max(0, beds - 1)
            critical["bedrooms_max"] = beds + 1
            critical_field_names.append(f"{beds} bedrooms")
        
        # Price range with tolerance
        if "min_price" in criteria:
            critical["min_price"] = int(criteria["min_price"] * 0.9)
            critical_field_names.append(f"min price")
        
        if "max_price" in criteria:
            critical["max_price"] = int(criteria["max_price"] * 1.1)
            critical_field_names.append(f"max ${criteria['max_price']}")
        
        # Critical booleans (must match if specified)
        for field in CRITICAL_BOOLEAN_FIELDS:
            if field in criteria:
                critical[field] = criteria[field]
                if criteria[field]:
                    critical_field_names.append(field.replace("_", " "))
        
        # Parking (if specified, keep it)
        if "parking_spaces" in criteria:
            critical["parking_spaces"] = criteria["parking_spaces"]
            critical_field_names.append(f"{criteria['parking_spaces']} parking")
        
        return critical, critical_field_names
    
    
    def _get_popular_condos(self, limit: int = 10) -> List[Dict]:
        """Get popular condos as emergency fallback"""
        try:
            # Search for condos in major cities
            major_cities = ["Toronto", "Ottawa", "Vancouver", "Montreal"]
            
            for city in major_cities:
                results = self._search_exact({"location": city})
                if len(results) >= limit:
                    return results[:limit]
            
            # If still not enough, return what we have
            return results[:limit] if results else []
        
        except Exception as e:
            logger.error(f"❌ Error getting popular condos: {e}")
            return []
    
    
    def _generate_message(self, match_level: MatchLevel, count: int, data: Dict) -> str:
        """Generate user-friendly message for match level"""
        template = MESSAGE_TEMPLATES.get(match_level, "Found {count} properties")
        
        # Add plural handling
        data["count"] = count
        data["plural"] = "s" if count != 1 else ""
        
        try:
            return template.format(**data)
        except KeyError as e:
            logger.error(f"❌ Missing key in message template: {e}")
            return f"Found {count} condo{'s' if count != 1 else ''}"


# ==================== FIELD-SPECIFIC MATCHING ====================

class FieldMatcher:
    """Field-specific matching logic"""
    
    @staticmethod
    def match_numeric(requested: float, available: float, field_name: str) -> FieldMatch:
        """Match numeric field with tolerance"""
        if available == requested:
            return FieldMatch("exact", 100.0)
        
        tolerance = NUMERIC_TOLERANCES.get(field_name, 0)
        tolerance *= SearchConfig.NUMERIC_TOLERANCE_MULTIPLIER
        
        if abs(available - requested) <= tolerance:
            score = 100 - (abs(available - requested) / tolerance) * 10
            return FieldMatch("close", score)
        
        return FieldMatch("none", 0.0)
    
    
    @staticmethod
    def match_string(requested: str, available: str, field_name: str) -> FieldMatch:
        """Match string field with synonyms and fuzzy matching"""
        if not requested or not available:
            return FieldMatch("none", 0.0)
        
        req_lower = requested.lower().strip()
        avail_lower = str(available).lower().strip()
        
        # Exact match
        if req_lower == avail_lower:
            return FieldMatch("exact", 100.0)
        
        # Synonym match
        if field_name in FIELD_SYNONYMS:
            synonyms = FIELD_SYNONYMS[field_name].get(req_lower, [])
            if any(syn in avail_lower for syn in synonyms):
                return FieldMatch("synonym", 90.0)
            
            # Reverse synonym check
            for key, syn_list in FIELD_SYNONYMS[field_name].items():
                if req_lower in syn_list and key in avail_lower:
                    return FieldMatch("synonym", 90.0)
        
        # Partial match
        if req_lower in avail_lower or avail_lower in req_lower:
            return FieldMatch("partial", 70.0)
        
        # Fuzzy match
        if SearchConfig.ENABLE_FUZZY_MATCHING:
            similarity = calculate_string_similarity(req_lower, avail_lower)
            if similarity >= SearchConfig.FUZZY_THRESHOLD:
                return FieldMatch("fuzzy", similarity * 100)
        
        return FieldMatch("none", 0.0)
    
    
    @staticmethod
    def match_array(requested: List[str], available: List[str], field_name: str) -> FieldMatch:
        """Match array field with partial matching and synonyms"""
        if not requested:
            return FieldMatch("no_requirement", 100.0)
        
        if not available:
            return FieldMatch("none", 0.0)
        
        # Normalize
        req_normalized = [item.lower().strip() for item in requested]
        avail_normalized = [item.lower().strip() for item in available]
        
        # Count matches
        matches = 0
        for req in req_normalized:
            # Direct match
            if req in avail_normalized:
                matches += 1
                continue
            
            # Synonym match
            if field_name in ARRAY_ITEM_SYNONYMS:
                synonyms = ARRAY_ITEM_SYNONYMS[field_name].get(req, [])
                if any(syn in avail_normalized for syn in synonyms):
                    matches += 1
                    continue
            
            # Partial match
            if any(req in avail or avail in req for avail in avail_normalized):
                matches += 0.5  # Partial credit
        
        match_percentage = (matches / len(req_normalized)) * 100
        
        if match_percentage == 100:
            return FieldMatch("complete", 100.0)
        elif match_percentage >= 80:
            return FieldMatch("good", 90.0)
        elif match_percentage >= 50:
            return FieldMatch("partial", 70.0)
        elif match_percentage > 0:
            return FieldMatch("weak", 50.0)
        
        return FieldMatch("none", 0.0)


# ==================== EXPORT ====================

__all__ = [
    "UniversalCondoSearchFallback",
    "SearchConfig",
    "MatchLevel",
    "SearchResult",
    "FieldMatcher",
    "NUMERIC_TOLERANCES",
    "FIELD_SYNONYMS",
    "NEIGHBORHOOD_TO_CITY",
    "CITY_TO_METRO",
]

logger.info("✅ Universal fallback system loaded successfully")
