"""
Intersection Detector
=====================
Detects street intersection patterns in natural language queries.

Patterns supported:
- "King and Bay"
- "Yonge & Bloor"
- "Queen @ Spadina"
- "Dundas at University"

Author: Summitly Team
Date: December 2025
"""

import re
import logging
from typing import Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Intersection detection patterns
INTERSECTION_PATTERNS = [
    # "Street1 and Street2"
    r'\b([A-Z][a-zA-Z\s\.]+?)\s+and\s+([A-Z][a-zA-Z\s\.]+)\b',
    
    # "Street1 & Street2"
    r'\b([A-Z][a-zA-Z\s\.]+?)\s*&\s*([A-Z][a-zA-Z\s\.]+)\b',
    
    # "Street1 @ Street2"
    r'\b([A-Z][a-zA-Z\s\.]+?)\s*@\s*([A-Z][a-zA-Z\s\.]+)\b',
    
    # "Street1 at Street2"
    r'\b([A-Z][a-zA-Z\s\.]+?)\s+at\s+([A-Z][a-zA-Z\s\.]+)\b',
]

# Common street suffixes to validate
STREET_SUFFIXES = {
    'street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd',
    'drive', 'dr', 'lane', 'ln', 'way', 'court', 'ct', 'place', 'pl',
    'crescent', 'cres', 'circle', 'terrace', 'parkway', 'pkwy'
}

# Words that shouldn't be street names
STOPWORDS = {
    'properties', 'condos', 'homes', 'houses', 'listings', 'apartments',
    'near', 'in', 'at', 'for', 'sale', 'rent', 'the', 'a', 'an'
}


@dataclass
class IntersectionMatch:
    """Detected intersection match"""
    street1: str
    street2: str
    raw_match: str
    confidence: float
    
    def to_dict(self):
        return {
            'street1': self.street1,
            'street2': self.street2,
            'raw_match': self.raw_match,
            'confidence': self.confidence
        }


class IntersectionDetector:
    """
    Detects street intersection patterns in user queries.
    
    Features:
    - Multiple pattern matching (and, &, @, at)
    - Street name validation
    - Confidence scoring
    - Stopword filtering
    """
    
    def __init__(self):
        """Initialize intersection detector"""
        self.patterns = [re.compile(p, re.IGNORECASE) for p in INTERSECTION_PATTERNS]
        logger.info("✅ [INTERSECTION_DETECTOR] Initialized")
    
    def detect(self, query: str) -> Optional[IntersectionMatch]:
        """
        Detect intersection pattern in query.
        
        Args:
            query: User query string
            
        Returns:
            IntersectionMatch if detected with confidence, None otherwise
        """
        logger.debug(f"[INTERSECTION_DETECTOR] Analyzing: {query}")
        
        for pattern in self.patterns:
            match = pattern.search(query)
            if match:
                street1 = match.group(1).strip()
                street2 = match.group(2).strip()
                
                # Validate streets
                if self._is_valid_intersection(street1, street2):
                    # Calculate confidence
                    confidence = self._calculate_confidence(street1, street2, query)
                    
                    if confidence >= 0.6:
                        logger.info(
                            f"🚦 [INTERSECTION_DETECTOR] Detected: "
                            f"{street1} & {street2} (confidence: {confidence:.2f})"
                        )
                        
                        return IntersectionMatch(
                            street1=street1,
                            street2=street2,
                            raw_match=match.group(0),
                            confidence=confidence
                        )
        
        logger.debug("[INTERSECTION_DETECTOR] No intersection detected")
        return None
    
    def _is_valid_intersection(self, street1: str, street2: str) -> bool:
        """
        Validate that both strings look like street names.
        
        Rules:
        - Not a stopword
        - Has letters
        - Not too long (< 50 chars)
        """
        # Check length
        if len(street1) > 50 or len(street2) > 50:
            return False
        
        # Check if stopwords
        s1_lower = street1.lower().strip()
        s2_lower = street2.lower().strip()
        
        if s1_lower in STOPWORDS or s2_lower in STOPWORDS:
            return False
        
        # Must contain letters
        if not any(c.isalpha() for c in street1) or not any(c.isalpha() for c in street2):
            return False
        
        # Streets shouldn't be identical
        if street1.lower() == street2.lower():
            return False
        
        return True
    
    def _calculate_confidence(self, street1: str, street2: str, query: str) -> float:
        """
        Calculate confidence score for detected intersection.
        
        Factors:
        - Presence of street suffixes
        - Length of street names
        - Context words in query
        """
        confidence = 0.6  # Base confidence
        
        # Boost for street suffixes
        s1_lower = street1.lower()
        s2_lower = street2.lower()
        
        s1_has_suffix = any(suffix in s1_lower for suffix in STREET_SUFFIXES)
        s2_has_suffix = any(suffix in s2_lower for suffix in STREET_SUFFIXES)
        
        if s1_has_suffix and s2_has_suffix:
            confidence += 0.2
        elif s1_has_suffix or s2_has_suffix:
            confidence += 0.1
        
        # Boost for contextual words
        query_lower = query.lower()
        if 'intersection' in query_lower or 'corner' in query_lower:
            confidence += 0.1
        
        if 'near' in query_lower or 'at' in query_lower:
            confidence += 0.05
        
        # Reasonable street name lengths (not too short, not too long)
        if 3 <= len(street1) <= 30 and 3 <= len(street2) <= 30:
            confidence += 0.05
        
        return min(confidence, 1.0)
    
    def extract_streets(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract street names from query (convenience method).
        
        Returns:
            (street1, street2) tuple or (None, None)
        """
        match = self.detect(query)
        if match:
            return (match.street1, match.street2)
        return (None, None)


# Singleton instance
_intersection_detector: Optional[IntersectionDetector] = None


def get_intersection_detector() -> IntersectionDetector:
    """Get or create singleton intersection detector"""
    global _intersection_detector
    if _intersection_detector is None:
        _intersection_detector = IntersectionDetector()
    return _intersection_detector


def detect_intersection(query: str) -> Optional[IntersectionMatch]:
    """Convenience function to detect intersection in query"""
    detector = get_intersection_detector()
    return detector.detect(query)
