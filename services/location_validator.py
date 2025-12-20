"""
location_validator.py

Hybrid location extraction validator combining LLM-based extraction with deterministic
fallback using regex, spaCy NER, and gazetteer lookup.

This module ensures location extraction accuracy by:
1. Running deterministic extraction alongside LLM extraction
2. Validating agreement between methods
3. Requesting user confirmation when methods disagree
4. Providing confidence scores and candidate rankings
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime
from collections import Counter

logger = logging.getLogger(__name__)

# Try importing optional dependencies with graceful degradation
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    logger.warning("spaCy not available - deterministic NER disabled")

try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    logger.warning("rapidfuzz not available - fuzzy matching disabled")

# Metrics counters (can be replaced with prometheus_client)
LOCATION_EXTRACTION_COUNTER = Counter()


@dataclass
class LocationCandidate:
    """Represents a potential location match."""
    city: str
    confidence: float
    source: str  # 'llm', 'regex', 'spacy', 'gazetteer'
    span_start: Optional[int] = None
    span_end: Optional[int] = None
    normalized_name: str = field(init=False)
    
    def __post_init__(self):
        self.normalized_name = self.city.lower().strip()


@dataclass
class LocationValidationResult:
    """Result of location validation."""
    final_city: Optional[str]
    source: str  # 'llm', 'deterministic', 'hybrid', 'user_confirmation_needed'
    reason: str
    confidence: float
    candidates: List[LocationCandidate]
    needs_confirmation: bool = False
    confirmation_choices: List[str] = field(default_factory=list)


# Canadian cities gazetteer (major cities + GTA)
CANADIAN_CITIES_GAZETTEER = {
    # Ontario - GTA
    'toronto', 'north york', 'scarborough', 'etobicoke', 'york',
    'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
    'oakville', 'burlington', 'milton', 'ajax', 'pickering',
    'whitby', 'oshawa', 'aurora', 'newmarket', 'king city',
    
    # Ontario - Other major cities
    'ottawa', 'hamilton', 'london', 'kitchener', 'waterloo',
    'cambridge', 'guelph', 'windsor', 'kingston', 'barrie',
    'sudbury', 'thunder bay', 'st. catharines', 'niagara falls',
    
    # Other provinces
    'montreal', 'quebec city', 'laval', 'gatineau',
    'vancouver', 'surrey', 'burnaby', 'richmond', 'coquitlam',
    'calgary', 'edmonton', 'red deer', 'lethbridge',
    'winnipeg', 'regina', 'saskatoon',
    'halifax', 'dartmouth', 'moncton', 'fredericton',
    'st. john\'s', 'charlottetown', 'whitehorse', 'yellowknife',
}

# Common location patterns in real estate queries
LOCATION_PATTERNS = [
    r'\b(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:area|properties|condos|homes|houses)',
    r'(?:properties|condos|homes|houses)\s+(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
]


class LocationValidator:
    """
    Validates location extraction by combining LLM and deterministic methods.
    """
    
    def __init__(self, spacy_model: str = "en_core_web_sm"):
        """
        Initialize location validator.
        
        Args:
            spacy_model: Name of spaCy model to load
        """
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load(spacy_model)
                logger.info(f"✅ Loaded spaCy model: {spacy_model}")
            except OSError:
                logger.warning(f"spaCy model {spacy_model} not found. Run: python -m spacy download {spacy_model}")
        
        self.gazetteer = CANADIAN_CITIES_GAZETTEER
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for efficiency."""
        self.compiled_patterns = [re.compile(pattern) for pattern in LOCATION_PATTERNS]
    
    def extract_with_regex(self, text: str) -> List[LocationCandidate]:
        """
        Extract location candidates using regex patterns.
        
        Args:
            text: User input text
            
        Returns:
            List of location candidates
        """
        candidates = []
        
        for pattern in self.compiled_patterns:
            for match in pattern.finditer(text):
                city = match.group(1).strip()
                
                # Validate against gazetteer
                confidence = self._gazetteer_confidence(city)
                
                if confidence > 0.5:  # Threshold for regex matches
                    candidates.append(LocationCandidate(
                        city=city,
                        confidence=confidence,
                        source='regex',
                        span_start=match.start(1),
                        span_end=match.end(1)
                    ))
        
        return candidates
    
    def extract_with_spacy(self, text: str) -> List[LocationCandidate]:
        """
        Extract location candidates using spaCy NER.
        
        Args:
            text: User input text
            
        Returns:
            List of location candidates
        """
        if not self.nlp:
            return []
        
        candidates = []
        doc = self.nlp(text)
        
        for ent in doc.ents:
            if ent.label_ in ('GPE', 'LOC'):  # Geopolitical entity or location
                city = ent.text.strip()
                
                # Validate against gazetteer
                confidence = self._gazetteer_confidence(city)
                
                if confidence > 0.3:  # Lower threshold for NER
                    candidates.append(LocationCandidate(
                        city=city,
                        confidence=confidence * 0.9,  # Slight penalty for NER vs regex
                        source='spacy',
                        span_start=ent.start_char,
                        span_end=ent.end_char
                    ))
        
        return candidates
    
    def extract_with_gazetteer(self, text: str) -> List[LocationCandidate]:
        """
        Extract location candidates using gazetteer lookup with fuzzy matching.
        
        Args:
            text: User input text
            
        Returns:
            List of location candidates
        """
        candidates = []
        text_lower = text.lower()
        
        # Exact matches (highest confidence)
        for city in self.gazetteer:
            if city in text_lower:
                # Find position
                start = text_lower.find(city)
                candidates.append(LocationCandidate(
                    city=city.title(),
                    confidence=1.0,
                    source='gazetteer',
                    span_start=start,
                    span_end=start + len(city)
                ))
        
        # Fuzzy matches if rapidfuzz available
        if RAPIDFUZZ_AVAILABLE and not candidates:
            try:
                from rapidfuzz import process, fuzz as rapidfuzz_fuzz
                # Extract potential city names (capitalized words)
                words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', text)
                
                for word in words:
                    matches = process.extract(
                        word.lower(),
                        self.gazetteer,
                        scorer=rapidfuzz_fuzz.ratio,
                        limit=3
                    )
                    
                    for match_city, score, _ in matches:
                        if score >= 80:  # High similarity threshold
                            candidates.append(LocationCandidate(
                                city=match_city.title(),
                                confidence=score / 100.0 * 0.85,  # Penalty for fuzzy match
                                source='gazetteer_fuzzy',
                                span_start=text.lower().find(word.lower()),
                                span_end=text.lower().find(word.lower()) + len(word)
                            ))
            except ImportError:
                pass
        
        return candidates
    
    def _gazetteer_confidence(self, city: str) -> float:
        """
        Calculate confidence based on gazetteer presence.
        
        Args:
            city: City name to check
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        city_lower = city.lower().strip()
        
        # Exact match
        if city_lower in self.gazetteer:
            return 1.0
        
        # Fuzzy match if available
        if RAPIDFUZZ_AVAILABLE:
            matches = process.extract(
                city_lower,
                self.gazetteer,
                scorer=fuzz.ratio,
                limit=1
            )
            if matches and matches[0][1] >= 80:
                return matches[0][1] / 100.0
        
        return 0.0
    
    def extract_deterministic(self, text: str) -> List[LocationCandidate]:
        """
        Run all deterministic extraction methods.
        
        Args:
            text: User input text
            
        Returns:
            Merged and deduplicated list of candidates
        """
        candidates = []
        
        # Run all extractors
        candidates.extend(self.extract_with_regex(text))
        candidates.extend(self.extract_with_spacy(text))
        candidates.extend(self.extract_with_gazetteer(text))
        
        # Deduplicate and merge confidence scores
        merged = self._merge_candidates(candidates)
        
        # Sort by confidence
        merged.sort(key=lambda c: c.confidence, reverse=True)
        
        return merged[:3]  # Top 3 candidates
    
    def _merge_candidates(self, candidates: List[LocationCandidate]) -> List[LocationCandidate]:
        """
        Merge duplicate candidates and combine confidence scores.
        
        Args:
            candidates: List of candidates to merge
            
        Returns:
            Deduplicated list with merged confidence
        """
        if not candidates:
            return []
        
        # Group by normalized name
        groups = {}
        for candidate in candidates:
            key = candidate.normalized_name
            if key not in groups:
                groups[key] = []
            groups[key].append(candidate)
        
        merged = []
        for city_name, group in groups.items():
            # Use highest confidence and combine sources
            best = max(group, key=lambda c: c.confidence)
            sources = ', '.join(sorted(set(c.source for c in group)))
            
            merged.append(LocationCandidate(
                city=best.city,
                confidence=best.confidence,
                source=sources,
                span_start=best.span_start,
                span_end=best.span_end
            ))
        
        return merged
    
    def validate_location_extraction(
        self,
        user_text: str,
        llm_candidates: List[Dict[str, Any]],
        previous_city: Optional[str] = None,
        session_id: Optional[str] = None,
        message_id: Optional[str] = None
    ) -> LocationValidationResult:
        """
        Validate LLM location extraction against deterministic methods.
        
        Args:
            user_text: Original user input
            llm_candidates: List of candidates from LLM (format: [{'city': str, 'confidence': float}])
            previous_city: Previously established location in conversation
            session_id: Session identifier for logging
            message_id: Message identifier for logging
            
        Returns:
            LocationValidationResult with final decision
        """
        # Increment metrics
        LOCATION_EXTRACTION_COUNTER['total'] += 1
        
        # Convert LLM candidates to LocationCandidate objects
        llm_cands = [
            LocationCandidate(
                city=c.get('city', ''),
                confidence=c.get('confidence', 0.5),
                source='llm'
            )
            for c in llm_candidates if c and isinstance(c, dict) and c.get('city')
        ]
        
        # Run deterministic extraction
        det_cands = self.extract_deterministic(user_text)
        
        # Log candidates
        logger.info(
            f"[LOCATION_VALIDATION] session={session_id} msg={message_id} "
            f"user_text='{user_text[:100]}' "
            f"llm_cands={[c.city for c in llm_cands]} "
            f"det_cands={[c.city for c in det_cands]}"
        )
        
        # Combine all candidates
        all_candidates = llm_cands + det_cands
        
        # Case 1: No location found by either method
        if not all_candidates:
            LOCATION_EXTRACTION_COUNTER['no_location'] += 1
            return LocationValidationResult(
                final_city=previous_city,
                source='previous',
                reason='No location detected in user input',
                confidence=0.0,
                candidates=[]
            )
        
        # Case 2: Check for agreement
        if llm_cands and det_cands:
            llm_top = llm_cands[0]
            det_top = det_cands[0]
            
            # Check if they agree (case-insensitive)
            if llm_top.normalized_name == det_top.normalized_name:
                LOCATION_EXTRACTION_COUNTER['agreement'] += 1
                logger.info(f"[LOCATION_VALIDATION] ✅ Agreement: {llm_top.city}")
                
                return LocationValidationResult(
                    final_city=llm_top.city,
                    source='hybrid_agreement',
                    reason=f'LLM and deterministic methods agree on {llm_top.city}',
                    confidence=min(llm_top.confidence + det_top.confidence, 1.0),
                    candidates=all_candidates
                )
            
            # Case 3: Disagreement - check deterministic confidence
            if det_top.confidence >= 0.8:
                # High confidence deterministic match - prefer it
                LOCATION_EXTRACTION_COUNTER['det_override'] += 1
                logger.warning(
                    f"[LOCATION_VALIDATION] ⚠️ Disagreement (det override): "
                    f"LLM={llm_top.city} Det={det_top.city} (conf={det_top.confidence:.2f})"
                )
                
                return LocationValidationResult(
                    final_city=det_top.city,
                    source='deterministic_high_confidence',
                    reason=f'Deterministic extractor found high-confidence match: {det_top.city}',
                    confidence=det_top.confidence,
                    candidates=all_candidates
                )
            
            # Case 4: Disagreement with moderate confidence - ask user
            LOCATION_EXTRACTION_COUNTER['needs_confirmation'] += 1
            logger.warning(
                f"[LOCATION_VALIDATION] ❓ Disagreement (need confirmation): "
                f"LLM={llm_top.city} Det={det_top.city}"
            )
            
            # Build confirmation choices
            choices = [llm_top.city, det_top.city]
            if previous_city and previous_city.lower() not in [c.lower() for c in choices]:
                choices.append(previous_city)
            
            return LocationValidationResult(
                final_city=None,
                source='user_confirmation_needed',
                reason=f'Ambiguous location: multiple candidates detected',
                confidence=0.5,
                candidates=all_candidates,
                needs_confirmation=True,
                confirmation_choices=choices[:3]  # Max 3 choices
            )
        
        # Case 5: Only LLM or only deterministic found location
        top_candidate = max(all_candidates, key=lambda c: c.confidence)
        
        if top_candidate.confidence >= 0.7:
            LOCATION_EXTRACTION_COUNTER['single_source_high'] += 1
            return LocationValidationResult(
                final_city=top_candidate.city,
                source=top_candidate.source,
                reason=f'Single high-confidence match from {top_candidate.source}',
                confidence=top_candidate.confidence,
                candidates=all_candidates
            )
        else:
            # Low confidence - ask for confirmation
            LOCATION_EXTRACTION_COUNTER['single_source_low'] += 1
            choices = [top_candidate.city]
            if previous_city:
                choices.append(previous_city)
            
            return LocationValidationResult(
                final_city=None,
                source='user_confirmation_needed',
                reason=f'Low confidence match: {top_candidate.city}',
                confidence=top_candidate.confidence,
                candidates=all_candidates,
                needs_confirmation=True,
                confirmation_choices=choices
            )


# Singleton instance
_validator_instance = None


def get_location_validator() -> LocationValidator:
    """Get singleton instance of LocationValidator."""
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = LocationValidator()
    return _validator_instance


def get_location_extraction_metrics() -> Dict[str, int]:
    """Get current metrics for location extraction."""
    return dict(LOCATION_EXTRACTION_COUNTER)
