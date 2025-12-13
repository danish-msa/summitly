"""
ChatGPT-Style Real Estate Chatbot Orchestrator
==============================================
Main orchestration layer that coordinates all services.

Pipeline:
1. Parse user message (NLP)
2. Update conversation state
3. Execute MLS query (if needed)
4. Generate GPT-4 response
5. Provide follow-up suggestions

This replaces rigid if-else chains with intelligent, context-aware processing.

Author: Summitly Team
Date: December 12, 2025
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

# Import our new services
from services.conversation_state import ConversationState, conversation_state_manager
from services.nlp_parser import nlp_parser
from services.chatgpt_service import chatgpt_service
from services.enhanced_mls_service import enhanced_mls_service

logger = logging.getLogger(__name__)


class ChatGPTChatbot:
    """
    Main chatbot orchestrator - behaves like ChatGPT for real estate.
    
    Features:
    - Maintains full conversation context
    - Understands follow-up questions
    - Natural language processing
    - Intelligent property search
    - GPT-4 powered responses
    - Follow-up suggestions
    """
    
    def __init__(self):
        """Initialize the chatbot."""
        self.state_manager = conversation_state_manager
        self.nlp = nlp_parser
        self.gpt = chatgpt_service
        self.mls = enhanced_mls_service
        
        logger.info("✅ ChatGPTChatbot initialized")
    
    def process_message(
        self,
        user_message: str,
        session_id: str,
        user_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process a user message through the complete pipeline.
        
        Pipeline:
        1. Load/create conversation state
        2. Parse message with NLP
        3. Update state with extracted criteria
        4. Execute property search (if needed)
        5. Generate GPT-4 response
        6. Generate follow-up suggestions
        7. Save state
        
        Args:
            user_message: The user's message
            session_id: Unique session identifier
            user_context: Optional additional context
            
        Returns:
            Dictionary with:
                - response: Main response text
                - suggestions: List of follow-up questions
                - properties: Property results (if any)
                - property_count: Number of properties
                - state_summary: Current search criteria summary
        """
        logger.info(f"📨 Processing message for session {session_id}: '{user_message[:50]}...'")
        
        try:
            # STEP 1: Get conversation state
            state = self.state_manager.get_or_create(session_id)
            logger.debug(f"Current state: {state.get_summary()}")
            
            # Add user message to history
            state.add_conversation_turn("user", user_message)
            
            # STEP 2: Parse message with NLP
            parsed = self.nlp.parse_message(
                user_message,
                current_state=state.to_dict()
            )
            logger.info(f"✅ NLP parsed: {len(parsed)} criteria extracted")
            logger.debug(f"Parsed data: {parsed}")
            
            # STEP 3: Handle different intents
            intent = parsed.get('intent', 'search')
            logger.info(f"🎯 Intent: {intent}")
            
            if intent == 'reset':
                return self._handle_reset(state, user_message)
            elif intent == 'details':
                return self._handle_details_request(state, user_message, parsed)
            elif intent == 'compare':
                return self._handle_compare_request(state, user_message)
            elif intent == 'general_question':
                return self._handle_general_question(state, user_message)
            else:  # search or refine
                return self._handle_search(state, user_message, parsed)
        
        except Exception as e:
            logger.error(f"❌ Error processing message: {e}", exc_info=True)
            return self._handle_error(session_id, user_message, str(e))
    
    def _handle_search(
        self,
        state: ConversationState,
        user_message: str,
        parsed: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle search or refine intent.
        
        Args:
            state: Conversation state
            user_message: User's message
            parsed: Parsed NLP data
            
        Returns:
            Response dictionary
        """
        # Update state with parsed criteria
        updates = {k: v for k, v in parsed.items() if k != 'intent'}
        if updates:
            state.update_from_dict(updates)
            logger.info(f"✅ State updated: {state.get_summary()}")
        
        # Check if we have enough criteria to search
        has_search_criteria = any([
            state.location,
            state.bedrooms,
            state.property_type,
            state.price_range
        ])
        
        if not has_search_criteria:
            # Ask for more information
            return self._ask_for_criteria(state, user_message)
        
        # Execute MLS search
        logger.info("🔍 Executing property search...")
        search_results = self.mls.search_properties(state, limit=20)
        
        if not search_results.get('success'):
            return self._handle_search_error(state, user_message, search_results)
        
        properties = search_results.get('results', [])
        total = search_results.get('total', 0)
        
        logger.info(f"✅ Found {total} properties")
        
        # Update state with results
        state.update_search_results(properties, user_message)
        
        # Handle no results
        if total == 0:
            return self._handle_no_results(state, user_message)
        
        # Generate GPT-4 response
        logger.info("🤖 Generating GPT-4 response...")
        response_text = self.gpt.generate_response(
            user_message=user_message,
            conversation_state=state.to_dict(),
            search_results=properties
        )
        
        # Add property summary if we have results
        if len(properties) > 0:
            summary = self._build_property_summary(properties, total)
            response_text = f"{response_text}\n\n{summary}"
        
        # Generate follow-up suggestions
        suggestions = self.gpt.generate_follow_up_suggestions(
            conversation_state=state.to_dict(),
            search_results=properties
        )
        
        # Add assistant response to history
        state.add_conversation_turn("assistant", response_text)
        
        # Save state
        self.state_manager.save(state)
        
        # Build response
        return {
            'success': True,
            'response': response_text,
            'suggestions': suggestions,
            'properties': properties[:10],  # Return top 10
            'property_count': total,
            'state_summary': state.get_summary(),
            'filters': state.get_active_filters()
        }
    
    def _handle_reset(
        self,
        state: ConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Handle reset intent."""
        state.reset()
        
        response = "Got it! I've cleared your search criteria. Let's start fresh. What kind of property are you looking for?"
        
        suggestions = [
            "Show me condos in Toronto",
            "Find houses in Mississauga",
            "I'm looking for rentals"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'state_summary': state.get_summary()
        }
    
    def _handle_details_request(
        self,
        state: ConversationState,
        user_message: str,
        parsed: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle request for property details."""
        # Try to extract property reference from message
        # Could be "tell me more about the first one", "details on property 3", etc.
        
        last_results = state.last_property_results
        
        if not last_results:
            response = "I don't have any properties to show you yet. Let me help you search for some!"
            suggestions = [
                "Find condos in Toronto",
                "Show me houses under 800k",
                "I'm looking for 2 bedroom properties"
            ]
        else:
            # For now, show details about the first property
            # In production, we'd extract which property they're asking about
            prop = last_results[0]
            
            response = self._format_property_details(prop)
            suggestions = [
                "Tell me about the second property",
                "Show me similar properties",
                "Compare this with others"
            ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': last_results[:5] if last_results else [],
            'property_count': len(last_results) if last_results else 0,
            'state_summary': state.get_summary()
        }
    
    def _handle_compare_request(
        self,
        state: ConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Handle property comparison request."""
        last_results = state.last_property_results
        
        if not last_results or len(last_results) < 2:
            response = "I need at least 2 properties to compare. Let me help you search first!"
            suggestions = [
                "Find properties in Toronto",
                "Show me condos under 700k",
                "Search for 2 bedroom houses"
            ]
        else:
            # Compare first 2 properties
            response = self._build_comparison(last_results[:2])
            suggestions = [
                "Tell me more about the first one",
                "Show me similar properties",
                "Adjust my search criteria"
            ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': last_results[:5] if last_results else [],
            'property_count': len(last_results) if last_results else 0,
            'state_summary': state.get_summary()
        }
    
    def _handle_general_question(
        self,
        state: ConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Handle general real estate questions."""
        # Use GPT-4 to answer general questions
        response = self.gpt.generate_response(
            user_message=user_message,
            conversation_state=state.to_dict()
        )
        
        suggestions = [
            "Start a property search",
            "Tell me about Toronto neighborhoods",
            "What should I look for in a property?"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'state_summary': state.get_summary()
        }
    
    def _ask_for_criteria(
        self,
        state: ConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Ask user for more search criteria."""
        response = "I'd love to help you find the perfect property! To get started, could you tell me:\n\n"
        
        missing = []
        if not state.location:
            missing.append("• Which area are you interested in? (e.g., Toronto, Mississauga)")
        if not state.bedrooms:
            missing.append("• How many bedrooms do you need?")
        if not state.property_type:
            missing.append("• What type of property? (condo, house, townhouse)")
        
        response += "\n".join(missing[:2])  # Ask for max 2 things at once
        
        suggestions = [
            "2 bedroom condo in Toronto",
            "Houses in Mississauga under 900k",
            "Rentals in downtown Toronto"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'state_summary': state.get_summary()
        }
    
    def _handle_no_results(
        self,
        state: ConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Handle case when no properties found."""
        response = f"I couldn't find any properties matching: {state.get_summary()}\n\n"
        response += "Let's try adjusting your search:\n"
        response += "• Increase your budget\n"
        response += "• Expand to nearby areas\n"
        response += "• Adjust bedroom requirements"
        
        suggestions = [
            "Increase my budget",
            "Show nearby neighborhoods",
            "Adjust bedroom count"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': True,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'state_summary': state.get_summary()
        }
    
    def _handle_search_error(
        self,
        state: ConversationState,
        user_message: str,
        search_results: Dict
    ) -> Dict[str, Any]:
        """Handle MLS search errors."""
        error = search_results.get('error', 'Unknown error')
        logger.error(f"Search error: {error}")
        
        response = "I encountered an issue while searching for properties. Let me try to help you anyway!\n\n"
        response += "Could you rephrase your search criteria?"
        
        suggestions = [
            "Find 2 bedroom condos in Toronto",
            "Show me houses under 800k",
            "I'm looking for rentals"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            'success': False,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'state_summary': state.get_summary(),
            'error': error
        }
    
    def _handle_error(
        self,
        session_id: str,
        user_message: str,
        error: str
    ) -> Dict[str, Any]:
        """Handle general errors."""
        response = "I'm sorry, I encountered an unexpected issue. Let's try again!"
        
        suggestions = [
            "Start a new search",
            "Show me properties in Toronto",
            "Help me find a property"
        ]
        
        return {
            'success': False,
            'response': response,
            'suggestions': suggestions,
            'properties': [],
            'property_count': 0,
            'error': error
        }
    
    def _build_property_summary(
        self,
        properties: List[Dict],
        total: int
    ) -> str:
        """Build a concise summary of properties found."""
        summary = f"**Found {total} {'property' if total == 1 else 'properties'}**\n\n"
        
        # Show top 3
        for i, prop in enumerate(properties[:3], 1):
            address = prop.get('address', 'Address N/A')
            beds = prop.get('bedrooms', 'N/A')
            baths = prop.get('bathrooms', 'N/A')
            price = prop.get('price', 0)
            
            summary += f"**{i}.** {address}\n"
            summary += f"   {beds} bed | {baths} bath | ${price:,}\n\n"
        
        if total > 3:
            summary += f"...and {total - 3} more\n"
        
        return summary
    
    def _format_property_details(self, property_data: Dict) -> str:
        """Format detailed property information."""
        details = f"**Property Details**\n\n"
        
        if property_data.get('address'):
            details += f"📍 **Address:** {property_data['address']}\n"
        if property_data.get('price'):
            details += f"💰 **Price:** ${property_data['price']:,}\n"
        if property_data.get('bedrooms'):
            details += f"🛏️ **Bedrooms:** {property_data['bedrooms']}\n"
        if property_data.get('bathrooms'):
            details += f"🚿 **Bathrooms:** {property_data['bathrooms']}\n"
        if property_data.get('sqft'):
            details += f"📏 **Square Feet:** {property_data['sqft']:,}\n"
        if property_data.get('property_type'):
            details += f"🏠 **Type:** {property_data['property_type']}\n"
        
        return details
    
    def _build_comparison(self, properties: List[Dict]) -> str:
        """Build a comparison between properties."""
        comparison = "**Property Comparison**\n\n"
        
        for i, prop in enumerate(properties, 1):
            comparison += f"**Property {i}:**\n"
            comparison += f"• {prop.get('address', 'N/A')}\n"
            comparison += f"• ${prop.get('price', 0):,}\n"
            comparison += f"• {prop.get('bedrooms', 'N/A')} bed, {prop.get('bathrooms', 'N/A')} bath\n"
            comparison += f"• {prop.get('sqft', 'N/A')} sqft\n\n"
        
        return comparison


# Global chatbot instance
chatbot = ChatGPTChatbot()


def process_user_message(
    message: str,
    session_id: str,
    context: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Convenience function to process a user message.
    
    Args:
        message: User's message
        session_id: Session identifier
        context: Optional context
        
    Returns:
        Response dictionary
    """
    return chatbot.process_message(message, session_id, context)


if __name__ == "__main__":
    # Test the chatbot
    print("🧪 Testing ChatGPTChatbot...\n")
    
    session_id = "test_session_123"
    
    # Test conversation
    test_messages = [
        "Show me 2 bedroom condos in Toronto under 600k",
        "What about 3 bedrooms?",
        "Show me rentals instead",
        "With pool and gym",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{'='*60}")
        print(f"Message {i}: {message}")
        print(f"{'='*60}")
        
        result = chatbot.process_message(message, session_id)
        
        print(f"\n✅ Response:")
        print(result.get('response', 'No response'))
        
        print(f"\n💡 Suggestions:")
        for j, suggestion in enumerate(result.get('suggestions', []), 1):
            print(f"   {j}. {suggestion}")
        
        print(f"\n📊 State: {result.get('state_summary', 'N/A')}")
        print(f"🏠 Properties: {result.get('property_count', 0)}")
    
    print("\n✅ All tests completed!")
