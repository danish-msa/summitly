"""
Fallback Images as Data URIs
================================
These are embedded directly in the code so they work everywhere (local, Render, etc.)
No need to serve from /static folder
"""

# Base64-encoded SVG for "No Property Image Available"
NO_PROPERTY_IMAGE_DATA_URI = """data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8cmVjdCB4PSIxNjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZDFkNWRiIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjE3NSIgY3k9IjE0MCIgcj0iOCIgZmlsbD0iIzljYTNhZiIvPgogIDxwYXRoIGQ9Im0xODUgMTU1IDE1LTE1IDE1IDE1djEwaC0zMHYtMTB6IiBmaWxsPSIjOWNhM2FmIi8+CiAgPHRleHQgeD0iMjAwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4="""

# Alternative: Use a publicly hosted placeholder image
NO_PROPERTY_IMAGE_URL = "https://via.placeholder.com/400x300/f3f4f6/6b7280?text=No+Image+Available"

# Simple gray placeholder as data URI
SIMPLE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236b7280'%3ENo Image Available%3C/text%3E%3C/svg%3E"

def get_fallback_image_url():
    """
    Returns the best fallback image URL.
    Preference: Data URI (always works) > CDN > Static file
    """
    return SIMPLE_PLACEHOLDER
