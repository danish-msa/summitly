"""
Comprehensive tests for Conversation Context Manager
Tests session management, preference extraction, and predictions
"""
import pytest
import time
from datetime import datetime
from unittest.mock import Mock, patch

from services.conversation_context_manager import ConversationContextManager


class TestSessionManagement:
    """Test session creation and management"""
    
    def test_create_new_session(self):
        """Verify new session creation"""
        manager = ConversationContextManager()
        
        session = manager.get_or_create_session('user123')
        
        assert session['user_id'] == 'user123'
        assert 'created_at' in session
        assert 'conversation_history' in session
        assert 'preferences' in session
        assert session['behavioral_signals']['engagement_level'] == 0
    
    def test_get_existing_session(self):
        """Verify existing session retrieval"""
        manager = ConversationContextManager()
        
        # Create session
        session1 = manager.get_or_create_session('user123')
        session1_id = session1['created_at']
        
        # Get same session
        session2 = manager.get_or_create_session('user123')
        
        assert session2['created_at'] == session1_id
        assert session2['user_id'] == 'user123'
    
    def test_session_persists_in_memory(self):
        """Verify session persists in memory store"""
        manager = ConversationContextManager()
        
        session = manager.get_or_create_session('user123')
        session['conversation_history'].append({
            'message': 'test',
            'sender': 'user'
        })
        manager._save_session('user123', session)
        
        # Retrieve session
        retrieved = manager.get_or_create_session('user123')
        
        assert len(retrieved['conversation_history']) == 1
        assert retrieved['conversation_history'][0]['message'] == 'test'


class TestConversationHistory:
    """Test conversation history tracking"""
    
    def test_add_user_message(self):
        """Verify adding user message"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Hello!', 'user')
        
        session = manager.get_or_create_session('user123')
        assert len(session['conversation_history']) == 1
        assert session['conversation_history'][0]['sender'] == 'user'
        assert session['conversation_history'][0]['message'] == 'Hello!'
    
    def test_add_assistant_message(self):
        """Verify adding assistant message"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'How can I help?', 'assistant')
        
        session = manager.get_or_create_session('user123')
        assert len(session['conversation_history']) == 1
        assert session['conversation_history'][0]['sender'] == 'assistant'
    
    def test_conversation_with_intent(self):
        """Verify conversation with intent tracking"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123', 
            'Show me condos in Toronto',
            'user',
            intent='search'
        )
        
        session = manager.get_or_create_session('user123')
        assert session['conversation_history'][0]['intent'] == 'search'
    
    def test_conversation_length_limit(self):
        """Verify conversation history stays within limit"""
        manager = ConversationContextManager()
        
        # Add 60 messages (limit is 50)
        for i in range(60):
            manager.add_to_conversation('user123', f'Message {i}', 'user')
        
        session = manager.get_or_create_session('user123')
        assert len(session['conversation_history']) == 50
        # Should keep most recent messages
        assert session['conversation_history'][-1]['message'] == 'Message 59'


class TestPreferenceExtraction:
    """Test preference extraction from conversations"""
    
    def test_extract_location_preferences(self):
        """Verify location extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Looking for properties in Toronto', 'user')
        manager.add_to_conversation('user123', 'Also interested in Mississauga', 'user')
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert 'Toronto' in preferences['locations']
        assert 'Mississauga' in preferences['locations']
    
    def test_extract_property_types(self):
        """Verify property type extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'I want to buy a condo', 'user')
        manager.add_to_conversation('user123', 'Or maybe a townhouse', 'user')
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert 'condo' in preferences['property_types']
        assert 'townhouse' in preferences['property_types']
    
    def test_extract_price_range(self):
        """Verify price range extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'Looking for properties between $500k and $800k',
            'user'
        )
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert len(preferences['price_ranges']) > 0
        price_range = preferences['price_ranges'][0]
        assert price_range['min'] == 500000
        assert price_range['max'] == 800000
    
    def test_extract_bedroom_preferences(self):
        """Verify bedroom extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'I need a 3 bedroom home', 'user')
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert 3 in preferences['bedrooms_ranges']
    
    def test_detect_investor_intent(self):
        """Verify investor detection"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'Looking for investment properties with good ROI',
            'user'
        )
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert preferences['investor'] is True
    
    def test_detect_first_time_buyer(self):
        """Verify first-time buyer detection"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'This is my first time buying a home',
            'user'
        )
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert preferences['first_time_buyer'] is True
    
    def test_extract_timeline(self):
        """Verify timeline extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Need to buy ASAP', 'user')
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert preferences['timeline'] == 'urgent'
    
    def test_extract_features(self):
        """Verify feature extraction"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'I want a property with a pool and garage',
            'user'
        )
        
        preferences = manager.extract_preferences_from_conversation('user123')
        
        assert 'pool' in preferences['features']
        assert 'garage' in preferences['features']


class TestSearchContext:
    """Test search context management"""
    
    def test_update_search_context(self):
        """Verify search context update"""
        manager = ConversationContextManager()
        
        results = [
            {'id': 'prop1', 'address': '123 Test St'},
            {'id': 'prop2', 'address': '456 Test Ave'}
        ]
        
        manager.update_search_context('user123', 'Toronto condos', results)
        
        session = manager.get_or_create_session('user123')
        
        assert len(session['search_history']) == 1
        assert session['search_history'][0]['query'] == 'Toronto condos'
        assert session['search_history'][0]['result_count'] == 2
        assert session['behavioral_signals']['search_count'] == 1
    
    def test_search_history_limit(self):
        """Verify search history stays within limit"""
        manager = ConversationContextManager()
        
        # Add 25 searches (limit is 20)
        for i in range(25):
            manager.update_search_context('user123', f'Query {i}', [])
        
        session = manager.get_or_create_session('user123')
        
        assert len(session['search_history']) == 20
        assert session['search_history'][-1]['query'] == 'Query 24'
    
    def test_update_property_view(self):
        """Verify property view tracking"""
        manager = ConversationContextManager()
        
        property_data = {'id': 'prop1', 'price': 500000}
        manager.update_property_view('user123', 'prop1', property_data)
        
        session = manager.get_or_create_session('user123')
        
        assert session['current_context']['currently_viewing_property']['id'] == 'prop1'
        assert session['behavioral_signals']['property_views_count'] == 1


class TestEngagementTracking:
    """Test engagement level calculation"""
    
    def test_initial_engagement_level(self):
        """Verify initial engagement level"""
        manager = ConversationContextManager()
        
        session = manager.get_or_create_session('user123')
        
        assert session['behavioral_signals']['engagement_level'] == 0
    
    def test_engagement_increases_with_activity(self):
        """Verify engagement increases with user activity"""
        manager = ConversationContextManager()
        
        # Add multiple interactions
        for i in range(5):
            manager.add_to_conversation('user123', f'Message {i}', 'user')
        
        # Add searches
        for i in range(3):
            manager.update_search_context('user123', f'Query {i}', [])
        
        # Add property views
        for i in range(4):
            manager.update_property_view('user123', f'prop{i}')
        
        session = manager.get_or_create_session('user123')
        
        # Engagement should have increased
        assert session['behavioral_signals']['engagement_level'] > 0
        assert session['behavioral_signals']['search_count'] == 3
        assert session['behavioral_signals']['property_views_count'] == 4


class TestPredictions:
    """Test next question predictions"""
    
    def test_predict_after_property_view(self):
        """Verify predictions after viewing property"""
        manager = ConversationContextManager()
        
        manager.update_property_view('user123', 'prop1')
        
        predictions = manager.predict_next_questions('user123')
        
        assert len(predictions) > 0
        # Should suggest neighborhood or similar properties
        assert any('neighborhood' in p.lower() or 'similar' in p.lower() for p in predictions)
    
    def test_predict_after_search(self):
        """Verify predictions after search"""
        manager = ConversationContextManager()
        
        manager.update_search_context('user123', 'Toronto condos', [])
        
        predictions = manager.predict_next_questions('user123')
        
        assert len(predictions) > 0
        # Should suggest refinement options
        assert any('more' in p.lower() or 'adjust' in p.lower() for p in predictions)
    
    def test_predict_for_highly_engaged(self):
        """Verify predictions for highly engaged users"""
        manager = ConversationContextManager()
        
        # Simulate high engagement
        for i in range(10):
            manager.add_to_conversation('user123', f'Message {i}', 'user')
            manager.update_property_view('user123', f'prop{i}')
        
        predictions = manager.predict_next_questions('user123')
        
        # Should suggest connecting with broker
        assert any('broker' in p.lower() or 'agent' in p.lower() for p in predictions)
    
    def test_predict_for_first_time_buyer(self):
        """Verify predictions for first-time buyers"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'This is my first time buying',
            'user'
        )
        manager.extract_preferences_from_conversation('user123')
        
        predictions = manager.predict_next_questions('user123')
        
        # Should suggest educational content
        assert any('process' in p.lower() or 'down payment' in p.lower() for p in predictions)


class TestConversationSummary:
    """Test conversation summary generation"""
    
    def test_generate_basic_summary(self):
        """Verify basic summary generation"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Looking in Toronto', 'user')
        manager.extract_preferences_from_conversation('user123')
        
        summary = manager.generate_conversation_summary('user123')
        
        assert 'Toronto' in summary
        assert len(summary) > 0
    
    def test_summary_includes_preferences(self):
        """Verify summary includes extracted preferences"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation(
            'user123',
            'Looking for 3 bedroom condos in Toronto under $800k',
            'user'
        )
        manager.extract_preferences_from_conversation('user123')
        
        summary = manager.generate_conversation_summary('user123')
        
        assert 'Toronto' in summary
        assert 'condo' in summary or '3' in summary
    
    def test_summary_reflects_engagement(self):
        """Verify summary reflects engagement level"""
        manager = ConversationContextManager()
        
        # High engagement
        for i in range(10):
            manager.add_to_conversation('user123', f'Message {i}', 'user')
            manager.update_property_view('user123', f'prop{i}')
        
        summary = manager.generate_conversation_summary('user123')
        
        # Should indicate high engagement
        assert 'engaged' in summary.lower() or 'ready' in summary.lower()


class TestComparison:
    """Test comparison list management"""
    
    def test_add_to_comparison(self):
        """Verify adding properties to comparison"""
        manager = ConversationContextManager()
        
        manager.add_to_comparison('user123', 'prop1')
        manager.add_to_comparison('user123', 'prop2')
        
        session = manager.get_or_create_session('user123')
        
        assert len(session['current_context']['comparison_list']) == 2
        assert 'prop1' in session['current_context']['comparison_list']
        assert 'prop2' in session['current_context']['comparison_list']
    
    def test_comparison_list_limit(self):
        """Verify comparison list respects limit"""
        manager = ConversationContextManager()
        
        # Add 7 properties (limit is 5)
        for i in range(7):
            manager.add_to_comparison('user123', f'prop{i}')
        
        session = manager.get_or_create_session('user123')
        
        assert len(session['current_context']['comparison_list']) == 5
        # Should keep most recent
        assert 'prop6' in session['current_context']['comparison_list']
    
    def test_no_duplicate_comparisons(self):
        """Verify no duplicate properties in comparison"""
        manager = ConversationContextManager()
        
        manager.add_to_comparison('user123', 'prop1')
        manager.add_to_comparison('user123', 'prop1')  # Duplicate
        
        session = manager.get_or_create_session('user123')
        
        assert len(session['current_context']['comparison_list']) == 1


class TestContextForAI:
    """Test AI context generation"""
    
    def test_get_context_for_ai(self):
        """Verify AI context structure"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Show me condos', 'user')
        manager.add_to_conversation('user123', 'Here are some options', 'assistant')
        
        context = manager.get_context_for_ai('user123')
        
        assert 'summary' in context
        assert 'preferences' in context
        assert 'recent_conversation' in context
        assert 'engagement_level' in context
        assert 'predicted_questions' in context
    
    def test_context_includes_recent_conversation(self):
        """Verify context includes recent messages"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Hello', 'user')
        manager.add_to_conversation('user123', 'Hi there', 'assistant')
        
        context = manager.get_context_for_ai('user123')
        
        assert 'User: Hello' in context['recent_conversation']
        assert 'Assistant: Hi there' in context['recent_conversation']


class TestSessionStats:
    """Test session statistics"""
    
    def test_get_session_stats(self):
        """Verify session statistics"""
        manager = ConversationContextManager()
        
        manager.add_to_conversation('user123', 'Test message', 'user')
        manager.update_search_context('user123', 'Test query', [])
        manager.update_property_view('user123', 'prop1')
        
        stats = manager.get_session_stats('user123')
        
        assert stats['user_id'] == 'user123'
        assert stats['conversation_length'] == 1
        assert stats['search_count'] == 1
        assert stats['property_views'] == 1
        assert 'engagement_level' in stats


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
