"""
Broker assignment and management handlers
"""
import traceback
from typing import Dict, List, Optional
from config.brokers import ONTARIO_BROKERS


def get_broker_by_id(broker_id: str) -> Optional[Dict]:
    """Get broker by ID"""
    return next((b for b in ONTARIO_BROKERS if b['broker_id'] == broker_id), None)


def get_active_brokers() -> List[Dict]:
    """Get all active brokers"""
    return [b for b in ONTARIO_BROKERS if b['is_active']]


def calculate_location_score(broker_location: str, lead_location: str) -> float:
    """Calculate location match score between broker and lead"""
    broker_loc = broker_location.lower().strip()
    lead_loc = lead_location.lower().strip()
    
    # Exact match
    if broker_loc == lead_loc:
        return 1.0
    
    # GTA region matching
    gta_cities = {
        'toronto': ['north york', 'scarborough', 'etobicoke', 'york', 'east york'],
        'mississauga': ['brampton', 'oakville'],
        'markham': ['richmond hill', 'vaughan', 'thornhill'],
        'brampton': ['mississauga', 'caledon']
    }
    
    for city, nearby in gta_cities.items():
        if broker_loc == city and lead_loc in nearby:
            return 0.8
        if lead_loc == city and broker_loc in nearby:
            return 0.8
    
    # Partial match
    if broker_loc in lead_loc or lead_loc in broker_loc:
        return 0.6
    
    return 0.1


def calculate_workload_score(active_leads: int) -> float:
    """Calculate score based on broker workload"""
    if active_leads <= 5:
        return 1.0
    elif active_leads <= 10:
        return 0.8
    elif active_leads <= 15:
        return 0.6
    elif active_leads <= 20:
        return 0.4
    else:
        return 0.2


def calculate_success_score(success_rate: int) -> float:
    """Calculate score based on broker success rate"""
    return min(success_rate / 100.0, 1.0)


def assign_broker_to_lead(location: str = '', property_type: str = '', budget: str = '') -> Optional[Dict]:
    """Intelligent broker assignment algorithm"""
    try:
        print(f"🤖 [BROKER ASSIGNMENT] Processing lead in {location}")
        
        active_brokers = get_active_brokers()
        if not active_brokers:
            print("❌ No active brokers available")
            return None
        
        # Score each broker
        broker_scores = []
        
        for broker in active_brokers:
            # Calculate individual scores
            location_score = calculate_location_score(broker['location'], location)
            workload_score = calculate_workload_score(broker['active_leads_count'])
            success_score = calculate_success_score(broker['success_rate'])
            
            # Weighted total score
            total_score = (
                location_score * 0.40 +    # 40% location weight
                success_score * 0.35 +     # 35% success rate weight
                workload_score * 0.25      # 25% workload weight
            )
            
            broker_scores.append({
                'broker': broker,
                'total_score': total_score,
                'location_score': location_score,
                'workload_score': workload_score,
                'success_score': success_score
            })
        
        # Sort by total score (highest first)
        broker_scores.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Select the best broker
        best_match = broker_scores[0]
        selected_broker = best_match['broker']
        
        print(f"✅ [BROKER ASSIGNMENT] Selected: {selected_broker['name']}")
        print(f"   Location Score: {best_match['location_score']:.2f}")
        print(f"   Success Score: {best_match['success_score']:.2f}")
        print(f"   Workload Score: {best_match['workload_score']:.2f}")
        print(f"   Total Score: {best_match['total_score']:.2f}")
        
        return selected_broker
        
    except Exception as e:
        print(f"❌ Broker assignment error: {e}")
        traceback.print_exc()
        return None