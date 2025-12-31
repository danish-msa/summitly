"""
Chatbot Formatter - Convert API Responses to Conversational Messages
Format property listings, search results, and other data for chatbot display
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ChatbotFormatter:
    """
    Utility class to format Repliers API responses into user-friendly chatbot messages
    """
    
    @staticmethod
    def format_listing(listing: Dict[str, Any], include_details: bool = True) -> str:
        """
        Format a single listing into a conversational message
        
        Args:
            listing: Listing dictionary from API
            include_details: Include detailed property information
            
        Returns:
            Formatted string for chatbot display
        """
        # Extract basic info
        address = listing.get('address', {})
        price_info = listing.get('price', {})
        details = listing.get('details', {})
        status = listing.get('status', 'unknown')
        
        # Build address string
        street = address.get('street', 'N/A')
        city = address.get('city', '')
        state = address.get('state', '')
        postal = address.get('postalCode', '')
        full_address = f"{street}, {city}, {state} {postal}".strip(' ,')
        
        # Format price
        price = price_info.get('amount', 0)
        price_str = f"${price:,.0f}"
        
        # Build message
        lines = [
            f"🏠 **{full_address}**",
            f"💰 **Price**: {price_str}",
        ]
        
        # Add status
        status_emoji = {
            'active': '✅',
            'sold': '🔴',
            'pending': '🟡',
            'leased': '🔵'
        }
        emoji = status_emoji.get(status.lower(), '📋')
        lines.append(f"{emoji} **Status**: {status.title()}")
        
        if include_details:
            # Property details
            bedrooms = details.get('bedrooms', 'N/A')
            bathrooms = details.get('bathrooms', 'N/A')
            sqft = details.get('sqft', 'N/A')
            property_type = details.get('propertyType', 'N/A')
            property_style = details.get('propertyStyle', 'N/A')
            
            lines.append(f"📐 **Type**: {property_style} {property_type}")
            lines.append(f"🛏️  **Bedrooms**: {bedrooms} | 🚿 **Bathrooms**: {bathrooms}")
            
            if sqft != 'N/A':
                lines.append(f"📏 **Square Feet**: {sqft:,}")
            
            # Features
            features = details.get('features', [])
            if features:
                features_str = ", ".join(features[:5])
                lines.append(f"✨ **Features**: {features_str}")
            
            # MLS number
            mls = listing.get('mlsNumber')
            if mls:
                lines.append(f"🔖 **MLS#**: {mls}")
            
            # Listing date
            listed_date = listing.get('listedDate')
            if listed_date:
                try:
                    date_obj = datetime.fromisoformat(listed_date.replace('Z', '+00:00'))
                    days_ago = (datetime.now(date_obj.tzinfo) - date_obj).days
                    lines.append(f"📅 **Listed**: {days_ago} days ago")
                except:
                    pass
        
        # Add view link
        listing_id = listing.get('id')
        if listing_id:
            lines.append(f"🔗 [View Details](/listing/{listing_id})")
        
        return "\n".join(lines)
    
    @staticmethod
    def format_search_results(
        search_response: Dict[str, Any],
        max_listings: int = 5,
        show_pagination: bool = True
    ) -> str:
        """
        Format search results into chatbot message
        
        Args:
            search_response: Search response from listings API
            max_listings: Maximum number of listings to show
            show_pagination: Include pagination info
            
        Returns:
            Formatted search results message
        """
        listings = search_response.get('listings', [])
        total = search_response.get('total', 0)
        page = search_response.get('page', 1)
        page_size = search_response.get('pageSize', 25)
        
        if total == 0:
            return "😔 No properties found matching your criteria. Try adjusting your search filters!"
        
        # Header
        lines = [f"🔍 **Found {total} propert{'ies' if total != 1 else 'y'} matching your search**\n"]
        
        # Show listings
        for i, listing in enumerate(listings[:max_listings], 1):
            lines.append(f"\n**#{i}**")
            lines.append(ChatbotFormatter.format_listing(listing, include_details=False))
            lines.append("─" * 40)
        
        # Pagination info
        if show_pagination and total > max_listings:
            shown = min(len(listings), max_listings)
            remaining = total - (page - 1) * page_size - shown
            
            if remaining > 0:
                lines.append(f"\n📄 Showing {shown} of {total} results")
                lines.append(f"💬 Say 'show more' to see {min(remaining, page_size)} more properties")
        
        return "\n".join(lines)
    
    @staticmethod
    def format_property_details(listing: Dict[str, Any]) -> str:
        """
        Format complete property details for detailed view
        
        Args:
            listing: Full listing dictionary
            
        Returns:
            Comprehensive formatted property details
        """
        lines = [ChatbotFormatter.format_listing(listing, include_details=True)]
        
        details = listing.get('details', {})
        
        # Additional details
        lines.append("\n**📋 Additional Details:**")
        
        year_built = details.get('yearBuilt')
        if year_built:
            lines.append(f"  🏗️  Built: {year_built}")
        
        lot_size = details.get('lotSize')
        if lot_size:
            lines.append(f"  🌳 Lot Size: {lot_size} acres")
        
        parking = details.get('parking')
        if parking:
            lines.append(f"  🚗 Parking: {parking}")
        
        heating = details.get('heating')
        if heating:
            lines.append(f"  🔥 Heating: {heating}")
        
        cooling = details.get('cooling')
        if cooling:
            lines.append(f"  ❄️  Cooling: {cooling}")
        
        # Description
        description = listing.get('description')
        if description:
            lines.append("\n**📝 Description:**")
            # Truncate long descriptions
            if len(description) > 300:
                description = description[:297] + "..."
            lines.append(description)
        
        # Media - ENHANCED: Show actual photos
        media = listing.get('media', {})
        photos = media.get('photos', [])
        virtual_tour = media.get('virtualTour')
        
        if photos or virtual_tour:
            lines.append("\n**🖼️  Property Photos:**")
            
            # Render actual photo gallery
            if photos:
                lines.append('<div class="property-photo-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 16px 0; border-radius: 12px; overflow: hidden;">')
                
                # Show up to 6 photos
                for i, photo in enumerate(photos[:6]):
                    photo_url = photo.get('url', '')
                    if photo_url:
                        lines.append(f'''
                            <div class="photo-item" style="position: relative; height: 150px; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <img src="{photo_url}" 
                                     alt="Property photo {i+1}" 
                                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.3s;"
                                     onmouseover="this.style.transform='scale(1.05)'" 
                                     onmouseout="this.style.transform='scale(1)'"
                                     onclick="window.open('{photo_url}', '_blank')" />
                            </div>
                        ''')
                
                lines.append('</div>')
                
                if len(photos) > 6:
                    lines.append(f'<p style="font-size: 14px; color: #666; text-align: center;">📸 {len(photos)} total photos - Click any photo to view full size</p>')
                else:
                    lines.append(f'<p style="font-size: 14px; color: #666; text-align: center;">📸 {len(photos)} photos available - Click to view full size</p>')
            
            if virtual_tour:
                lines.append(f'<div style="margin-top: 12px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;"><a href="{virtual_tour}" target="_blank" style="color: white; text-decoration: none; font-weight: 600;">🏠 View Virtual Tour →</a></div>')
        
        # Open house
        open_house = listing.get('openHouse')
        if open_house:
            date = open_house.get('date')
            times = open_house.get('times')
            lines.append(f"\n🏡 **Open House**: {date} {times}")
        
        # Contact
        agent = listing.get('agent', {})
        if agent:
            agent_name = agent.get('name')
            agent_phone = agent.get('phone')
            agent_email = agent.get('email')
            
            lines.append("\n**👤 Contact Agent:**")
            if agent_name:
                lines.append(f"  Name: {agent_name}")
            if agent_phone:
                lines.append(f"  📞 {agent_phone}")
            if agent_email:
                lines.append(f"  📧 {agent_email}")
        
        return "\n".join(lines)
    
    @staticmethod
    def format_similar_listings(similar_response: Dict[str, Any]) -> str:
        """
        Format similar listings response
        
        Args:
            similar_response: Similar listings response from API
            
        Returns:
            Formatted message
        """
        listings = similar_response.get('listings', [])
        
        if not listings:
            return "🤷 No similar properties found at this time."
        
        lines = [
            f"🔄 **Found {len(listings)} similar propert{'ies' if len(listings) != 1 else 'y'}:**\n"
        ]
        
        for i, listing in enumerate(listings, 1):
            lines.append(f"**#{i}**")
            lines.append(ChatbotFormatter.format_listing(listing, include_details=False))
            
            # Show similarity score if available
            score = listing.get('similarityScore')
            if score:
                lines.append(f"🎯 Match Score: {score}%")
            
            lines.append("─" * 40)
        
        return "\n".join(lines)
    
    @staticmethod
    def format_saved_search(search: Dict[str, Any]) -> str:
        """
        Format saved search details
        
        Args:
            search: Saved search dictionary
            
        Returns:
            Formatted message
        """
        name = search.get('name', 'Unnamed Search')
        search_id = search.get('id', 'N/A')
        active = search.get('active', False)
        criteria = search.get('criteria', {})
        alerts = search.get('alerts', {})
        
        lines = [
            f"💾 **Saved Search**: {name}",
            f"🆔 ID: {search_id}",
            f"{'✅' if active else '⏸️ '} Status: {'Active' if active else 'Paused'}",
            "\n**🔍 Search Criteria:**"
        ]
        
        # Format criteria
        if criteria.get('city'):
            lines.append(f"  📍 City: {criteria['city']}")
        if criteria.get('minPrice') or criteria.get('maxPrice'):
            min_p = criteria.get('minPrice', 0)
            max_p = criteria.get('maxPrice', 'Any')
            lines.append(f"  💰 Price: ${min_p:,.0f} - {f'${max_p:,.0f}' if max_p != 'Any' else max_p}")
        if criteria.get('minBedrooms'):
            lines.append(f"  🛏️  Bedrooms: {criteria['minBedrooms']}+")
        if criteria.get('propertyStyle'):
            lines.append(f"  🏠 Style: {criteria['propertyStyle']}")
        
        # Alert settings
        frequency = alerts.get('frequency', 'instant')
        email = alerts.get('email', False)
        sms = alerts.get('sms', False)
        
        lines.append("\n**🔔 Alert Settings:**")
        lines.append(f"  ⏰ Frequency: {frequency.title()}")
        lines.append(f"  📧 Email: {'Yes' if email else 'No'}")
        lines.append(f"  📱 SMS: {'Yes' if sms else 'No'}")
        
        return "\n".join(lines)
    
    @staticmethod
    def format_nlp_summary(nlp_result: Dict[str, Any]) -> str:
        """
        Format NLP query processing result
        
        Args:
            nlp_result: NLP processing result
            
        Returns:
            Formatted message explaining what was understood
        """
        summary = nlp_result.get('summary', '')
        query_params = nlp_result.get('query', {})
        results_count = nlp_result.get('results_count', 0)
        
        lines = [
            "🧠 **Understood your request:**",
            f"  {summary}",
        ]
        
        if results_count is not None:
            lines.append(f"\n✅ Found {results_count} matching propert{'ies' if results_count != 1 else 'y'}")
        
        return "\n".join(lines)
    
    @staticmethod
    def format_error(error: Exception, user_friendly: bool = True) -> str:
        """
        Format error messages for chatbot display
        
        Args:
            error: Exception object
            user_friendly: Whether to show user-friendly message
            
        Returns:
            Formatted error message
        """
        if user_friendly:
            error_messages = {
                'AuthenticationError': "🔒 Authentication issue. Please contact support.",
                'NotFoundError': "🔍 Property not found. It may no longer be available.",
                'RateLimitError': "⏱️  Too many requests. Please try again in a moment.",
                'ValidationError': "⚠️  Invalid search criteria. Please check your filters.",
                'RepliersAPIError': "❌ Service temporarily unavailable. Please try again later."
            }
            
            error_type = type(error).__name__
            return error_messages.get(error_type, f"❌ {str(error)}")
        else:
            return f"Error: {str(error)}"
    
    @staticmethod
    def format_quick_replies(listing: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Generate quick reply buttons for a listing
        
        Args:
            listing: Listing dictionary
            
        Returns:
            List of quick reply button definitions
        """
        listing_id = listing.get('id', '')
        
        return [
            {'text': '📸 View Photos', 'action': f'view_photos:{listing_id}'},
            {'text': '🔄 Find Similar', 'action': f'find_similar:{listing_id}'},
            {'text': '💰 Get Estimate', 'action': f'get_estimate:{listing_id}'},
            {'text': '💾 Save Property', 'action': f'save_listing:{listing_id}'},
            {'text': '📅 Schedule Viewing', 'action': f'schedule_viewing:{listing_id}'},
        ]

    @staticmethod
    def format_valuation_card(valuation_data: Dict[str, Any]) -> str:
        """
        Format property valuation with enhanced visual display
        
        Args:
            valuation_data: Valuation response data
            
        Returns:
            HTML-formatted valuation card with visual enhancements
        """
        # Extract data
        structured_data = valuation_data.get('structured_data', {})
        
        list_price = structured_data.get('list_price', 0)
        ai_estimate = structured_data.get('ai_estimate', 0)
        adjustment_range = structured_data.get('adjustment_range', {})
        confidence = structured_data.get('confidence', 0)
        description = structured_data.get('description', '')
        comparables = structured_data.get('comparables', [])
        
        # Calculate range
        range_low = adjustment_range.get('low', ai_estimate * 0.93) if ai_estimate else list_price * 0.93
        range_high = adjustment_range.get('high', ai_estimate * 1.07) if ai_estimate else list_price * 1.07
        
        # Build HTML card
        html_parts = []
        
        # === Valuation Header Card ===
        html_parts.append('''
<div class="valuation-card" style="
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    margin: 16px 0;
    color: white;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
''')
        
        html_parts.append('<h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">🏠 Property Valuation Report</h2>')
        
        # === Price Comparison Section ===
        html_parts.append('''
<div class="price-comparison" style="
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;">
''')
        
        # List Price Box
        html_parts.append(f'''
    <div class="list-price-box" style="
        background: rgba(255, 255, 255, 0.15);
        padding: 16px;
        border-radius: 12px;
        backdrop-filter: blur(10px);">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">📋 List Price</div>
        <div style="font-size: 28px; font-weight: 700;">${list_price:,.0f}</div>
    </div>
''')
        
        # AI Estimate Box (Highlighted)
        html_parts.append(f'''
    <div class="ai-estimate-box" style="
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        padding: 16px;
        border-radius: 12px;
        border: 3px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #333;">✨ AI Estimated Value</div>
        <div style="font-size: 32px; font-weight: 800; color: #333;">${ai_estimate:,.0f}</div>
        <div style="font-size: 12px; margin-top: 8px; color: #555; font-weight: 600;">
            Range: ${range_low:,.0f} - ${range_high:,.0f}
        </div>
        <div style="font-size: 11px; margin-top: 6px; color: #666;">
            🎯 Confidence: {confidence}%
        </div>
    </div>
''')
        
        html_parts.append('</div>')  # End price-comparison
        
        # === Price Difference Indicator ===
        if list_price and ai_estimate:
            diff_amount = ai_estimate - list_price
            diff_pct = (diff_amount / list_price) * 100
            
            if abs(diff_pct) >= 1:
                if diff_pct > 0:
                    indicator_color = "#4CAF50"
                    indicator_icon = "📈"
                    indicator_text = "Above List Price"
                else:
                    indicator_color = "#FF9800"
                    indicator_icon = "📉"
                    indicator_text = "Below List Price"
                
                html_parts.append(f'''
<div class="price-diff-indicator" style="
    background: rgba(255, 255, 255, 0.15);
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 20px;">
    <span style="font-size: 14px;">{indicator_icon} {indicator_text}: </span>
    <span style="font-size: 16px; font-weight: 700; color: {indicator_color};">
        ${abs(diff_amount):,.0f} ({diff_pct:+.1f}%)
    </span>
</div>
''')
        
        html_parts.append('</div>')  # End valuation-card
        
        # === Description Section (Enhanced Formatting) ===
        if description:
            html_parts.append('''
<div class="description-section" style="
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
''')
            
            html_parts.append('<h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px; font-weight: 700;">📝 Property Analysis</h3>')
            
            # Format description with better structure
            desc_lines = description.split('\n')
            formatted_desc = []
            
            for line in desc_lines:
                line = line.strip()
                if not line:
                    continue
                
                # Convert bullet points or lists
                if line.startswith('•') or line.startswith('-'):
                    formatted_desc.append(f'<div style="margin: 8px 0 8px 20px; color: #555; line-height: 1.6;">✓ {line[1:].strip()}</div>')
                # Headers
                elif line.endswith(':'):
                    formatted_desc.append(f'<div style="font-weight: 700; color: #667eea; margin: 16px 0 8px 0;">{line}</div>')
                # Regular text
                else:
                    formatted_desc.append(f'<div style="margin: 8px 0; color: #666; line-height: 1.6;">{line}</div>')
            
            html_parts.append(''.join(formatted_desc))
            html_parts.append('</div>')  # End description-section
        
        # === Comparable Properties Section ===
        if comparables and len(comparables) > 0:
            html_parts.append('''
<div class="comparables-section" style="
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
''')
            
            html_parts.append(f'<h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px; font-weight: 700;">🏘️ Comparable Properties ({len(comparables)})</h3>')
            
            html_parts.append('<div style="display: grid; grid-template-columns: 1fr; gap: 12px;">')
            
            for i, comp in enumerate(comparables[:5], 1):
                mls_id = comp.get('mls_id', 'N/A')
                address = comp.get('address', 'Property')
                sold_price = comp.get('sold_price', 0)
                sold_date = comp.get('sold_date', 'Recently')
                distance_km = comp.get('distance_km', 0)
                
                html_parts.append(f'''
    <div class="comp-card" style="
        background: #f8f9fa;
        padding: 14px;
        border-radius: 8px;
        border-left: 4px solid #667eea;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
                <div style="font-weight: 700; color: #333; margin-bottom: 4px;">{i}. {address}</div>
                <div style="font-size: 13px; color: #666;">MLS: {mls_id}</div>
                <div style="font-size: 14px; color: #667eea; margin-top: 6px; font-weight: 600;">
                    Sold: ${sold_price:,.0f}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">{sold_date}</div>
            </div>
            <div style="background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                📍 {distance_km:.1f}km
            </div>
        </div>
    </div>
''')
            
            html_parts.append('</div>')  # End grid
            
            if len(comparables) > 5:
                html_parts.append(f'''
<div style="text-align: center; margin-top: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
    <span style="color: #667eea; font-weight: 600;">+{len(comparables) - 5} more comparables analyzed</span>
</div>
''')
            
            html_parts.append('</div>')  # End comparables-section
        
        # === Data Sources & Confidence Footer ===
        html_parts.append('''
<div class="footer-info" style="
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    border-left: 4px solid #4CAF50;">
    <div style="font-size: 12px; color: #666; line-height: 1.8;">
        <div style="margin-bottom: 8px; font-weight: 600; color: #333; font-size: 13px;">📊 Analysis Details</div>
        <div style="margin-bottom: 6px;"><strong>🔍 Data Source:</strong> Repliers MLS - Live Market Data</div>
        <div style="margin-bottom: 6px;"><strong>🤖 AI Model:</strong> OpenAI GPT-4o-mini (Canadian Real Estate Trained)</div>
        <div style="margin-bottom: 6px;"><strong>📈 Comparables:</strong> Multiple properties analyzed for accuracy</div>
        <div style="margin-bottom: 6px;"><strong>� Analysis Date:</strong> Real-time market analysis</div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6; font-style: italic; color: #888;">
            ⚠️ This is an AI-powered market analysis. For official property valuations, financing, or legal purposes, please consult a licensed Canadian residential appraiser.
        </div>
    </div>
</div>
''')
        
        return ''.join(html_parts)


# Create default formatter instance
chatbot_formatter = ChatbotFormatter()


if __name__ == '__main__':
    # Test formatter with mock data
    print("💬 Testing Chatbot Formatter...\n")
    
    mock_listing = {
        'id': 'listing_123',
        'mlsNumber': 'W5678901',
        'address': {
            'street': '123 Main Street',
            'city': 'Toronto',
            'state': 'ON',
            'postalCode': 'M5H 2N2'
        },
        'price': {'amount': 899000},
        'status': 'active',
        'details': {
            'bedrooms': 3,
            'bathrooms': 2.5,
            'sqft': 2100,
            'propertyType': 'residential',
            'propertyStyle': 'detached',
            'features': ['Hardwood Floors', 'Granite Counters', 'Fireplace', 'Backyard'],
            'yearBuilt': 2010,
            'parking': '2-car garage'
        },
        'listedDate': '2024-11-01T00:00:00Z',
        'description': 'Beautiful family home in prime location...'
    }
    
    # Test 1: Format single listing
    print("1️⃣  Formatting single listing:")
    print(chatbot_formatter.format_listing(mock_listing))
    print("\n" + "="*60 + "\n")
    
    # Test 2: Format search results
    mock_search_response = {
        'listings': [mock_listing] * 3,
        'total': 25,
        'page': 1,
        'pageSize': 25
    }
    
    print("2️⃣  Formatting search results:")
    print(chatbot_formatter.format_search_results(mock_search_response, max_listings=3))
    print("\n" + "="*60 + "\n")
    
    # Test 3: Format quick replies
    print("3️⃣  Quick reply buttons:")
    replies = chatbot_formatter.format_quick_replies(mock_listing)
    for reply in replies:
        print(f"  [{reply['text']}]")
