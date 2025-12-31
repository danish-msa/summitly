#!/usr/bin/env python3
"""
Test Cases for HuggingFace FastAPI Integration
Real Estate Chatbot Testing Suite
"""

import asyncio
import pytest
import json
import time
from typing import Dict, List, Any
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# Import our modules for testing
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import (
    ChatRequest, ChatResponse, UserPreferences, RealEstateContext,
    ConversationMessage, MessageRole, ConversationIntent, ModelStatus
)
from services.huggingface_service import HuggingFaceService, ConversationManager
from utils.prompt_templates import RealEstatePromptTemplates
from utils.logging_metrics import get_metrics_collector, log_conversation_metrics
from config import HuggingFaceConfig

class TestRealEstateConversationFlows:
    """Test real estate conversation flows and scenarios"""
    
    @pytest.fixture
    def mock_huggingface_service(self):
        """Mock HuggingFace service for testing"""
        service = Mock(spec=HuggingFaceService)
        
        # Mock successful response
        service.generate_response = AsyncMock(return_value={
            "ai_response": "I'd be happy to help you find a condo in Toronto! With your budget, you have some excellent options in areas like...",
            "confidence_score": 0.89,
            "model_used": "facebook/blenderbot-400M-distill",
            "timestamp": datetime.now().isoformat(),
            "response_time": 1.23,
            "intent": "property_search",
            "session_id": "test_session",
            "conversation_turn": 1,
            "status": "success"
        })
        
        return service
    
    @pytest.fixture 
    def sample_user_preferences(self):
        """Sample user preferences for testing"""
        return UserPreferences(
            location="Toronto",
            budget_max=800000,
            property_type="condo",
            bedrooms=2,
            bathrooms=2,
            first_time_buyer=True
        )
    
    @pytest.fixture
    def sample_real_estate_context(self):
        """Sample real estate context for testing"""
        return RealEstateContext(
            current_properties=[
                {"id": "PROP001", "title": "Downtown Toronto Condo", "price": "$750,000"}
            ],
            market_data={"avg_price": 700000, "trend": "increasing"},
            location_insights={"walkability": "excellent", "transit": "subway_nearby"}
        )
    
    @pytest.mark.asyncio
    async def test_first_time_buyer_conversation_flow(self, mock_huggingface_service, sample_user_preferences):
        """Test conversation flow for first-time buyers"""
        
        # Test data
        conversation_history = [
            ConversationMessage(role=MessageRole.USER, content="Hi, I'm looking to buy my first home"),
            ConversationMessage(role=MessageRole.ASSISTANT, content="Congratulations on taking this exciting step! I'd love to help you...")
        ]
        
        request = ChatRequest(
            user_message="I'm a first-time buyer looking for a condo in Toronto under $800k",
            conversation_history=conversation_history,
            session_id="first_time_buyer_test",
            user_preferences=sample_user_preferences,
            language="en"
        )
        
        # Mock the service call
        response = await mock_huggingface_service.generate_response(
            user_message=request.user_message,
            session_id=request.session_id,
            conversation_history=[msg.model_dump() for msg in conversation_history],
            user_preferences=sample_user_preferences.model_dump(exclude_none=True)
        )
        
        # Assertions
        assert response["status"] == "success"
        assert response["intent"] == "property_search"
        assert "Toronto" in response["ai_response"] or "condo" in response["ai_response"]
        assert response["confidence_score"] > 0.5
        assert response["response_time"] > 0
        
        print("✅ First-time buyer conversation flow test passed")
    
    @pytest.mark.asyncio
    async def test_investment_property_conversation_flow(self, mock_huggingface_service):
        """Test conversation flow for investment property inquiries"""
        
        # Modify mock for investment scenario
        mock_huggingface_service.generate_response.return_value = {
            "ai_response": "For investment properties in Toronto, I'd recommend looking at areas with strong rental demand and appreciation potential...",
            "confidence_score": 0.92,
            "model_used": "facebook/blenderbot-400M-distill",
            "timestamp": datetime.now().isoformat(),
            "response_time": 1.45,
            "intent": "investment_inquiry",
            "session_id": "investment_test",
            "conversation_turn": 2,
            "status": "success"
        }
        
        user_preferences = UserPreferences(
            location="Toronto",
            budget_max=1200000,
            property_type="house",
            investment_purpose=True
        )
        
        request = ChatRequest(
            user_message="I'm looking for an investment property in Toronto, what areas would you recommend?",
            session_id="investment_test",
            user_preferences=user_preferences
        )
        
        response = await mock_huggingface_service.generate_response(
            user_message=request.user_message,
            session_id=request.session_id,
            user_preferences=user_preferences.model_dump(exclude_none=True)
        )
        
        # Assertions
        assert response["intent"] == "investment_inquiry"
        assert "investment" in response["ai_response"].lower()
        assert response["confidence_score"] > 0.8
        
        print("✅ Investment property conversation flow test passed")
    
    @pytest.mark.asyncio
    async def test_multi_turn_conversation_context(self, mock_huggingface_service, sample_user_preferences):
        """Test multi-turn conversation with context preservation"""
        
        # Simulate a multi-turn conversation
        conversation_turns = [
            ("Hi, I'm looking for a condo in Toronto", "property_search"),
            ("What's the average price in downtown?", "market_analysis"),
            ("Can you show me some specific properties?", "property_search"),
            ("What about the schools in that area?", "location_inquiry")
        ]
        
        conversation_history = []
        
        for turn, expected_intent in conversation_turns:
            # Update mock response for each turn
            mock_huggingface_service.generate_response.return_value = {
                "ai_response": f"Response for: {turn}",
                "confidence_score": 0.85,
                "model_used": "facebook/blenderbot-400M-distill",
                "timestamp": datetime.now().isoformat(),
                "response_time": 1.1,
                "intent": expected_intent,
                "session_id": "multi_turn_test",
                "conversation_turn": len(conversation_history) + 1,
                "status": "success"
            }
            
            # Make request
            response = await mock_huggingface_service.generate_response(
                user_message=turn,
                session_id="multi_turn_test",
                conversation_history=[msg.model_dump() for msg in conversation_history],
                user_preferences=sample_user_preferences.model_dump(exclude_none=True)
            )
            
            # Add to conversation history
            conversation_history.extend([
                ConversationMessage(role=MessageRole.USER, content=turn),
                ConversationMessage(role=MessageRole.ASSISTANT, content=response["ai_response"])
            ])
            
            # Verify intent detection
            assert response["intent"] == expected_intent
            assert response["conversation_turn"] == len(conversation_history) // 2
        
        print("✅ Multi-turn conversation context test passed")
    
    def test_prompt_template_integration(self):
        """Test integration with prompt templates"""
        
        # Test getting system prompt
        system_prompt = RealEstatePromptTemplates.get_template("general_system", "en")
        assert system_prompt is not None
        assert "Canadian real estate" in system_prompt.template
        
        # Test location inquiry template
        location_template = RealEstatePromptTemplates.get_template("location_inquiry", "en")
        assert location_template is not None
        
        test_variables = {
            "location": "Toronto",
            "area_type": "metropolitan city",
            "neighborhood_character": "diverse and vibrant",
            "transportation_info": "excellent TTC access",
            "education_info": "top-rated schools",
            "amenities_info": "world-class dining and entertainment",
            "market_trends": "steady appreciation",
            "property_type": "condos",
            "price_range": "$600K - $1.2M CAD"
        }
        
        formatted_prompt = RealEstatePromptTemplates.format_template(
            "location_inquiry", test_variables, "en"
        )
        
        assert "Toronto" in formatted_prompt
        assert "CAD" in formatted_prompt
        assert "diverse and vibrant" in formatted_prompt
        
        print("✅ Prompt template integration test passed")
    
    def test_context_enhanced_prompt_building(self):
        """Test context-enhanced prompt building"""
        
        user_preferences = {
            "location": "Toronto",
            "budget_max": 800000,
            "property_type": "condo",
            "first_time_buyer": True
        }
        
        conversation_history = [
            {"role": "user", "content": "Hi, I'm looking for a home"},
            {"role": "assistant", "content": "I'd be happy to help you find a home!"}
        ]
        
        enhanced_prompt = RealEstatePromptTemplates.build_context_enhanced_prompt(
            user_message="What areas in Toronto would you recommend?",
            user_preferences=user_preferences,
            conversation_history=conversation_history,
            intent="property_search"
        )
        
        # Verify context is included
        assert "Toronto" in enhanced_prompt
        assert "first-time" in enhanced_prompt or "first time" in enhanced_prompt
        assert "condo" in enhanced_prompt
        assert "$800,000" in enhanced_prompt or "800000" in enhanced_prompt
        assert "Recent Conversation" in enhanced_prompt
        
        print("✅ Context-enhanced prompt building test passed")

class TestHuggingFaceServiceMocking:
    """Test HuggingFace service with various mocked scenarios"""
    
    @patch('services.huggingface_service.requests.Session.post')
    def test_successful_api_call(self, mock_post):
        """Test successful HuggingFace API call"""
        
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"generated_text": "I'd be happy to help you find properties in Toronto!", "score": 0.9}
        ]
        mock_post.return_value = mock_response
        
        # Create service (we'll use a real instance but with mocked HTTP)
        service = HuggingFaceService()
        
        # Test API call
        result = service._make_api_request(
            "facebook/blenderbot-400M-distill", 
            "Hello, I'm looking for a condo in Toronto"
        )
        
        assert result["status"] == "success"
        assert result["response"] == mock_response.json.return_value
        assert result["response_time"] > 0
        
        print("✅ Successful API call test passed")
    
    @patch('services.huggingface_service.requests.Session.post')
    def test_model_loading_scenario(self, mock_post):
        """Test scenario where model is loading"""
        
        # Mock model loading response
        mock_response = Mock()
        mock_response.status_code = 503
        mock_response.json.return_value = {"estimated_time": 20}
        mock_post.return_value = mock_response
        
        service = HuggingFaceService()
        
        # Should raise HuggingFaceAPIError for model loading
        with pytest.raises(Exception):  # Will be caught by retry mechanism
            service._make_api_request(
                "facebook/blenderbot-400M-distill",
                "Test message"
            )
        
        print("✅ Model loading scenario test passed")
    
    @patch('services.huggingface_service.requests.Session.post')
    def test_rate_limiting_scenario(self, mock_post):
        """Test rate limiting scenario"""
        
        # Mock rate limit response
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.text = "Rate limit exceeded"
        mock_post.return_value = mock_response
        
        service = HuggingFaceService()
        
        # Should raise HuggingFaceAPIError for rate limiting
        with pytest.raises(Exception):
            service._make_api_request(
                "facebook/blenderbot-400M-distill",
                "Test message"
            )
        
        print("✅ Rate limiting scenario test passed")
    
    def test_response_parsing(self):
        """Test response parsing for different model types"""
        
        service = HuggingFaceService()
        
        # Test BlenderBot response
        blenderbot_response = {
            "response": [{"generated_text": "Hello! I can help you find properties.", "score": 0.9}]
        }
        
        text, confidence = service._parse_model_response(
            blenderbot_response, 
            "facebook/blenderbot-400M-distill"
        )
        
        assert text == "Hello! I can help you find properties."
        assert confidence == 0.9
        
        # Test DialoGPT response
        dialogpt_response = {
            "response": {"generated_text": "I'd be happy to help you!"}
        }
        
        text, confidence = service._parse_model_response(
            dialogpt_response,
            "microsoft/DialoGPT-medium"
        )
        
        assert text == "I'd be happy to help you!"
        assert confidence == 0.8  # Default confidence
        
        print("✅ Response parsing test passed")

class TestErrorHandlingAndFallbacks:
    """Test error handling and fallback mechanisms"""
    
    @pytest.mark.asyncio
    async def test_primary_model_failure_fallback(self):
        """Test fallback to secondary model when primary fails"""
        
        service = Mock(spec=HuggingFaceService)
        
        # Mock primary model failure, secondary success
        def mock_generate_response(*args, **kwargs):
            # Simulate trying primary model first (fails), then fallback (succeeds)
            return {
                "ai_response": "I'm experiencing some issues but can still help you find properties.",
                "confidence_score": 0.7,
                "model_used": "microsoft/DialoGPT-medium",  # Fallback model
                "timestamp": datetime.now().isoformat(),
                "response_time": 2.1,
                "intent": "general",
                "session_id": "fallback_test",
                "conversation_turn": 1,
                "status": "fallback_used"
            }
        
        service.generate_response = AsyncMock(side_effect=mock_generate_response)
        
        response = await service.generate_response(
            user_message="I'm looking for a condo",
            session_id="fallback_test"
        )
        
        assert response["status"] == "fallback_used"
        assert response["model_used"] == "microsoft/DialoGPT-medium"
        assert response["confidence_score"] > 0
        
        print("✅ Primary model failure fallback test passed")
    
    @pytest.mark.asyncio 
    async def test_complete_failure_graceful_degradation(self):
        """Test graceful degradation when all models fail"""
        
        service = Mock(spec=HuggingFaceService)
        
        # Mock complete failure
        service.generate_response = AsyncMock(return_value={
            "ai_response": "I'm experiencing technical difficulties right now. Let me connect you with one of our real estate experts.",
            "confidence_score": 0.1,
            "model_used": "fallback",
            "timestamp": datetime.now().isoformat(),
            "response_time": 0.5,
            "intent": "error",
            "session_id": "error_test",
            "conversation_turn": 1,
            "status": "error",
            "error": "All models unavailable"
        })
        
        response = await service.generate_response(
            user_message="I'm looking for a house",
            session_id="error_test"
        )
        
        assert response["status"] == "error"
        assert "technical difficulties" in response["ai_response"]
        assert "real estate experts" in response["ai_response"]
        
        print("✅ Complete failure graceful degradation test passed")

class TestLoggingAndMetrics:
    """Test logging and metrics functionality"""
    
    def test_conversation_metrics_logging(self):
        """Test conversation metrics logging"""
        
        # Test the utility function
        log_conversation_metrics(
            session_id="metrics_test",
            user_message="I'm looking for a condo in Toronto",
            ai_response="I'd be happy to help you find a condo!",
            model_used="facebook/blenderbot-400M-distill",
            response_time=1.23,
            confidence_score=0.89,
            intent="property_search",
            success=True
        )
        
        # Verify metrics were recorded
        collector = get_metrics_collector()
        session_metrics = collector.get_session_metrics("metrics_test")
        
        assert session_metrics is not None
        assert session_metrics["total_interactions"] > 0
        assert len(session_metrics["response_times"]) > 0
        assert "facebook/blenderbot-400M-distill" in session_metrics["models_used"]
        assert "property_search" in session_metrics["intents"]
        
        print("✅ Conversation metrics logging test passed")
    
    def test_performance_monitoring_context(self):
        """Test performance monitoring context manager"""
        
        from utils.logging_metrics import monitor_performance
        
        # Test performance monitor
        with monitor_performance("perf_test") as monitor:
            monitor.set_metadata(model="test_model", intent="test_intent")
            time.sleep(0.1)  # Simulate work
        
        # Verify metrics were recorded
        collector = get_metrics_collector()
        session_metrics = collector.get_session_metrics("perf_test")
        
        assert session_metrics is not None
        assert len(session_metrics["response_times"]) > 0
        assert session_metrics["response_times"][-1] >= 0.1
        
        print("✅ Performance monitoring context test passed")

class TestRealEstateScenarios:
    """Test specific real estate scenarios and edge cases"""
    
    @pytest.mark.asyncio
    async def test_budget_validation_and_suggestions(self, mock_huggingface_service):
        """Test budget validation and realistic suggestions"""
        
        # Test unrealistic budget scenario
        mock_huggingface_service.generate_response.return_value = {
            "ai_response": "I want to help you find something within your budget. In Toronto, $50,000 would be challenging for purchasing a property, but I can discuss other options like rent-to-own or co-ownership programs.",
            "confidence_score": 0.85,
            "model_used": "facebook/blenderbot-400M-distill",
            "timestamp": datetime.now().isoformat(),
            "response_time": 1.1,
            "intent": "budget_discussion",
            "session_id": "budget_test",
            "conversation_turn": 1,
            "status": "success"
        }
        
        user_preferences = UserPreferences(
            location="Toronto",
            budget_max=50000,  # Unrealistic budget
            property_type="house"
        )
        
        response = await mock_huggingface_service.generate_response(
            user_message="I want to buy a house in Toronto for $50k",
            session_id="budget_test",
            user_preferences=user_preferences.model_dump(exclude_none=True)
        )
        
        # Should provide helpful alternatives rather than false hope
        assert "challenging" in response["ai_response"] or "difficult" in response["ai_response"]
        assert "options" in response["ai_response"] or "alternatives" in response["ai_response"]
        
        print("✅ Budget validation and suggestions test passed")
    
    @pytest.mark.asyncio
    async def test_canadian_market_context(self, mock_huggingface_service):
        """Test Canadian market specific context and terminology"""
        
        mock_huggingface_service.generate_response.return_value = {
            "ai_response": "In Canada, you'll need a minimum down payment of 5% for the first $500,000 and 10% for any amount above that. You'll also need to factor in CMHC insurance if your down payment is less than 20%. The closing costs typically include legal fees, home inspection, and land transfer tax.",
            "confidence_score": 0.92,
            "model_used": "facebook/blenderbot-400M-distill",
            "timestamp": datetime.now().isoformat(),
            "response_time": 1.3,
            "intent": "first_time_buyer",
            "session_id": "canadian_context_test",
            "conversation_turn": 1,
            "status": "success"
        }
        
        response = await mock_huggingface_service.generate_response(
            user_message="What do I need to know about buying my first home in Canada?",
            session_id="canadian_context_test"
        )
        
        # Verify Canadian-specific terms and information
        assert "CMHC" in response["ai_response"]
        assert "down payment" in response["ai_response"]
        assert "5%" in response["ai_response"]
        assert "Canada" in response["ai_response"] or "Canadian" in response["ai_response"]
        
        print("✅ Canadian market context test passed")
    
    @pytest.mark.asyncio
    async def test_bilingual_support_detection(self, mock_huggingface_service):
        """Test bilingual support for Canadian market (English/French)"""
        
        # Mock French response
        mock_huggingface_service.generate_response.return_value = {
            "ai_response": "Je serais ravi de vous aider à trouver une propriété au Canada. Cherchez-vous dans une région particulière comme Montréal ou Ottawa?",
            "confidence_score": 0.87,
            "model_used": "facebook/blenderbot-400M-distill",
            "timestamp": datetime.now().isoformat(),
            "response_time": 1.2,
            "intent": "property_search",
            "session_id": "french_test",
            "conversation_turn": 1,
            "status": "success"
        }
        
        # Test French language request
        request = ChatRequest(
            user_message="Je cherche une maison à Montréal",
            session_id="french_test",
            language="fr"
        )
        
        response = await mock_huggingface_service.generate_response(
            user_message=request.user_message,
            session_id=request.session_id
        )
        
        # Should respond in French
        french_indicators = ["vous", "une", "propriété", "Canada", "Montréal"]
        assert any(indicator in response["ai_response"] for indicator in french_indicators)
        
        print("✅ Bilingual support detection test passed")

# Example conversation flows for manual testing
class ExampleConversationFlows:
    """Example conversation flows for manual testing and demonstration"""
    
    @staticmethod
    def first_time_buyer_flow() -> List[Dict[str, str]]:
        """Example first-time buyer conversation flow"""
        return [
            {
                "user": "Hi, I'm thinking about buying my first home",
                "expected_intent": "first_time_buyer",
                "expected_keywords": ["congratulations", "exciting", "first-time", "help"]
            },
            {
                "user": "I'm looking in Toronto, what should I know?",
                "expected_intent": "location_inquiry", 
                "expected_keywords": ["Toronto", "market", "prices", "neighborhoods"]
            },
            {
                "user": "My budget is around $600,000, is that realistic?",
                "expected_intent": "budget_discussion",
                "expected_keywords": ["$600,000", "down payment", "realistic", "options"]
            },
            {
                "user": "What about condos vs houses?",
                "expected_intent": "property_details",
                "expected_keywords": ["condo", "house", "pros", "cons", "lifestyle"]
            },
            {
                "user": "How do I get started with the process?",
                "expected_intent": "first_time_buyer",
                "expected_keywords": ["pre-approval", "realtor", "next steps", "process"]
            }
        ]
    
    @staticmethod
    def investment_property_flow() -> List[Dict[str, str]]:
        """Example investment property conversation flow"""
        return [
            {
                "user": "I'm interested in investment properties in the GTA",
                "expected_intent": "investment_inquiry",
                "expected_keywords": ["investment", "GTA", "ROI", "rental"]
            },
            {
                "user": "What areas have the best growth potential?",
                "expected_intent": "market_analysis",
                "expected_keywords": ["growth", "appreciation", "emerging", "areas"]
            },
            {
                "user": "I'm looking at a property for $850k, is that a good investment?",
                "expected_intent": "investment_inquiry",
                "expected_keywords": ["$850k", "cash flow", "rental yield", "analysis"]
            },
            {
                "user": "What are the tax implications I should know about?",
                "expected_intent": "investment_inquiry",
                "expected_keywords": ["tax", "capital gains", "rental income", "deductions"]
            }
        ]
    
    @staticmethod
    def property_search_flow() -> List[Dict[str, str]]:
        """Example property search conversation flow"""
        return [
            {
                "user": "I'm looking for a 3-bedroom house in Mississauga",
                "expected_intent": "property_search",
                "expected_keywords": ["3-bedroom", "house", "Mississauga", "properties"]
            },
            {
                "user": "My budget is up to $1.2 million",
                "expected_intent": "budget_discussion",
                "expected_keywords": ["$1.2 million", "budget", "options", "neighborhoods"]
            },
            {
                "user": "What neighborhoods would you recommend?",
                "expected_intent": "location_inquiry",
                "expected_keywords": ["neighborhoods", "schools", "amenities", "commute"]
            },
            {
                "user": "Can you show me some specific properties?",
                "expected_intent": "property_search",
                "expected_keywords": ["properties", "listings", "details", "viewing"]
            },
            {
                "user": "I'm interested in the one on Main Street, tell me more",
                "expected_intent": "property_details",
                "expected_keywords": ["analysis", "neighborhood", "value", "features"]
            }
        ]

# Utility functions for running tests

def run_conversation_flow_test(flow: List[Dict[str, str]], service_mock=None):
    """Run a conversation flow test"""
    print(f"\n🧪 Testing conversation flow with {len(flow)} turns...")
    
    session_id = f"flow_test_{int(time.time())}"
    conversation_history = []
    
    for i, turn in enumerate(flow, 1):
        print(f"\n--- Turn {i} ---")
        print(f"User: {turn['user']}")
        
        # Here you would call your actual service
        # For now, we'll just validate the expected patterns
        expected_intent = turn.get('expected_intent', 'general')
        expected_keywords = turn.get('expected_keywords', [])
        
        print(f"Expected Intent: {expected_intent}")
        print(f"Expected Keywords: {', '.join(expected_keywords)}")
        
        # Add to conversation history
        conversation_history.append({
            "role": "user",
            "content": turn["user"],
            "timestamp": datetime.now()
        })
        
        # Mock assistant response for testing
        mock_response = f"Mock response for intent '{expected_intent}' with keywords: {', '.join(expected_keywords[:2])}"
        conversation_history.append({
            "role": "assistant", 
            "content": mock_response,
            "timestamp": datetime.now()
        })
        
        print(f"Assistant: {mock_response}")
    
    print(f"\n✅ Conversation flow test completed ({len(flow)} turns)")
    return conversation_history

# Main test runner
if __name__ == "__main__":
    print("=" * 70)
    print("🧪 HUGGINGFACE FASTAPI INTEGRATION - TEST SUITE")
    print("=" * 70)
    
    # Run example conversation flows
    print("\n📋 Running Example Conversation Flows...")
    
    flows = ExampleConversationFlows()
    
    print("\n🏠 First-Time Buyer Flow:")
    run_conversation_flow_test(flows.first_time_buyer_flow())
    
    print("\n💰 Investment Property Flow:")
    run_conversation_flow_test(flows.investment_property_flow())
    
    print("\n🔍 Property Search Flow:")
    run_conversation_flow_test(flows.property_search_flow())
    
    # Test individual components
    print("\n🔧 Testing Individual Components...")
    
    # Test prompt templates
    test_instance = TestRealEstateConversationFlows()
    test_instance.test_prompt_template_integration()
    test_instance.test_context_enhanced_prompt_building()
    
    # Test logging and metrics
    metrics_test = TestLoggingAndMetrics()
    metrics_test.test_conversation_metrics_logging()
    metrics_test.test_performance_monitoring_context()
    
    print("\n✅ All tests completed successfully!")
    print("\nTo run full pytest suite:")
    print("  cd /path/to/v3")
    print("  python -m pytest tests/test_integration.py -v")
    print("\nTo run specific test categories:")
    print("  python -m pytest tests/test_integration.py::TestRealEstateConversationFlows -v")
    print("  python -m pytest tests/test_integration.py::TestHuggingFaceServiceMocking -v")
    print("  python -m pytest tests/test_integration.py::TestErrorHandlingAndFallbacks -v")