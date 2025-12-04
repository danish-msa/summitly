"""
Messages Service - Client Authentication and Communication
Handle magic link authentication and client messaging
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from services.repliers_client import client, RepliersAPIError
from services.repliers_config import config

logger = logging.getLogger(__name__)


class MessageService:
    """
    Service for sending messages and managing client authentication via magic links
    """
    
    def __init__(self, api_client=None):
        """
        Initialize message service
        
        Args:
            api_client: Optional RepliersClient instance
        """
        self.client = api_client or client
    
    def send_message(
        self,
        client_email: str,
        subject: str,
        message_body: str,
        client_name: Optional[str] = None,
        listing_ids: Optional[list] = None,
        include_magic_link: bool = True,
        magic_link_expiry_hours: int = 48
    ) -> Dict[str, Any]:
        """
        Send a message to a client with optional magic link for authentication
        
        Args:
            client_email: Client's email address
            subject: Email subject line
            message_body: Message content (supports HTML)
            client_name: Client's name for personalization
            listing_ids: Optional list of listing IDs to include in message
            include_magic_link: Generate a magic link for passwordless auth
            magic_link_expiry_hours: Hours until magic link expires (default 48)
            
        Returns:
            Dictionary containing message details and token
        
        Example:
            >>> message = service.send_message(
            ...     client_email="buyer@example.com",
            ...     subject="New Listings Matching Your Criteria",
            ...     message_body="<p>Hi! We found 3 new properties you might like...</p>",
            ...     listing_ids=["listing_123", "listing_456"],
            ...     include_magic_link=True
            ... )
            >>> print(f"Magic link token: {message['token']}")
        """
        payload = {
            'recipient': {
                'email': client_email
            },
            'subject': subject,
            'body': message_body
        }
        
        if client_name:
            payload['recipient']['name'] = client_name
        
        if listing_ids:
            payload['listings'] = listing_ids
        
        if include_magic_link:
            expiry = datetime.utcnow() + timedelta(hours=magic_link_expiry_hours)
            payload['magicLink'] = {
                'enabled': True,
                'expiresAt': expiry.isoformat()
            }
        
        try:
            logger.info(f"Sending message to {client_email}")
            response = self.client.post(
                config.get_endpoint('messages'),
                json_data=payload
            )
            
            message_id = response.get('id')
            token = response.get('token')
            
            logger.info(f"Message sent with ID: {message_id}")
            if token:
                logger.info(f"Magic link token generated: {token[:10]}...")
            
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error sending message: {e.message}")
            raise
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate a magic link token and retrieve client information
        
        Args:
            token: Magic link token from URL
            
        Returns:
            Dictionary containing client information and token validity
            
        Example:
            >>> client_info = service.validate_token("abc123xyz789")
            >>> if client_info['valid']:
            ...     print(f"Authenticated: {client_info['client']['email']}")
        """
        try:
            logger.info(f"Validating token: {token[:10]}...")
            response = self.client.get(
                config.get_endpoint('message_token', token=token)
            )
            
            is_valid = response.get('valid', False)
            if is_valid:
                logger.info("Token is valid")
            else:
                logger.warning("Token is invalid or expired")
            
            return response
        
        except RepliersAPIError as e:
            logger.error(f"Error validating token: {e.message}")
            raise
    
    def get_client_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get client details using a valid magic link token
        
        Args:
            token: Magic link token
            
        Returns:
            Client information if token is valid, None otherwise
        """
        try:
            validation = self.validate_token(token)
            
            if validation.get('valid'):
                return validation.get('client')
            else:
                return None
        
        except RepliersAPIError:
            return None
    
    def send_listing_alert(
        self,
        client_email: str,
        client_name: str,
        listings: list,
        alert_type: str = 'new_listings'
    ) -> Dict[str, Any]:
        """
        Send a formatted listing alert to a client
        
        Args:
            client_email: Client's email
            client_name: Client's name
            listings: List of listing dictionaries
            alert_type: Type of alert ('new_listings', 'price_change', 'status_change')
            
        Returns:
            Message sending result
        """
        # Generate subject based on alert type
        subjects = {
            'new_listings': f"🏠 {len(listings)} New Listing{'s' if len(listings) != 1 else ''} Matching Your Search",
            'price_change': f"💰 Price Update{'s' if len(listings) != 1 else ''} on Properties You're Watching",
            'status_change': f"📊 Status Update{'s' if len(listings) != 1 else ''} on Saved Properties"
        }
        
        subject = subjects.get(alert_type, f"Property Update: {len(listings)} Listing(s)")
        
        # Build HTML message body
        body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
                .listing {{ border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px; }}
                .listing h3 {{ color: #2563eb; margin-top: 0; }}
                .price {{ font-size: 24px; font-weight: bold; color: #16a34a; }}
                .details {{ color: #666; }}
                .cta {{ background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; 
                        border-radius: 6px; display: inline-block; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{subject}</h1>
            </div>
            <div style="padding: 20px;">
                <p>Hi {client_name},</p>
                <p>We found {len(listings)} propert{'ies' if len(listings) != 1 else 'y'} that match your search criteria:</p>
        """
        
        # Add listing details
        listing_ids = []
        for listing in listings[:5]:  # Limit to 5 listings in email
            listing_ids.append(listing.get('id'))
            address = listing.get('address', {})
            full_address = f"{address.get('street', 'N/A')}, {address.get('city', '')}"
            price = listing.get('price', {}).get('amount', 0)
            bedrooms = listing.get('details', {}).get('bedrooms', 'N/A')
            bathrooms = listing.get('details', {}).get('bathrooms', 'N/A')
            sqft = listing.get('details', {}).get('sqft', 'N/A')
            
            body += f"""
                <div class="listing">
                    <h3>📍 {full_address}</h3>
                    <div class="price">${price:,.0f}</div>
                    <div class="details">
                        🛏️ {bedrooms} Bed | 🚿 {bathrooms} Bath | 📐 {sqft} sqft
                    </div>
                </div>
            """
        
        if len(listings) > 5:
            body += f"<p><em>...and {len(listings) - 5} more propert{'ies' if len(listings) - 5 != 1 else 'y'}</em></p>"
        
        body += """
                <p>
                    <a href="{{magic_link_url}}" class="cta">View All Listings</a>
                </p>
                <p>This link will allow you to view details and save your favorites.</p>
                <p>Best regards,<br>Your Real Estate Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_message(
            client_email=client_email,
            subject=subject,
            message_body=body,
            client_name=client_name,
            listing_ids=listing_ids,
            include_magic_link=True
        )
    
    def create_magic_link_url(
        self,
        token: str,
        base_url: str = "https://your-domain.com"
    ) -> str:
        """
        Generate a full magic link URL from a token
        
        Args:
            token: Magic link token
            base_url: Your application's base URL
            
        Returns:
            Full magic link URL
        """
        return f"{base_url}/auth/magic-link?token={token}"


# Create default service instance
message_service = MessageService()


if __name__ == '__main__':
    # Test message service
    print("💌 Testing Message Service...\n")
    
    service = MessageService()
    
    # Test 1: Send simple message with magic link
    print("1️⃣  Sending message with magic link...")
    try:
        result = service.send_message(
            client_email="test@example.com",
            client_name="Test User",
            subject="Welcome to Our Service",
            message_body="<p>Hi! Welcome to our real estate platform. Click the link below to get started.</p>",
            include_magic_link=True
        )
        
        message_id = result.get('id')
        token = result.get('token')
        
        print(f"   ✅ Message sent with ID: {message_id}")
        if token:
            print(f"   🔗 Token: {token[:15]}...")
            magic_link = service.create_magic_link_url(token)
            print(f"   🌐 Magic link: {magic_link}\n")
            
            # Test 2: Validate token
            print("2️⃣  Validating magic link token...")
            validation = service.validate_token(token)
            if validation.get('valid'):
                print(f"   ✅ Token is valid")
                client = validation.get('client', {})
                print(f"   👤 Client: {client.get('email', 'N/A')}\n")
            else:
                print(f"   ❌ Token is invalid\n")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 3: Send listing alert (mock data)
    print("3️⃣  Sending listing alert (mock)...")
    try:
        mock_listings = [
            {
                'id': 'listing_1',
                'address': {'street': '123 Main St', 'city': 'Toronto'},
                'price': {'amount': 750000},
                'details': {'bedrooms': 3, 'bathrooms': 2, 'sqft': 1800}
            },
            {
                'id': 'listing_2',
                'address': {'street': '456 Oak Ave', 'city': 'Toronto'},
                'price': {'amount': 650000},
                'details': {'bedrooms': 2, 'bathrooms': 2, 'sqft': 1200}
            }
        ]
        
        result = service.send_listing_alert(
            client_email="buyer@example.com",
            client_name="John Doe",
            listings=mock_listings,
            alert_type='new_listings'
        )
        
        print(f"   ✅ Listing alert sent with ID: {result.get('id')}\n")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
