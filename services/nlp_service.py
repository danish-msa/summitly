"""
NLP Service - Natural Language Processing for Property Search
Converts conversational queries into structured API requests
"""
import logging
from typing import Dict, Any, Optional, List

from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class NLPService:
    """
    Service for natural language processing of property search queries
    Enables context-aware conversations with follow-up queries
    """
    
    def __init__(self, api_client=None):
        """
        Initialize NLP service
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
        self.conversation_contexts = {}  # Store nlpId for ongoing conversations
    
    def process_query(
        self,
        prompt: str,
        user_id: Optional[str] = None,
        nlp_id: Optional[str] = None,
        execute_search: bool = True
    ) -> Dict[str, Any]:
        """
        Process natural language query and optionally execute the search
        
        Args:
            prompt: User's natural language query
            user_id: Optional user identifier for conversation tracking
            nlp_id: Optional NLP ID for continuing previous conversation
            execute_search: Whether to automatically execute the generated search
            
        Returns:
            Dictionary containing:
                - nlp_id: ID for conversation continuity
                - query: Structured query parameters extracted
                - summary: Human-readable summary of search criteria
                - results: Search results (if execute_search=True)
        
        Examples:
            >>> nlp = NLPService()
            >>> result = nlp.process_query("Find me a 3 bedroom house in Toronto under 800k")
            >>> print(result['summary'])
            "Searching for 3 bedroom houses in Toronto with max price $800,000"
        """
        # Get nlpId from conversation context if user_id provided
        if user_id and not nlp_id:
            nlp_id = self.conversation_contexts.get(user_id)
        
        request_data = {
            'prompt': prompt
        }
        
        if nlp_id:
            request_data['nlpId'] = nlp_id
        
        try:
            logger.info(f"Processing NLP query: {prompt[:50]}...")
            
            # Call NLP endpoint
            response = self.client.post(
                config.get_endpoint('nlp'),
                json_data=request_data
            )
            
            # Handle response - could be dict or list depending on API
            if isinstance(response, list):
                # API returned search results directly
                logger.info(f"NLP API returned {len(response)} results directly")
                result = {
                    'success': True,
                    'nlpId': None,
                    'structured_params': {},
                    'summary': f"Found {len(response)} properties matching your search",
                    'search_results': {
                        'results': response,
                        'total': len(response)
                    }
                }
                return result
            
            # Store nlpId for conversation continuity
            new_nlp_id = response.get('nlpId')
            if user_id and new_nlp_id:
                self.conversation_contexts[user_id] = new_nlp_id
            
            result = {
                'success': True,
                'nlpId': new_nlp_id,
                'structured_params': response.get('query', {}),
                'summary': response.get('summary', ''),
                'extracted_params': response.get('extractedParams', {}),
                'prompt': prompt
            }
            
            # Execute search if requested
            if execute_search and result['structured_params']:
                logger.info("Executing search with NLP-generated parameters")
                
                # Import here to avoid circular dependency
                from listings_service import listings_service
                
                try:
                    search_results = listings_service.search_listings(**result['structured_params'])
                    result['search_results'] = search_results
                    result['results_count'] = search_results.get('total', 0)
                except Exception as e:
                    logger.error(f"Error executing NLP search: {str(e)}")
                    result['search_error'] = str(e)
            
            return result
        
        except RepliersAPIError as e:
            logger.error(f"NLP processing error: {e.message}")
            
            # Check if prompt is irrelevant
            if e.status_code == 422:
                return {
                    'error': 'irrelevant_prompt',
                    'message': "I couldn't understand that as a property search query. Could you rephrase it?",
                    'original_prompt': prompt
                }
            raise
    
    def continue_conversation(
        self,
        prompt: str,
        user_id: str,
        execute_search: bool = True
    ) -> Dict[str, Any]:
        """
        Continue an existing conversation with context
        
        Args:
            prompt: Follow-up query
            user_id: User identifier
            execute_search: Whether to execute the search
            
        Returns:
            Processing result with context
        
        Examples:
            >>> result1 = nlp.process_query("Show me condos in Vancouver", user_id="user123")
            >>> result2 = nlp.continue_conversation("Under 500k", user_id="user123")
            # Automatically includes context from previous query
        """
        nlp_id = self.conversation_contexts.get(user_id)
        
        if not nlp_id:
            logger.warning(f"No conversation context found for user {user_id}")
            # Process as new query
            return self.process_query(prompt, user_id=user_id, execute_search=execute_search)
        
        return self.process_query(
            prompt,
            user_id=user_id,
            nlp_id=nlp_id,
            execute_search=execute_search
        )
    
    def clear_conversation(self, user_id: str):
        """
        Clear conversation context for a user
        
        Args:
            user_id: User identifier
        """
        if user_id in self.conversation_contexts:
            del self.conversation_contexts[user_id]
            logger.info(f"Cleared conversation context for user {user_id}")
    
    def get_conversation_context(self, user_id: str) -> Optional[str]:
        """
        Get current conversation context ID for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            nlpId if exists, None otherwise
        """
        return self.conversation_contexts.get(user_id)
    
    def parse_query_to_filters(self, query_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert NLP query response to standardized filter format
        
        Args:
            query_dict: Query dictionary from NLP response
            
        Returns:
            Standardized filter dictionary for listings_service
        """
        # This method helps normalize the NLP response into clean filter parameters
        filters = {}
        
        # Map common NLP response fields to filter parameters
        field_mapping = {
            'city': 'city',
            'neighborhood': 'neighborhood',
            'minPrice': 'min_price',
            'maxPrice': 'max_price',
            'propertyType': 'property_type',
            'propertyStyle': 'property_style',
            'minBedrooms': 'min_bedrooms',
            'maxBedrooms': 'max_bedrooms',
            'minBathrooms': 'min_bathrooms',
            'maxBathrooms': 'max_bathrooms',
            'minSqft': 'min_sqft',
            'maxSqft': 'max_sqft',
            'hasPool': 'has_pool',
            'hasGarage': 'has_garage',
            'parkingSpots': 'parking_spots',
        }
        
        for nlp_field, filter_field in field_mapping.items():
            if nlp_field in query_dict:
                filters[filter_field] = query_dict[nlp_field]
        
        return filters


# Create default service instance
nlp_service = NLPService()


if __name__ == '__main__':
    # Test NLP service
    print("🧠 Testing NLP Service...\n")
    
    service = NLPService()
    
    # Test 1: Simple query
    print("1️⃣  Processing: 'Find me a 3 bedroom house in Toronto under 800k'")
    try:
        result = service.process_query(
            "Find me a 3 bedroom house in Toronto under 800k",
            user_id="test_user",
            execute_search=False  # Don't execute to avoid API quota
        )
        print(f"   ✅ Summary: {result.get('summary', 'N/A')}")
        print(f"   📝 Query params: {result.get('query', {})}")
        print(f"   🆔 NLP ID: {result.get('nlp_id', 'N/A')}\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 2: Follow-up query
    print("2️⃣  Follow-up: 'Actually make it 2 bedrooms'")
    try:
        result = service.continue_conversation(
            "Actually make it 2 bedrooms",
            user_id="test_user",
            execute_search=False
        )
        print(f"   ✅ Summary: {result.get('summary', 'N/A')}")
        print(f"   📝 Query params: {result.get('query', {})}\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 3: Irrelevant query
    print("3️⃣  Testing irrelevant query: 'What's the weather today?'")
    try:
        result = service.process_query(
            "What's the weather today?",
            execute_search=False
        )
        if result.get('error') == 'irrelevant_prompt':
            print(f"   ✅ Correctly identified as irrelevant")
            print(f"   💬 Response: {result.get('message')}\n")
        else:
            print(f"   ⚠️  Unexpected result: {result}\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Clear conversation
    service.clear_conversation("test_user")
    print("✨ Conversation cleared")
