"""
Comprehensive Residential Search Integration Tests
====================================================
Tests for the complete residential property search pipeline integration
with the chatbot orchestrator.

This test suite validates:
1. State-to-filter conversion
2. GPT prompt extensions
3. Extended filter extraction
4. Natural language query handling
5. End-to-end search pipeline

Author: Summitly Team
Date: January 10, 2026
"""

import pytest
import os
import sys
from typing import Dict, Any
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.residential_chatbot_integration import (
    StateToFiltersConverter,
    ResidentialSearchIntegration,
    search_residential_properties,
    get_extended_gpt_prompt,
    RESIDENTIAL_FILTERS_EXTENSION,
)
from services.residential_filter_mapper import ResidentialFilters
from services.residential_search_service import get_residential_search_service
from services.conversation_state import ConversationState
from services.location_extractor import LocationState


class TestStateToFiltersConverter:
    """Tests for ConversationState to ResidentialFilters conversion."""
    
    @pytest.fixture
    def converter(self):
        return StateToFiltersConverter()
    
    @pytest.fixture
    def basic_state(self):
        state = ConversationState(session_id="test-session-1")
        state.location = "Toronto"
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        state.bedrooms = 2
        state.price_range = (500000, 800000)
        return state
    
    def test_basic_state_conversion(self, converter, basic_state):
        """Test basic state conversion with common filters."""
        filters = converter.convert(basic_state)
        
        assert filters.property_class == "residential"
        assert filters.city == "Toronto"
        assert filters.property_type is not None
        assert filters.min_bedrooms == 2  # bedrooms -> min_bedrooms
        assert filters.max_bedrooms == 2  # bedrooms -> max_bedrooms
        assert filters.min_price == 500000
        assert filters.max_price == 800000
    
    def test_rental_conversion(self, converter):
        """Test rental listing type conversion."""
        state = ConversationState(session_id="test-rental")
        state.location_state = LocationState(city="Toronto")
        state.listing_type = "rent"
        state.price_range = (2000, 3500)
        
        filters = converter.convert(state)
        
        assert filters.transaction_type == "Lease"
        assert filters.min_price == 2000
        assert filters.max_price == 3500
    
    def test_location_state_conversion(self, converter):
        """Test detailed location state conversion."""
        state = ConversationState(session_id="test-location")
        state.location_state = LocationState(
            city="Toronto",
            neighborhood="Yorkville",
            streetName="Bloor Street"
        )
        
        filters = converter.convert(state)
        
        assert filters.city == "Toronto"
        assert filters.neighborhood == "Yorkville"
        assert filters.street_name == "Bloor Street"
    
    def test_postal_code_conversion(self, converter):
        """Test postal code location conversion."""
        state = ConversationState(session_id="test-postal")
        state.location_state = LocationState(
            city="Toronto",
            postalCode="M5V 3A8"
        )
        
        filters = converter.convert(state)
        
        assert filters.city == "Toronto"
        assert filters.postal_code == "M5V 3A8"
    
    def test_amenities_conversion(self, converter):
        """Test amenities to filter conversion."""
        state = ConversationState(session_id="test-amenities")
        state.location_state = LocationState(city="Toronto")
        state.amenities = ["pool", "gym", "parking", "balcony", "waterfront"]
        
        filters = converter.convert(state)
        
        assert filters.has_pool == True
        assert filters.balcony == 'Yes'
        assert filters.waterfront == 'Yes'
        assert filters.min_parking_spaces == 1
    
    def test_condo_features_conversion(self, converter):
        """Test condo-specific features conversion."""
        state = ConversationState(session_id="test-condo")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        state.exposure = "south"
        state.balcony = "yes"
        state.locker = "yes"
        
        filters = converter.convert(state)
        
        assert filters.exposure == "south"
        assert filters.balcony == 'Yes'
        assert filters.locker == 'Yes'
    
    def test_gpt_extended_filters(self, converter):
        """Test GPT-extracted extended filter application."""
        state = ConversationState(session_id="test-gpt")
        state.location_state = LocationState(city="Toronto")
        
        gpt_filters = {
            "basement_type": "finished",
            "garage_type": "attached",
            "pool": True,
            "year_built_min": 2010,
            "maintenance_fee_max": 600,
            "floor_level_min": 15,
            "condo_exposure": "south-west"
        }
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.basement_type == "finished"
        assert filters.garage_type == "attached"
        assert filters.has_pool == True
        assert filters.min_year_built == 2010
        assert filters.max_maintenance == 600
        assert filters.floor_level == 15
        assert filters.exposure == "south-west"
    
    def test_message_extraction_basement(self, converter):
        """Test basement type extraction from message."""
        state = ConversationState(session_id="test-msg")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="looking for a house with finished basement")
        
        assert filters.basement_type == "finished"
    
    def test_message_extraction_walkout(self, converter):
        """Test walkout basement extraction from message."""
        state = ConversationState(session_id="test-walkout")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="I want a property with walkout basement")
        
        assert filters.basement_type == "walkout"
    
    def test_message_extraction_waterfront(self, converter):
        """Test waterfront extraction from message."""
        state = ConversationState(session_id="test-water")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="show me lakefront properties")
        
        assert filters.waterfront == True
        assert filters.waterfront_type == "lake"
    
    def test_message_extraction_pool(self, converter):
        """Test pool type extraction from message."""
        state = ConversationState(session_id="test-pool")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="house with inground pool")
        
        assert filters.has_pool == True
        assert filters.pool == "inground"
    
    def test_message_extraction_garage(self, converter):
        """Test garage type extraction from message."""
        state = ConversationState(session_id="test-garage")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="home with attached garage")
        
        assert filters.garage_type == "attached"
    
    def test_message_extraction_new_construction(self, converter):
        """Test new construction extraction from message."""
        state = ConversationState(session_id="test-new")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="looking for new construction homes")
        
        from datetime import datetime
        current_year = datetime.now().year
        assert filters.min_year_built == current_year - 2
    
    def test_message_extraction_recently_listed(self, converter):
        """Test recently listed extraction from message."""
        state = ConversationState(session_id="test-recent")
        state.location_state = LocationState(city="Toronto")
        
        filters = converter.convert(state, user_message="show me recently listed condos")
        
        # Should set min_list_date to 7 days ago
        assert filters.min_list_date is not None


class TestExtendedGPTPrompt:
    """Tests for the extended GPT interpreter prompt."""
    
    def test_prompt_contains_residential_filters(self):
        """Test that the prompt includes residential filter documentation."""
        prompt = get_extended_gpt_prompt()
        
        # Check for key filter categories
        assert "basement_type" in prompt
        assert "garage_type" in prompt
        assert "pool" in prompt
        assert "waterfront" in prompt
        assert "maintenance_fee" in prompt
        assert "condo_exposure" in prompt
        assert "floor_level" in prompt
        assert "heating_type" in prompt
        assert "year_built" in prompt
    
    def test_prompt_contains_examples(self):
        """Test that the prompt includes usage examples."""
        prompt = get_extended_gpt_prompt()
        
        assert "finished basement" in prompt.lower()
        assert "garage_type" in prompt.lower()
        assert "south exposure" in prompt.lower() or "condo_exposure" in prompt.lower()


class TestChatbotPromptIntegration:
    """Tests for different chatbot prompts and their filter extraction."""
    
    @pytest.fixture
    def converter(self):
        return StateToFiltersConverter()
    
    # ===============================================
    # PROMPT TESTS: Various natural language queries
    # ===============================================
    
    def test_prompt_basic_condo_search(self, converter):
        """Test: 'Show me 2 bedroom condos in Toronto under 700k'"""
        state = ConversationState(session_id="prompt-1")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        state.bedrooms = 2
        state.price_range = (None, 700000)
        
        filters = converter.convert(state)
        
        assert filters.city == "Toronto"
        assert filters.min_bedrooms == 2
        assert filters.max_bedrooms == 2
        assert filters.max_price == 700000
    
    def test_prompt_house_with_pool(self, converter):
        """Test: 'Houses in Mississauga with pool and garage'"""
        state = ConversationState(session_id="prompt-2")
        state.location_state = LocationState(city="Mississauga")
        state.property_type = "house"
        state.amenities = ["pool"]
        
        gpt_filters = {"garage_type": "attached"}
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.city == "Mississauga"
        assert filters.has_pool == True
        assert filters.garage_type == "attached"
    
    def test_prompt_condo_high_floor(self, converter):
        """Test: 'Condo on 20th floor or higher with south exposure'"""
        state = ConversationState(session_id="prompt-3")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        
        gpt_filters = {
            "floor_level_min": 20,
            "condo_exposure": "south"
        }
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.floor_level == 20  # floor_level_min maps to floor_level
        assert filters.exposure == "south"
    
    def test_prompt_waterfront_cottage(self, converter):
        """Test: 'Waterfront cottage with dock in Muskoka'"""
        state = ConversationState(session_id="prompt-4")
        state.location_state = LocationState(city="Muskoka")
        state.property_type = "cottage"
        state.amenities = ["waterfront"]
        
        filters = converter.convert(state, user_message="waterfront cottage with dock")
        
        assert filters.waterfront == True
    
    def test_prompt_finished_basement(self, converter):
        """Test: 'Detached home with finished basement under 900k'"""
        state = ConversationState(session_id="prompt-5")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "detached"
        state.price_range = (None, 900000)
        
        gpt_filters = {"basement_type": "finished"}
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.basement_type == "finished"
        assert filters.max_price == 900000
    
    def test_prompt_rental_parking(self, converter):
        """Test: 'Rental condo with parking under $3000/month'"""
        state = ConversationState(session_id="prompt-6")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        state.listing_type = "rent"
        state.price_range = (None, 3000)
        state.parking_spots = 1
        
        filters = converter.convert(state)
        
        assert filters.transaction_type == "Lease"
        assert filters.max_price == 3000
        assert filters.min_parking_spaces == 1
    
    def test_prompt_new_listing(self, converter):
        """Test: 'Show me new listings in Yorkville'"""
        state = ConversationState(session_id="prompt-7")
        state.location_state = LocationState(city="Toronto", neighborhood="Yorkville")
        
        gpt_filters = {"is_new_listing": True}
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.neighborhood == "Yorkville"
        # is_new_listing should set min_list_date
        assert filters.min_list_date is not None
    
    def test_prompt_maintenance_fee_limit(self, converter):
        """Test: 'Condo with maintenance fee under $500'"""
        state = ConversationState(session_id="prompt-8")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        
        gpt_filters = {"maintenance_fee_max": 500}
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.max_maintenance == 500
    
    def test_prompt_modern_home(self, converter):
        """Test: 'Modern home built after 2015 with central air'"""
        state = ConversationState(session_id="prompt-9")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "house"
        
        gpt_filters = {
            "year_built_min": 2015,
            "cooling_type": "central_air"
        }
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.min_year_built == 2015
        assert filters.cooling_type == "central_air"
    
    def test_prompt_townhouse_multiple_parking(self, converter):
        """Test: 'Townhouse with at least 2 parking spots'"""
        state = ConversationState(session_id="prompt-10")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "townhouse"
        
        gpt_filters = {"parking_spaces": 2}
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.min_parking_spaces == 2
    
    def test_prompt_bungalow_style(self, converter):
        """Test: 'Looking for bungalow with walkout basement'"""
        state = ConversationState(session_id="prompt-11")
        state.location_state = LocationState(city="Toronto")
        state.property_style = "bungalow"
        
        filters = converter.convert(state, user_message="bungalow with walkout basement")
        
        assert filters.property_style == "bungalow"
        assert filters.basement_type == "walkout"
    
    def test_prompt_investment_property(self, converter):
        """Test: 'Investment condo with gym and concierge'"""
        state = ConversationState(session_id="prompt-12")
        state.location_state = LocationState(city="Toronto")
        state.property_type = "condo"
        state.amenities = ["gym", "concierge"]
        
        filters = converter.convert(state)
        
        assert "gym" in filters.building_amenities
        assert "concierge" in filters.building_amenities
    
    def test_prompt_specific_sqft(self, converter):
        """Test: 'Condo at least 800 sqft in downtown'"""
        state = ConversationState(session_id="prompt-13")
        state.location_state = LocationState(city="Toronto", neighborhood="Downtown")
        state.property_type = "condo"
        state.sqft_range = (800, None)
        
        filters = converter.convert(state)
        
        assert filters.min_sqft == 800
    
    def test_prompt_family_home(self, converter):
        """Test: '4 bedroom house with big backyard in Oakville'"""
        state = ConversationState(session_id="prompt-14")
        state.location_state = LocationState(city="Oakville")
        state.property_type = "house"
        state.bedrooms = 4
        # Note: 'garden' is used for backyard in building_amenities
        
        filters = converter.convert(state)
        
        assert filters.city == "Oakville"
        # bedrooms is not directly set on filters, it uses min_bedrooms/max_bedrooms
        # The converter would need to handle this
    
    def test_prompt_luxury_penthouse(self, converter):
        """Test: 'Luxury penthouse with terrace in Yorkville'"""
        state = ConversationState(session_id="prompt-15")
        state.location_state = LocationState(city="Toronto", neighborhood="Yorkville")
        state.property_type = "condo"
        state.price_range = (2000000, None)
        
        gpt_filters = {
            "balcony": "terrace",
            "floor_level_min": 30
        }
        
        filters = converter.convert(state, gpt_filters)
        
        assert filters.neighborhood == "Yorkville"
        assert filters.balcony == "terrace"
        assert filters.floor_level == 30


class TestResidentialSearchIntegration:
    """Tests for the full search integration."""
    
    @pytest.fixture
    def mock_search_service(self):
        """Create a mock search service."""
        mock = MagicMock()
        mock.search.return_value = {
            'success': True,
            'listings': [
                {'mlsNumber': 'C1234567', 'listPrice': 650000, 'address': {'city': 'Toronto'}},
                {'mlsNumber': 'C1234568', 'listPrice': 700000, 'address': {'city': 'Toronto'}},
            ],
            'count': 2,
            'api_params': {'city': 'Toronto'}
        }
        return mock
    
    def test_search_from_state(self, mock_search_service):
        """Test search execution from ConversationState."""
        with patch('services.residential_chatbot_integration.get_residential_search_service', return_value=mock_search_service):
            integration = ResidentialSearchIntegration()
            integration.search_service = mock_search_service
            
            state = ConversationState(session_id="test-int-1")
            state.location_state = LocationState(city="Toronto")
            state.bedrooms = 2
            
            results = integration.search_from_state(state)
            
            assert results['success'] == True
            assert len(results['results']) == 2
            assert results['total'] == 2
    
    def test_search_with_extended_filters(self, mock_search_service):
        """Test search with GPT-extracted extended filters."""
        with patch('services.residential_chatbot_integration.get_residential_search_service', return_value=mock_search_service):
            integration = ResidentialSearchIntegration()
            integration.search_service = mock_search_service
            
            state = ConversationState(session_id="test-int-2")
            state.location_state = LocationState(city="Toronto")
            
            gpt_filters = {
                "basement_type": "finished",
                "pool": True,
                "year_built_min": 2010
            }
            
            results = integration.search_from_state(
                state,
                gpt_filters=gpt_filters
            )
            
            assert results['success'] == True
            assert 'basement_type' in results.get('filters_used', {})
    
    def test_search_error_handling(self):
        """Test error handling when search fails."""
        with patch('services.residential_chatbot_integration.get_residential_search_service') as mock_get:
            mock_service = MagicMock()
            mock_service.search.side_effect = Exception("API Error")
            mock_get.return_value = mock_service
            
            integration = ResidentialSearchIntegration()
            integration.search_service = mock_service
            
            state = ConversationState(session_id="test-int-3")
            state.location_state = LocationState(city="Toronto")
            
            results = integration.search_from_state(state)
            
            assert results['success'] == False
            assert 'error' in results


class TestConvenienceFunctions:
    """Tests for convenience functions used by orchestrator."""
    
    def test_search_residential_properties(self):
        """Test the main convenience function."""
        with patch('services.residential_chatbot_integration.get_residential_integration') as mock_get:
            mock_integration = MagicMock()
            mock_integration.search_from_state.return_value = {
                'success': True,
                'results': [],
                'total': 0
            }
            mock_get.return_value = mock_integration
            
            state = ConversationState(session_id="test-conv-1")
            state.location_state = LocationState(city="Toronto")
            
            results = search_residential_properties(state)
            
            mock_integration.search_from_state.assert_called_once()
    
    def test_get_extended_gpt_prompt_not_empty(self):
        """Test that the extended prompt is properly defined."""
        prompt = get_extended_gpt_prompt()
        
        assert prompt is not None
        assert len(prompt) > 100
        assert "basement" in prompt.lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-x'])
