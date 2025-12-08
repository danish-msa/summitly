"""
Frontend serving routes
"""
from flask import Blueprint, send_from_directory, jsonify
import os

frontend_routes = Blueprint('frontend_routes', __name__)

@frontend_routes.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "Real Estate Voice Assistant",
        "version": "2.0.0"
    })


@frontend_routes.route('/manager')
def manager_dashboard():
    """Serve manager dashboard"""
    try:
        return send_from_directory('../Frontend', 'manager.html')
    except Exception as e:
        return jsonify({
            "error": "Manager dashboard not found",
            "message": str(e)
        }), 404


@frontend_routes.route('/intelligent')
def serve_intelligent_chatbot():
    """Serve intelligent chatbot interface"""
    try:
        return send_from_directory('../Frontend', 'intelligent.html')
    except Exception as e:
        return jsonify({
            "error": "Intelligent chatbot interface not found",
            "message": str(e)
        }), 404


@frontend_routes.route('/main')
def serve_main_frontend():
    """Serve main frontend interface"""
    try:
        return send_from_directory('../Frontend', 'main.html')
    except Exception as e:
        return jsonify({
            "error": "Main interface not found",
            "message": str(e)
        }), 404


@frontend_routes.route('/test-amenities')
def serve_test_amenities():
    """Serve test amenities page"""
    try:
        return send_from_directory('../Frontend', 'test-amenities.html')
    except Exception as e:
        return jsonify({
            "error": "Test amenities page not found",
            "message": str(e)
        }), 404


@frontend_routes.route('/api/debug-amenities', methods=['GET'])
def debug_amenities():
    """Debug amenities functionality"""
    return jsonify({
        "success": True,
        "message": "Amenities debug endpoint",
        "available_features": [
            "Property search",
            "Neighborhood analysis",
            "School information",
            "Transit connectivity"
        ]
    })


@frontend_routes.route('/', defaults={'path': ''})
@frontend_routes.route('/<path:path>')
def serve(path):
    """Serve static files with fallbacks"""
    try:
        if path != "" and os.path.exists(os.path.join('../static', path)):
            return send_from_directory('../static', path)
        elif path != "" and os.path.exists(os.path.join('../Frontend', path)):
            return send_from_directory('../Frontend', path)
        else:
            # Default to main.html for SPA routing
            return send_from_directory('../Frontend', 'main.html')
    except Exception as e:
        return jsonify({
            "error": "File not found",
            "path": path,
            "message": str(e)
        }), 404