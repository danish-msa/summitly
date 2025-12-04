"""
Saved Searches Service - Manage Saved Searches and Alerts
Create, update, and manage saved property searches with alert preferences
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from services.repliers_client import client, RepliersAPIError, ValidationError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class SavedSearchService:
    """Service for managing saved searches and alert configurations"""
    
    def __init__(self, api_client=None):
        """
        Initialize saved search service
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
    
    def create_saved_search(
        self,
        # Client information
        client_email: str,
        client_name: Optional[str] = None,
        client_phone: Optional[str] = None,
        
        # Search criteria (same as listings search)
        search_name: Optional[str] = None,
        city: Optional[str] = None,
        neighborhood: Optional[str] = None,
        postal_code: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        property_type: Optional[str] = None,
        property_style: Optional[str] = None,
        min_bedrooms: Optional[int] = None,
        max_bedrooms: Optional[int] = None,
        min_bathrooms: Optional[float] = None,
        max_bathrooms: Optional[float] = None,
        keywords: Optional[List[str]] = None,
        
        # Alert preferences
        alert_frequency: str = 'instant',  # instant, daily, weekly, monthly
        alert_email: bool = True,
        alert_sms: bool = False,
        alert_on_new: bool = True,
        alert_on_price_change: bool = True,
        alert_on_status_change: bool = False,
        
        # Additional settings
        active: bool = True,
        auto_reply: bool = False,
        
    ) -> Dict[str, Any]:
        """
        Create a new saved search with alert preferences
        
        Args:
            client_email: Client's email address (required)
            client_name: Client's full name
            client_phone: Client's phone number (required for SMS alerts)
            search_name: Descriptive name for the search
            city, neighborhood, postal_code: Location filters
            min_price, max_price: Price range
            property_type, property_style: Property filters
            min_bedrooms, max_bedrooms: Bedroom filters
            min_bathrooms, max_bathrooms: Bathroom filters
            keywords: List of keywords
            alert_frequency: How often to send alerts (instant, daily, weekly, monthly)
            alert_email: Send email alerts
            alert_sms: Send SMS alerts
            alert_on_new: Alert when new listings match
            alert_on_price_change: Alert when matching listing prices change
            alert_on_status_change: Alert when listing status changes
            active: Whether the search is active
            auto_reply: Enable 2-way SMS communication
            
        Returns:
            Dictionary containing created saved search details
            
        Raises:
            ValidationError: If required fields are missing or invalid
        """
        # Validate required fields
        if not client_email:
            raise ValidationError("client_email is required")
        
        if alert_sms and not client_phone:
            raise ValidationError("client_phone is required for SMS alerts")
        
        if alert_frequency not in config.ALERT_FREQUENCIES:
            raise ValidationError(
                f"alert_frequency must be one of: {', '.join(config.ALERT_FREQUENCIES)}"
            )
        
        # Build request payload
        payload = {
            'client': {
                'email': client_email
            },
            'criteria': {},
            'alerts': {
                'frequency': alert_frequency,
                'email': alert_email,
                'sms': alert_sms,
                'events': []
            },
            'active': active
        }
        
        # Add optional client info
        if client_name:
            payload['client']['name'] = client_name
        if client_phone:
            payload['client']['phone'] = client_phone
        
        # Add search name
        if search_name:
            payload['name'] = search_name
        
        # Build search criteria
        criteria = {}
        if city:
            criteria['city'] = city
        if neighborhood:
            criteria['neighborhood'] = neighborhood
        if postal_code:
            criteria['postalCode'] = postal_code
        if min_price is not None:
            criteria['minPrice'] = min_price
        if max_price is not None:
            criteria['maxPrice'] = max_price
        if property_type:
            criteria['propertyType'] = property_type
        if property_style:
            criteria['propertyStyle'] = property_style
        if min_bedrooms is not None:
            criteria['minBedrooms'] = min_bedrooms
        if max_bedrooms is not None:
            criteria['maxBedrooms'] = max_bedrooms
        if min_bathrooms is not None:
            criteria['minBathrooms'] = min_bathrooms
        if max_bathrooms is not None:
            criteria['maxBathrooms'] = max_bathrooms
        if keywords:
            criteria['keywords'] = keywords
        
        payload['criteria'] = criteria
        
        # Configure alert events
        events = []
        if alert_on_new:
            events.append('listing.created')
        if alert_on_price_change:
            events.append('listing.price_changed')
        if alert_on_status_change:
            events.append('listing.status_changed')
        
        payload['alerts']['events'] = events
        
        # Add auto-reply for SMS
        if auto_reply and alert_sms:
            payload['alerts']['autoReply'] = True
        
        try:
            logger.info(f"Creating saved search for {client_email}")
            response = self.client.post(
                config.get_endpoint('saved_searches'),
                json_data=payload
            )
            
            logger.info(f"Saved search created with ID: {response.get('id')}")
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error creating saved search: {e.message}")
            raise
    
    def get_saved_searches(
        self,
        client_email: Optional[str] = None,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Retrieve saved searches, optionally filtered by client
        
        Args:
            client_email: Filter by client email
            active_only: Only return active searches
            
        Returns:
            List of saved searches
        """
        params = {}
        if client_email:
            params['clientEmail'] = client_email
        if active_only:
            params['active'] = 'true'
        
        try:
            logger.info(f"Fetching saved searches (filters: {params})")
            response = self.client.get(
                config.get_endpoint('saved_searches'),
                params=params
            )
            
            return response.get('searches', [])
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching saved searches: {e.message}")
            raise
    
    def get_saved_search(self, search_id: str) -> Dict[str, Any]:
        """
        Get details of a specific saved search
        
        Args:
            search_id: Saved search ID
            
        Returns:
            Saved search details
        """
        try:
            logger.info(f"Fetching saved search: {search_id}")
            response = self.client.get(
                config.get_endpoint('saved_search_detail', id=search_id)
            )
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching saved search: {e.message}")
            raise
    
    def update_saved_search(
        self,
        search_id: str,
        # Updatable fields
        search_name: Optional[str] = None,
        criteria: Optional[Dict[str, Any]] = None,
        alert_frequency: Optional[str] = None,
        alert_email: Optional[bool] = None,
        alert_sms: Optional[bool] = None,
        alert_events: Optional[List[str]] = None,
        active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Update an existing saved search
        
        Args:
            search_id: Saved search ID
            search_name: New name for the search
            criteria: Updated search criteria
            alert_frequency: New alert frequency
            alert_email: Enable/disable email alerts
            alert_sms: Enable/disable SMS alerts
            alert_events: Updated list of alert events
            active: Activate/deactivate search
            
        Returns:
            Updated saved search details
        """
        # Build update payload with only provided fields
        payload = {}
        
        if search_name is not None:
            payload['name'] = search_name
        if criteria is not None:
            payload['criteria'] = criteria
        if active is not None:
            payload['active'] = active
        
        # Update alerts section
        if any([alert_frequency, alert_email is not None, alert_sms is not None, alert_events]):
            payload['alerts'] = {}
            if alert_frequency:
                payload['alerts']['frequency'] = alert_frequency
            if alert_email is not None:
                payload['alerts']['email'] = alert_email
            if alert_sms is not None:
                payload['alerts']['sms'] = alert_sms
            if alert_events:
                payload['alerts']['events'] = alert_events
        
        try:
            logger.info(f"Updating saved search: {search_id}")
            response = self.client.put(
                config.get_endpoint('saved_search_detail', id=search_id),
                json_data=payload
            )
            
            logger.info(f"Saved search {search_id} updated successfully")
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error updating saved search: {e.message}")
            raise
    
    def delete_saved_search(self, search_id: str) -> bool:
        """
        Delete a saved search
        
        Args:
            search_id: Saved search ID
            
        Returns:
            True if successful
        """
        try:
            logger.info(f"Deleting saved search: {search_id}")
            self.client.delete(
                config.get_endpoint('saved_search_detail', id=search_id)
            )
            
            logger.info(f"Saved search {search_id} deleted successfully")
            return True
        
        except RepliersAPIError as e:
            logger.error(f"Error deleting saved search: {e.message}")
            raise
    
    def pause_saved_search(self, search_id: str) -> Dict[str, Any]:
        """
        Pause (deactivate) a saved search
        
        Args:
            search_id: Saved search ID
            
        Returns:
            Updated saved search details
        """
        return self.update_saved_search(search_id, active=False)
    
    def resume_saved_search(self, search_id: str) -> Dict[str, Any]:
        """
        Resume (activate) a saved search
        
        Args:
            search_id: Saved search ID
            
        Returns:
            Updated saved search details
        """
        return self.update_saved_search(search_id, active=True)
    
    def get_client_searches(self, client_email: str) -> List[Dict[str, Any]]:
        """
        Get all saved searches for a specific client
        
        Args:
            client_email: Client's email address
            
        Returns:
            List of saved searches
        """
        return self.get_saved_searches(client_email=client_email)


# Create default service instance
saved_search_service = SavedSearchService()


if __name__ == '__main__':
    # Test saved search service
    print("💾 Testing Saved Search Service...\n")
    
    service = SavedSearchService()
    
    # Test 1: Create saved search
    print("1️⃣  Creating saved search...")
    try:
        result = service.create_saved_search(
            client_email="test@example.com",
            client_name="Test User",
            search_name="Toronto Condos Under 600k",
            city="Toronto",
            property_style="condo",
            max_price=600000,
            min_bedrooms=2,
            alert_frequency="daily",
            alert_email=True,
            alert_on_new=True,
            alert_on_price_change=True
        )
        search_id = result.get('id')
        print(f"   ✅ Saved search created with ID: {search_id}\n")
        
        # Test 2: Get saved searches
        print("2️⃣  Fetching saved searches for client...")
        searches = service.get_client_searches("test@example.com")
        print(f"   ✅ Found {len(searches)} saved searches\n")
        
        # Test 3: Update saved search
        if search_id:
            print("3️⃣  Updating saved search frequency...")
            service.update_saved_search(
                search_id,
                alert_frequency="instant"
            )
            print(f"   ✅ Saved search updated\n")
            
            # Test 4: Pause search
            print("4️⃣  Pausing saved search...")
            service.pause_saved_search(search_id)
            print(f"   ✅ Saved search paused\n")
            
            # Test 5: Delete search
            print("5️⃣  Deleting saved search...")
            service.delete_saved_search(search_id)
            print(f"   ✅ Saved search deleted\n")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
