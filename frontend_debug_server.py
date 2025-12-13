#!/usr/bin/env python3
"""
Frontend Debug Test - Create a simple API endpoint to test exact data format
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/test/property-insights/<mls_number>')
def test_property_insights(mls_number):
    """
    Test endpoint that returns the exact data structure your frontend expects
    """
    
    # Return the exact structure that should work with your frontend
    test_data = {
        "success": True,
        "mls_number": mls_number,
        "quick_insights": {
            "estimated_value": {
                "low": 612394,
                "mid": 624214,
                "high": 636034
            },
            "schools": [
                {
                    "name": "Local Schools Available",
                    "rating": 8.0,
                    "type": "Mixed",
                    "distance": "Nearby",
                    "summary": "Schools available in Toronto area."
                }
            ],
            "neighborhood": {
                "summary": "Toronto is noted as a safe neighborhood with good community services and amenities.",
                "safety_score": 8,
                "walkability": 75,
                "walkability_display": "75%",
                "walkability_value": 75,
                "demographics": "Diverse community"
            },
            "connectivity": {
                "summary": "Toronto has good public transit access with multiple transit options available.",
                "transit_score": 80,
                "commute_time": "30-40 minutes to downtown"
            },
            "market_trend": {
                "summary": "Toronto real estate market showing stable conditions with normal market activity.",
                "appreciation": 6.0
            },
            "rental_potential": {
                "summary": "Strong rental market with estimated monthly rent around $2200 and good ROI potential.",
                "estimated_rent": 2400,
                "roi": 4.5
            },
            "pros": [
                "Location in established neighborhood",
                "Access to transit and amenities", 
                "Stable rental market",
                "Growing area with development potential"
            ],
            "cons": [
                "Market volatility",
                "Competition from similar properties",
                "Economic factors affecting real estate"
            ]
        },
        "sources": [
            {
                "title": "Toronto Housing Market Report",
                "url": "https://example.com/toronto-market",
                "type": "exa"
            }
        ]
    }
    
    return jsonify(test_data)

@app.route('/test/debug')
def debug_info():
    """Debug endpoint with multiple walkability formats"""
    return jsonify({
        "walkability_formats": {
            "as_number": 75,
            "as_string": "75",
            "as_percentage": "75%",
            "with_label": {"value": 75, "display": "75%"},
            "nested": {"walkability": {"score": 75, "display": "75%"}}
        },
        "message": "Test different walkability formats to see which one your frontend displays"
    })

if __name__ == '__main__':
    print("🧪 Starting Frontend Debug Server on http://localhost:5001")
    print("Test endpoints:")
    print("  - http://localhost:5001/test/property-insights/C12628992")
    print("  - http://localhost:5001/test/debug")
    app.run(port=5001, debug=True)