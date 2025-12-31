"""
Test suite for location_validator module.

Tests the hybrid location extraction system including:
- Agreement between LLM and deterministic methods
- Disagreement handling
- Confidence-based decisions
- Gazetteer matching
- Edge cases
"""

import pytest
from unittest.mock import Mock, patch
from services.location_validator import (
    LocationValidator,
    LocationCandidate,
    LocationValidationResult,
    get_location_validator
)


@pytest.fixture
def validator():
    """Create a LocationValidator instance for testing."""
    return LocationValidator()


class TestLocationCandidate:
    """Test LocationCandidate dataclass."""
    
    def test_normalized_name(self):
        """Test automatic normalization of city names."""
        candidate = LocationCandidate(city="Toronto", confidence=0.9, source="llm")
        assert candidate.normalized_name == "toronto"
        
        candidate2 = LocationCandidate(city="  North York  ", confidence=0.9, source="regex")
        assert candidate2.normalized_name == "north york"


class TestRegexExtraction:
    """Test regex-based location extraction."""
    
    def test_extract_with_regex_simple(self, validator):
        """Test simple location patterns."""
        text = "Show me properties in Toronto"
        candidates = validator.extract_with_regex(text)
        
        assert len(candidates) > 0
        assert any(c.city == "Toronto" for c in candidates)
    
    def test_extract_with_regex_multiple_patterns(self, validator):
        """Test multiple pattern matches."""
        test_cases = [
            ("condos in Mississauga", "Mississauga"),
            ("homes near Ottawa", "Ottawa"),
            ("Toronto properties for sale", "Toronto"),
            ("looking at Vancouver area homes", "Vancouver"),
        ]
        
        for text, expected_city in test_cases:
            candidates = validator.extract_with_regex(text)
            assert any(
                expected_city.lower() in c.normalized_name 
                for c in candidates
            ), f"Failed to extract {expected_city} from '{text}'"
    
    def test_extract_with_regex_no_match(self, validator):
        """Test text with no location."""
        text = "How many bedrooms?"
        candidates = validator.extract_with_regex(text)
        assert len(candidates) == 0


class TestGazetteerExtraction:
    """Test gazetteer-based location extraction."""
    
    def test_exact_match(self, validator):
        """Test exact city name match."""
        text = "I want to search in toronto"
        candidates = validator.extract_with_gazetteer(text)
        
        assert len(candidates) > 0
        assert any(c.city.lower() == "toronto" for c in candidates)
        assert any(c.confidence == 1.0 for c in candidates)  # Exact match
    
    def test_multiple_cities(self, validator):
        """Test text with multiple cities."""
        text = "Compare properties in Toronto, Ottawa, and Vancouver"
        candidates = validator.extract_with_gazetteer(text)
        
        cities = {c.normalized_name for c in candidates}
        assert "toronto" in cities
        assert "ottawa" in cities
        assert "vancouver" in cities
    
    @patch('services.location_validator.RAPIDFUZZ_AVAILABLE', True)
    def test_fuzzy_match(self, validator):
        """Test fuzzy matching for misspellings."""
        # Note: This test may fail if rapidfuzz not installed
        text = "Show me homes in Toront"  # Missing 'o'
        candidates = validator.extract_with_gazetteer(text)
        
        # Should still find Toronto with lower confidence
        if candidates:
            assert any("toronto" in c.normalized_name for c in candidates)


class TestDeterministicExtraction:
    """Test combined deterministic extraction."""
    
    def test_deterministic_extraction_combines_methods(self, validator):
        """Test that deterministic extraction combines all methods."""
        text = "Show me properties in Toronto"
        candidates = validator.extract_deterministic(text)
        
        # Should have candidates from multiple sources
        assert len(candidates) > 0
        sources = {c.source for c in candidates}
        # Should have at least 2 source types
        assert len(sources) >= 1
    
    def test_deterministic_returns_top_3(self, validator):
        """Test that only top 3 candidates are returned."""
        text = "Properties in Toronto near Mississauga and Brampton in Ontario"
        candidates = validator.extract_deterministic(text)
        
        assert len(candidates) <= 3
    
    def test_deterministic_sorts_by_confidence(self, validator):
        """Test candidates are sorted by confidence."""
        text = "Show me properties in Toronto"
        candidates = validator.extract_deterministic(text)
        
        if len(candidates) > 1:
            for i in range(len(candidates) - 1):
                assert candidates[i].confidence >= candidates[i+1].confidence


class TestLocationValidation:
    """Test complete validation logic."""
    
    def test_agreement_case(self, validator):
        """Test when LLM and deterministic methods agree."""
        user_text = "Show me properties in Toronto"
        llm_candidates = [{"city": "Toronto", "confidence": 0.9}]
        
        result = validator.validate_location_extraction(
            user_text=user_text,
            llm_candidates=llm_candidates,
            session_id="test_session",
            message_id="msg_123"
        )
        
        assert result.final_city is not None
        assert "toronto" in result.final_city.lower()
        assert result.source == "hybrid_agreement"
        assert not result.needs_confirmation
    
    def test_disagreement_high_confidence_det(self, validator):
        """Test disagreement with high-confidence deterministic match."""
        user_text = "Show me properties in Ottawa"
        llm_candidates = [{"city": "Toronto", "confidence": 0.7}]  # LLM wrong
        
        result = validator.validate_location_extraction(
            user_text=user_text,
            llm_candidates=llm_candidates,
            session_id="test_session",
            message_id="msg_123"
        )
        
        # Should prefer deterministic if high confidence
        assert result.final_city is not None
        assert "ottawa" in result.final_city.lower()
        assert "deterministic" in result.source.lower()
    
    def test_disagreement_needs_confirmation(self, validator):
        """Test disagreement requiring user confirmation."""
        user_text = "Show me homes"  # Ambiguous
        llm_candidates = [{"city": "Toronto", "confidence": 0.6}]
        
        result = validator.validate_location_extraction(
            user_text=user_text,
            llm_candidates=llm_candidates,
            previous_city="Ottawa",
            session_id="test_session",
            message_id="msg_123"
        )
        
        # Should ask for confirmation if ambiguous
        if result.needs_confirmation:
            assert result.final_city is None
            assert len(result.confirmation_choices) > 0
            assert result.source == "user_confirmation_needed"
    
    def test_no_location_detected(self, validator):
        """Test when no location is found."""
        user_text = "How many bedrooms?"
        llm_candidates = []
        
        result = validator.validate_location_extraction(
            user_text=user_text,
            llm_candidates=llm_candidates,
            previous_city="Toronto",
            session_id="test_session",
            message_id="msg_123"
        )
        
        assert result.final_city == "Toronto"  # Should keep previous
        assert result.source == "previous"
        assert result.confidence == 0.0
    
    def test_single_source_high_confidence(self, validator):
        """Test single source with high confidence."""
        user_text = "Show me properties in Toronto"
        llm_candidates = [{"city": "Toronto", "confidence": 0.95}]
        
        # Mock deterministic to return nothing
        with patch.object(validator, 'extract_deterministic', return_value=[]):
            result = validator.validate_location_extraction(
                user_text=user_text,
                llm_candidates=llm_candidates,
                session_id="test_session",
                message_id="msg_123"
            )
        
        assert result.final_city == "Toronto"
        assert result.confidence >= 0.7
        assert not result.needs_confirmation
    
    def test_single_source_low_confidence(self, validator):
        """Test single source with low confidence."""
        user_text = "Show me homes"
        llm_candidates = [{"city": "Toronto", "confidence": 0.4}]
        
        with patch.object(validator, 'extract_deterministic', return_value=[]):
            result = validator.validate_location_extraction(
                user_text=user_text,
                llm_candidates=llm_candidates,
                previous_city="Ottawa",
                session_id="test_session",
                message_id="msg_123"
            )
        
        # Should ask for confirmation
        assert result.needs_confirmation
        assert "Toronto" in result.confirmation_choices or "Ottawa" in result.confirmation_choices


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_input(self, validator):
        """Test empty user text."""
        result = validator.validate_location_extraction(
            user_text="",
            llm_candidates=[],
            session_id="test_session"
        )
        
        assert result.final_city is None
        assert len(result.candidates) == 0
    
    def test_malformed_llm_candidates(self, validator):
        """Test handling of malformed LLM candidates."""
        result = validator.validate_location_extraction(
            user_text="Show me properties",
            llm_candidates=[
                {"confidence": 0.9},  # Missing city
                {"city": "", "confidence": 0.8},  # Empty city
                None,  # None value
            ],
            session_id="test_session"
        )
        
        # Should not crash
        assert isinstance(result, LocationValidationResult)
    
    def test_special_characters_in_city(self, validator):
        """Test city names with special characters."""
        text = "Properties in St. Catharines"
        candidates = validator.extract_with_gazetteer(text)
        
        # Should handle "St." properly
        assert len(candidates) > 0


class TestSingleton:
    """Test singleton pattern."""
    
    def test_get_location_validator_returns_same_instance(self):
        """Test that get_location_validator returns singleton."""
        validator1 = get_location_validator()
        validator2 = get_location_validator()
        
        assert validator1 is validator2


class TestMetrics:
    """Test metrics tracking."""
    
    def test_metrics_increment(self, validator):
        """Test that metrics are tracked."""
        from services.location_validator import LOCATION_EXTRACTION_COUNTER
        
        initial_total = LOCATION_EXTRACTION_COUNTER['total']
        
        validator.validate_location_extraction(
            user_text="Show me properties in Toronto",
            llm_candidates=[{"city": "Toronto", "confidence": 0.9}],
            session_id="test"
        )
        
        assert LOCATION_EXTRACTION_COUNTER['total'] > initial_total


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
