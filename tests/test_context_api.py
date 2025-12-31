"""
Tests for Context Chat API endpoints
Tests Flask routes and integration with context manager
"""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock

# Mock the services before importing the routes
import sys
from unittest.mock import MagicMock
sys.modules['services.conversation_context_manager'] = MagicMock()
sys.modules['services.openai_service'] = MagicMock()

from app.routes.context_chat_api import context_chat_api, _detect_intent, _build_contextual_prompt


@pytest.fixture
def client():
    """Create Flask test client"""
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(context_chat_api)
    app.config['TESTING'] = True
    return app.test_client()


@pytest.fixture
def mock_context_manager():
    """Mock conversation context manager"""
    with patch('app.routes.context_chat_api.context_manager') as mock:
        yield mock


@pytest.fixture
def mock_openai_service():
    """Mock OpenAI service"""
    with patch('app.routes.context_chat_api.openai_service') as mock:
        yield mock


class TestIntentDetection:
    """Test intent classification"""
    
    def test_detect_search_intent(self):
        """Verify search intent detection"""
        assert _detect_intent('Show me condos in Toronto') == 'search'
        assert _detect_intent('Find properties under $500k') == 'search'
        assert _detect_intent('Looking for 3 bedroom homes') == 'search'
    
    def test_detect_question_intent(self):
        """Verify question intent detection"""
        assert _detect_intent('What is the market like?') == 'question'
        assert _detect_intent('How much are closing costs?') == 'question'
        assert _detect_intent('Why are prices rising?') == 'question'
    
    def test_detect_comparison_intent(self):
        """Verify comparison intent detection"""
        assert _detect_intent('Compare these two properties') == 'comparison'
        assert _detect_intent('Which is better?') == 'comparison'
        assert _detect_intent('Show me the difference between them') == 'comparison'
    
    def test_detect_valuation_intent(self):
        """Verify valuation intent detection"""
        assert _detect_intent('What is my home worth?') == 'valuation'
        assert _detect_intent('Can you value this property?') == 'valuation'
        assert _detect_intent('Home valuation estimate') == 'valuation'
    
    def test_detect_feedback_intent(self):
        """Verify feedback intent detection"""
        assert _detect_intent('Thanks for helping') == 'feedback'
        assert _detect_intent('Not helpful') == 'feedback'
        assert _detect_intent('Great job') == 'feedback'
    
    def test_detect_general_intent(self):
        """Verify general/other intent detection"""
        assert _detect_intent('Hello') == 'general'
        assert _detect_intent('Tell me about yourself') == 'general'


class TestContextualPromptBuilding:
    """Test contextual prompt construction"""
    
    def test_build_prompt_with_preferences(self):
        """Verify prompt includes preferences"""
        context = {
            'summary': 'User interested in Toronto condos',
            'preferences': {
                'locations': ['Toronto'],
                'property_types': ['condo']
            },
            'engagement_level': 5
        }
        
        prompt = _build_contextual_prompt('Show me options', context)
        
        assert 'Toronto' in prompt
        assert 'condo' in prompt
    
    def test_build_prompt_with_conversation_history(self):
        """Verify prompt includes conversation history"""
        context = {
            'recent_conversation': 'User: Hello\nAssistant: Hi!',
            'preferences': {},
            'engagement_level': 3
        }
        
        prompt = _build_contextual_prompt('Continue', context)
        
        assert 'User: Hello' in prompt
        assert 'Assistant: Hi!' in prompt


class TestChatContextEndpoint:
    """Test POST /api/chat/context"""
    
    def test_chat_with_new_user(self, client, mock_context_manager, mock_openai_service):
        """Verify chat endpoint handles new user"""
        # Setup mocks
        mock_context_manager.get_context_for_ai.return_value = {
            'summary': 'New user',
            'preferences': {},
            'recent_conversation': '',
            'engagement_level': 0
        }
        mock_context_manager.predict_next_questions.return_value = [
            'Tell me about Toronto market'
        ]
        mock_openai_service.get_chat_completion.return_value = 'Hello! How can I help?'
        
        # Make request
        response = client.post('/api/chat/context', 
            json={'user_id': 'user123', 'message': 'Hello'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'response' in data
        assert 'predicted_questions' in data
    
    def test_chat_updates_conversation(self, client, mock_context_manager, mock_openai_service):
        """Verify chat endpoint updates conversation history"""
        mock_context_manager.get_context_for_ai.return_value = {
            'summary': '', 'preferences': {}, 'recent_conversation': '', 'engagement_level': 0
        }
        mock_context_manager.predict_next_questions.return_value = []
        mock_openai_service.get_chat_completion.return_value = 'Response'
        
        client.post('/api/chat/context',
            json={'user_id': 'user123', 'message': 'Test message'}
        )
        
        # Verify conversation updated
        assert mock_context_manager.add_to_conversation.called
    
    def test_chat_missing_user_id(self, client):
        """Verify error when user_id missing"""
        response = client.post('/api/chat/context',
            json={'message': 'Hello'}
        )
        
        assert response.status_code == 400
    
    def test_chat_missing_message(self, client):
        """Verify error when message missing"""
        response = client.post('/api/chat/context',
            json={'user_id': 'user123'}
        )
        
        assert response.status_code == 400


class TestSessionEndpoint:
    """Test GET /api/chat/session/<user_id>"""
    
    def test_get_session_info(self, client, mock_context_manager):
        """Verify session endpoint returns info"""
        mock_context_manager.get_session_stats.return_value = {
            'user_id': 'user123',
            'conversation_length': 5,
            'search_count': 2,
            'engagement_level': 7
        }
        
        response = client.get('/api/chat/session/user123')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['user_id'] == 'user123'
        assert data['conversation_length'] == 5


class TestHistoryEndpoint:
    """Test GET /api/chat/history/<user_id>"""
    
    def test_get_conversation_history(self, client, mock_context_manager):
        """Verify history endpoint returns messages"""
        mock_session = {
            'conversation_history': [
                {'message': 'Hello', 'sender': 'user'},
                {'message': 'Hi there', 'sender': 'assistant'}
            ]
        }
        mock_context_manager.get_or_create_session.return_value = mock_session
        
        response = client.get('/api/chat/history/user123')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['history']) == 2
    
    def test_get_history_with_limit(self, client, mock_context_manager):
        """Verify history respects limit parameter"""
        mock_session = {
            'conversation_history': [
                {'message': f'Message {i}', 'sender': 'user'}
                for i in range(20)
            ]
        }
        mock_context_manager.get_or_create_session.return_value = mock_session
        
        response = client.get('/api/chat/history/user123?limit=5')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['history']) == 5


class TestSearchUpdateEndpoint:
    """Test POST /api/chat/search-update"""
    
    def test_update_search_context(self, client, mock_context_manager):
        """Verify search update endpoint"""
        mock_context_manager.get_or_create_session.return_value = {
            'behavioral_signals': {'search_count': 1}
        }
        
        response = client.post('/api/chat/search-update',
            json={
                'user_id': 'user123',
                'query': 'Toronto condos',
                'results': [{'id': 'prop1'}]
            }
        )
        
        assert response.status_code == 200
        assert mock_context_manager.update_search_context.called
    
    def test_search_update_missing_fields(self, client):
        """Verify error when required fields missing"""
        response = client.post('/api/chat/search-update',
            json={'user_id': 'user123'}
        )
        
        assert response.status_code == 400


class TestPropertyViewEndpoint:
    """Test POST /api/chat/property-view"""
    
    def test_track_property_view(self, client, mock_context_manager):
        """Verify property view tracking"""
        mock_context_manager.get_or_create_session.return_value = {
            'behavioral_signals': {'property_views_count': 1}
        }
        
        response = client.post('/api/chat/property-view',
            json={
                'user_id': 'user123',
                'property_id': 'prop1',
                'property_data': {'price': 500000}
            }
        )
        
        assert response.status_code == 200
        assert mock_context_manager.update_property_view.called


class TestPredictionsEndpoint:
    """Test GET /api/chat/predictions/<user_id>"""
    
    def test_get_predictions(self, client, mock_context_manager):
        """Verify predictions endpoint"""
        mock_context_manager.predict_next_questions.return_value = [
            'What about the neighborhood?',
            'Show me similar properties'
        ]
        
        response = client.get('/api/chat/predictions/user123')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['predictions']) == 2


class TestComparisonEndpoint:
    """Test POST /api/chat/comparison/<user_id>"""
    
    def test_add_to_comparison(self, client, mock_context_manager):
        """Verify adding to comparison list"""
        mock_session = {
            'current_context': {
                'comparison_list': ['prop1', 'prop2']
            }
        }
        mock_context_manager.get_or_create_session.return_value = mock_session
        
        response = client.post('/api/chat/comparison/user123',
            json={'property_id': 'prop2'}
        )
        
        assert response.status_code == 200
        assert mock_context_manager.add_to_comparison.called
    
    def test_comparison_missing_property_id(self, client):
        """Verify error when property_id missing"""
        response = client.post('/api/chat/comparison/user123',
            json={}
        )
        
        assert response.status_code == 400


class TestErrorHandling:
    """Test error handling in endpoints"""
    
    def test_chat_context_manager_error(self, client, mock_context_manager):
        """Verify graceful handling of context manager errors"""
        mock_context_manager.get_context_for_ai.side_effect = Exception('Test error')
        
        response = client.post('/api/chat/context',
            json={'user_id': 'user123', 'message': 'Hello'}
        )
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_chat_openai_error(self, client, mock_context_manager, mock_openai_service):
        """Verify fallback when OpenAI fails"""
        mock_context_manager.get_context_for_ai.return_value = {
            'summary': '', 'preferences': {}, 'recent_conversation': '', 'engagement_level': 0
        }
        mock_openai_service.get_chat_completion.side_effect = Exception('API error')
        
        response = client.post('/api/chat/context',
            json={'user_id': 'user123', 'message': 'Hello'}
        )
        
        # Should return fallback response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'response' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
