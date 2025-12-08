"""
Email notification utilities
"""
import os
from typing import Dict


# Check if Flask-Mail is available
try:
    from flask_mail import Mail, Message
    FLASK_MAIL_AVAILABLE = True
except ImportError:
    FLASK_MAIL_AVAILABLE = False
    print("⚠️ Email library not available. Email features will use SMTP fallback.")


def send_email_notification(mail_instance, app_config: Dict, recipient: str, subject: str, body: str, is_html: bool = False) -> bool:
    """Send email notification with fallback handling"""
    try:
        if FLASK_MAIL_AVAILABLE and app_config.get('MAIL_PASSWORD'):
            msg = Message(
                subject=subject,
                sender=app_config.get('MAIL_DEFAULT_SENDER', 'noreply@summitly.ca'),
                recipients=[recipient]
            )
            
            if is_html:
                msg.html = body
            else:
                msg.body = body
            
            mail_instance.send(msg)
            print(f"✅ Email sent successfully to {recipient}")
            return True
        else:
            print(f"⚠️ Email configuration not available. Would send to {recipient}: {subject}")
            return False
        
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False


def send_lead_confirmation_to_user(mail_instance, app_config: Dict, user_data: Dict, broker_info: Dict, lead_id: str) -> bool:
    """Send lead confirmation to user"""
    try:
        if not user_data.get('email'):
            print("⚠️ No user email provided")
            return False
            
        subject = "Your Property Inquiry - Broker Assignment Confirmation"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">🏠 Thank You for Your Property Inquiry</h2>
                
                <p>Dear <strong>{user_data.get('name', 'Valued Client')}</strong>,</p>
                
                <p>Thank you for using Summitly's AI assistant. We've assigned you a dedicated broker:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2c5aa0;">Your Assigned Broker</h3>
                    <p><strong>Name:</strong> {broker_info.get('name', 'Professional Broker')}</p>
                    <p><strong>Email:</strong> {broker_info.get('email', 'Not available')}</p>
                    <p><strong>Location:</strong> {broker_info.get('location', 'Ontario')}</p>
                    <p><strong>Experience:</strong> {broker_info.get('experience', 'Experienced Professional')}</p>
                </div>
                
                <p><strong>Lead Reference ID:</strong> {lead_id}</p>
                
                <p>Your broker will contact you within 24 hours.</p>
                
                <p>Best regards,<br><strong>The Summitly Team</strong></p>
            </div>
        </body>
        </html>
        """
        
        return send_email_notification(mail_instance, app_config, user_data.get('email', ''), subject, html_body, is_html=True)
        
    except Exception as e:
        print(f"❌ User confirmation error: {e}")
        return False