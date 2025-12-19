"""
Webhook Handler - Real-time Event Subscriptions
Subscribe to and process webhooks for listing and client events
"""
import logging
import hmac
import hashlib
from typing import Dict, Any, Optional, List, Callable
from flask import Flask, request, jsonify

from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class WebhookHandler:
    """
    Service for managing webhook subscriptions and processing events
    """
    
    # Available webhook events
    AVAILABLE_EVENTS = [
        'listing.created',
        'listing.updated',
        'listing.deleted',
        'listing.price_changed',
        'listing.status_changed',
        'agent.created',
        'agent.updated',
        'agent.deleted',
        'client.created',
        'client.updated',
        'client.deleted',
        'search.created',
        'search.match.created',
        'message.created',
        'message.updated',
    ]
    
    def __init__(self, api_client=None):
        """
        Initialize webhook handler
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
        self.event_handlers = {}  # Store callback functions for events
    
    def create_webhook(
        self,
        events: List[str],
        target_url: Optional[str] = None,
        description: Optional[str] = None,
        active: bool = True
    ) -> Dict[str, Any]:
        """
        Create a new webhook subscription
        
        Args:
            events: List of events to subscribe to
            target_url: URL to receive webhook payloads (uses config default if not provided)
            description: Optional description of webhook purpose
            active: Whether webhook is active
            
        Returns:
            Dictionary containing webhook details including secret
            
        Note:
            Store the returned 'secret' securely for webhook verification
        """
        # Validate events
        invalid_events = [e for e in events if e not in self.AVAILABLE_EVENTS]
        if invalid_events:
            raise ValueError(f"Invalid events: {', '.join(invalid_events)}")
        
        target_url = target_url or config.WEBHOOK_TARGET_URL
        
        payload = {
            'events': events,
            'targetUrl': target_url,
            'active': active
        }
        
        if description:
            payload['description'] = description
        
        try:
            logger.info(f"Creating webhook for {len(events)} events")
            response = self.client.post(
                config.get_endpoint('webhooks'),
                json_data=payload
            )
            
            webhook_id = response.get('id')
            webhook_secret = response.get('secret')
            
            logger.info(f"Webhook created with ID: {webhook_id}")
            logger.warning("Store the webhook secret securely!")
            
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error creating webhook: {e.message}")
            raise
    
    def get_webhooks(self) -> List[Dict[str, Any]]:
        """
        Get all webhook subscriptions
        
        Returns:
            List of webhooks
        """
        try:
            logger.info("Fetching webhooks")
            response = self.client.get(config.get_endpoint('webhooks'))
            return response.get('webhooks', [])
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching webhooks: {e.message}")
            raise
    
    def get_webhook(self, webhook_id: str) -> Dict[str, Any]:
        """
        Get details of a specific webhook
        
        Args:
            webhook_id: Webhook ID
            
        Returns:
            Webhook details
        """
        try:
            logger.info(f"Fetching webhook: {webhook_id}")
            response = self.client.get(
                config.get_endpoint('webhook_detail', id=webhook_id)
            )
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error fetching webhook: {e.message}")
            raise
    
    def update_webhook(
        self,
        webhook_id: str,
        events: Optional[List[str]] = None,
        target_url: Optional[str] = None,
        active: Optional[bool] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an existing webhook
        
        Args:
            webhook_id: Webhook ID
            events: New list of events
            target_url: New target URL
            active: Activate/deactivate webhook
            description: Updated description
            
        Returns:
            Updated webhook details
        """
        payload = {}
        
        if events is not None:
            # Validate events
            invalid_events = [e for e in events if e not in self.AVAILABLE_EVENTS]
            if invalid_events:
                raise ValueError(f"Invalid events: {', '.join(invalid_events)}")
            payload['events'] = events
        
        if target_url is not None:
            payload['targetUrl'] = target_url
        if active is not None:
            payload['active'] = active
        if description is not None:
            payload['description'] = description
        
        try:
            logger.info(f"Updating webhook: {webhook_id}")
            response = self.client.put(
                config.get_endpoint('webhook_detail', id=webhook_id),
                json_data=payload
            )
            
            logger.info(f"Webhook {webhook_id} updated successfully")
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error updating webhook: {e.message}")
            raise
    
    def delete_webhook(self, webhook_id: str) -> bool:
        """
        Delete a webhook subscription
        
        Args:
            webhook_id: Webhook ID
            
        Returns:
            True if successful
        """
        try:
            logger.info(f"Deleting webhook: {webhook_id}")
            self.client.delete(
                config.get_endpoint('webhook_detail', id=webhook_id)
            )
            
            logger.info(f"Webhook {webhook_id} deleted successfully")
            return True
        
        except RepliersAPIError as e:
            logger.error(f"Error deleting webhook: {e.message}")
            raise
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str,
        secret: str
    ) -> bool:
        """
        Verify webhook payload signature
        
        Args:
            payload: Raw request body (bytes)
            signature: x-api-key header value
            secret: Webhook secret from creation
            
        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    def register_event_handler(
        self,
        event: str,
        handler: Callable[[Dict[str, Any]], None]
    ):
        """
        Register a callback function for a specific event
        
        Args:
            event: Event name (e.g., 'listing.created')
            handler: Callback function that receives event payload
        
        Example:
            >>> def handle_new_listing(payload):
            ...     print(f"New listing: {payload['data']['address']}")
            >>> webhook_handler.register_event_handler('listing.created', handle_new_listing)
        """
        if event not in self.AVAILABLE_EVENTS:
            raise ValueError(f"Invalid event: {event}")
        
        self.event_handlers[event] = handler
        logger.info(f"Registered handler for event: {event}")
    
    def process_webhook(self, payload: Dict[str, Any]) -> bool:
        """
        Process incoming webhook payload and call appropriate handler
        
        Args:
            payload: Webhook payload dictionary
            
        Returns:
            True if processed successfully
        """
        event = payload.get('event')
        
        if not event:
            logger.error("Webhook payload missing 'event' field")
            return False
        
        logger.info(f"Processing webhook event: {event}")
        
        # Call registered handler if exists
        if event in self.event_handlers:
            try:
                self.event_handlers[event](payload)
                logger.info(f"Handler executed for event: {event}")
                return True
            except Exception as e:
                logger.error(f"Error in event handler for {event}: {str(e)}")
                return False
        else:
            logger.warning(f"No handler registered for event: {event}")
            return True  # Not an error, just no handler
    
    def create_flask_endpoint(self, app: Flask, path: str = '/webhooks/repliers'):
        """
        Create a Flask endpoint to receive webhooks
        
        Args:
            app: Flask application instance
            path: URL path for webhook endpoint
        
        Example:
            >>> from flask import Flask
            >>> app = Flask(__name__)
            >>> webhook_handler.create_flask_endpoint(app)
            >>> # Now webhooks will be received at /webhooks/repliers
        """
        @app.route(path, methods=['POST', 'GET'])
        def webhook_endpoint():
            # Handle verification handshake (GET request)
            if request.method == 'GET':
                secret = request.headers.get('X-Hook-Secret')
                if secret:
                    logger.info("Webhook verification handshake received")
                    return jsonify({'success': True}), 200
                else:
                    return jsonify({'error': 'Missing X-Hook-Secret header'}), 400
            
            # Handle webhook payload (POST request)
            try:
                # Verify signature if secret is configured
                if config.WEBHOOK_SECRET:
                    signature = request.headers.get('x-api-key', '')
                    if not self.verify_webhook_signature(
                        request.get_data(),
                        signature,
                        config.WEBHOOK_SECRET
                    ):
                        logger.warning("Webhook signature verification failed")
                        return jsonify({'error': 'Invalid signature'}), 401
                
                # Process webhook
                payload = request.get_json()
                self.process_webhook(payload)
                
                return jsonify({'success': True}), 200
            
            except Exception as e:
                logger.error(f"Error processing webhook: {str(e)}")
                return jsonify({'error': str(e)}), 500
        
        logger.info(f"Flask webhook endpoint created at {path}")


# Create default service instance
webhook_handler = WebhookHandler()


if __name__ == '__main__':
    # Test webhook handler
    print("🔔 Testing Webhook Handler...\n")
    
    handler = WebhookHandler()
    
    # Test 1: Create webhook
    print("1️⃣  Creating webhook subscription...")
    try:
        webhook = handler.create_webhook(
            events=['listing.created', 'listing.updated', 'listing.price_changed'],
            description="Test webhook for new listings and price changes"
        )
        webhook_id = webhook.get('id')
        webhook_secret = webhook.get('secret')
        print(f"   ✅ Webhook created with ID: {webhook_id}")
        print(f"   🔐 Secret: {webhook_secret[:10]}... (truncated for security)\n")
        
        # Test 2: Get webhooks
        print("2️⃣  Fetching all webhooks...")
        webhooks = handler.get_webhooks()
        print(f"   ✅ Found {len(webhooks)} webhook(s)\n")
        
        # Test 3: Register event handler
        print("3️⃣  Registering event handler...")
        def handle_new_listing(payload):
            listing_data = payload.get('data', {})
            print(f"   📧 New listing handler called: {listing_data.get('address', 'N/A')}")
        
        handler.register_event_handler('listing.created', handle_new_listing)
        print("   ✅ Event handler registered\n")
        
        # Test 4: Process mock webhook
        print("4️⃣  Processing mock webhook...")
        mock_payload = {
            'event': 'listing.created',
            'data': {
                'id': '123',
                'address': '123 Test St, Toronto, ON'
            }
        }
        handler.process_webhook(mock_payload)
        print("   ✅ Webhook processed\n")
        
        # Test 5: Delete webhook
        if webhook_id:
            print("5️⃣  Deleting webhook...")
            handler.delete_webhook(webhook_id)
            print("   ✅ Webhook deleted\n")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Show available events
    print("📋 Available webhook events:")
    for event in handler.AVAILABLE_EVENTS:
        print(f"   - {event}")
