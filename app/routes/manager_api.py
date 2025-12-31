"""
Manager dashboard API routes
"""
from flask import Blueprint, request, jsonify
from handlers.broker_handler import get_active_brokers, get_broker_by_id
from utils.excel_utils import get_leads_data, update_lead_status, manual_assign_broker
from app.config.config import Config
import traceback

manager_api = Blueprint('manager_api', __name__)

@manager_api.route('/api/manager/leads', methods=['GET'])
def api_get_leads():
    """Get all leads with optional filtering"""
    try:
        status_filter = request.args.get('status')
        broker_filter = request.args.get('broker_id')
        
        print(f"📊 [MANAGER API] Getting leads - Status: {status_filter}, Broker: {broker_filter}")
        
        leads = get_leads_data(Config.EXCEL_FILE_PATH, status_filter, broker_filter)
        
        return jsonify({
            "success": True,
            "leads": leads,
            "total": len(leads),
            "filters": {
                "status": status_filter,
                "broker_id": broker_filter
            }
        })
        
    except Exception as e:
        print(f"❌ [MANAGER API] Error getting leads: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@manager_api.route('/api/manager/brokers', methods=['GET'])
def api_get_brokers():
    """Get all brokers information"""
    try:
        print(f"👥 [MANAGER API] Getting brokers list")
        
        brokers = get_active_brokers()
        
        return jsonify({
            "success": True,
            "brokers": brokers,
            "total": len(brokers)
        })
        
    except Exception as e:
        print(f"❌ [MANAGER API] Error getting brokers: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@manager_api.route('/api/manager/update-lead-status', methods=['POST'])
def api_update_lead_status():
    """Update lead status"""
    try:
        data = request.get_json()
        lead_id = data.get('lead_id')
        new_status = data.get('status')
        notes = data.get('notes', '')
        
        print(f"📝 [MANAGER API] Updating lead {lead_id} status to: {new_status}")
        
        success = update_lead_status(Config.EXCEL_FILE_PATH, lead_id, new_status, notes)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Lead {lead_id} status updated to {new_status}"
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Failed to update lead {lead_id}"
            }), 400
            
    except Exception as e:
        print(f"❌ [MANAGER API] Error updating lead status: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@manager_api.route('/api/manager/assign-broker', methods=['POST'])
def api_manual_assign_broker():
    """Manually assign broker to lead"""
    try:
        data = request.get_json()
        lead_id = data.get('lead_id')
        broker_id = data.get('broker_id')
        manager_reason = data.get('reason', 'Manual assignment by manager')
        
        print(f"👤 [MANAGER API] Manual broker assignment - Lead: {lead_id}, Broker: {broker_id}")
        
        # Get broker details
        broker = get_broker_by_id(broker_id)
        if not broker:
            return jsonify({
                "success": False,
                "error": f"Broker {broker_id} not found"
            }), 400
        
        result = manual_assign_broker(
            Config.EXCEL_FILE_PATH,
            lead_id, 
            broker_id, 
            broker['name'], 
            broker['email'], 
            manager_reason
        )
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ [MANAGER API] Error in manual broker assignment: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@manager_api.route('/api/manager/dashboard-stats', methods=['GET'])
def api_dashboard_stats():
    """Get dashboard statistics"""
    try:
        print(f"📈 [MANAGER API] Getting dashboard stats")
        
        leads = get_leads_data(Config.EXCEL_FILE_PATH)
        brokers = get_active_brokers()
        
        # Calculate statistics
        total_leads = len(leads)
        new_leads = len([l for l in leads if l.get('Status') == 'New'])
        assigned_leads = len([l for l in leads if l.get('Assigned Broker ID')])
        
        # Broker statistics
        broker_stats = {}
        for broker in brokers:
            broker_leads = [l for l in leads if l.get('Assigned Broker ID') == broker['broker_id']]
            broker_stats[broker['broker_id']] = {
                'name': broker['name'],
                'total_leads': len(broker_leads),
                'active_leads': broker['active_leads_count'],
                'success_rate': broker['success_rate']
            }
        
        return jsonify({
            "success": True,
            "stats": {
                "total_leads": total_leads,
                "new_leads": new_leads,
                "assigned_leads": assigned_leads,
                "total_brokers": len(brokers),
                "broker_stats": broker_stats
            }
        })
        
    except Exception as e:
        print(f"❌ [MANAGER API] Error getting dashboard stats: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@manager_api.route('/api/test-repliers', methods=['GET'])
def test_repliers_api():
    """Test Repliers API connectivity"""
    try:
        print("🧪 [MANAGER API] Testing Repliers API connectivity")
        
        # Try to import and test Repliers service
        try:
            from services.listings_service import listings_service
            
            # Test with basic search
            result = listings_service.search_listings(
                city='Toronto',
                status='active',
                page_size=5
            )
            
            return jsonify({
                "success": True,
                "message": "Repliers API is working",
                "sample_results": {
                    "total": result.get('count', 0),
                    "listings_returned": len(result.get('listings', [])),
                    "status": "Connected"
                }
            })
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "Repliers service not available - check import configuration"
            }), 503
            
    except Exception as e:
        print(f"❌ [MANAGER API] Repliers test error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500