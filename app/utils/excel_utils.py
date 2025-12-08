"""
Excel utilities for lead management
"""
import os
import json
import uuid
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional


# Check if openpyxl is available
try:
    import openpyxl
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False
    print("⚠️ openpyxl not available. Using pandas for Excel operations.")


def initialize_excel_file(excel_file_path: str) -> bool:
    """Initialize Excel file with proper headers if it doesn't exist"""
    try:
        if not os.path.exists(excel_file_path):
            headers = [
                "Lead ID", "Timestamp", "User Name", "User Email", "User Phone",
                "Location Searched", "Property Type", "Budget Range", "Availability",
                "Properties Interested In", "Assigned Broker ID", "Assigned Broker Name", 
                "Assigned Broker Email", "Status", "Notes", "Conversation History"
            ]
            
            # Create empty DataFrame with headers only
            df = pd.DataFrame(columns=headers)
            df.to_excel(excel_file_path, index=False)
            print(f"✅ Excel file initialized with headers only: {excel_file_path}")
        
        return True
    except Exception as e:
        print(f"❌ Excel initialization error: {e}")
        return False


def generate_lead_id() -> str:
    """Generate unique lead ID"""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_suffix = str(uuid.uuid4())[:8].upper()
    return f"LEAD_{timestamp}_{random_suffix}"


def create_lead_record(excel_file_path: str, user_data: Dict, assigned_broker: Dict = None, properties_viewed: List = None) -> str:
    """Create lead record and save to Excel"""
    try:
        lead_id = generate_lead_id()
        timestamp = datetime.now().isoformat()
        
        lead_record = {
            "Lead ID": lead_id,
            "Timestamp": timestamp,
            "User Name": user_data.get('name', ''),
            "User Email": user_data.get('email', ''),
            "User Phone": user_data.get('contact', ''),
            "Location Searched": user_data.get('location', ''),
            "Property Type": user_data.get('property_type', ''),
            "Budget Range": user_data.get('budget', ''),
            "Availability": user_data.get('availability_date', ''),
            "Properties Interested In": json.dumps(properties_viewed) if properties_viewed else '',
            "Assigned Broker ID": assigned_broker['broker_id'] if assigned_broker else '',
            "Assigned Broker Name": assigned_broker['name'] if assigned_broker else '',
            "Assigned Broker Email": assigned_broker['email'] if assigned_broker else '',
            "Status": "New",
            "Notes": "",
            "Conversation History": json.dumps(user_data.get('conversation_history', []))
        }
        
        # Save to Excel
        try:
            try:
                df = pd.read_excel(excel_file_path)
            except FileNotFoundError:
                initialize_excel_file(excel_file_path)
                df = pd.read_excel(excel_file_path)
            
            new_row = pd.DataFrame([lead_record])
            df = pd.concat([df, new_row], ignore_index=True)
            df.to_excel(excel_file_path, index=False)
            
            print(f"✅ Lead record saved: {lead_id}")
            return lead_id
            
        except Exception as excel_error:
            print(f"❌ Excel save error: {excel_error}")
            backup_file = f"lead_backup_{lead_id}.json"
            with open(backup_file, 'w') as f:
                json.dump(lead_record, f, indent=2)
            print(f"📁 Lead saved to backup: {backup_file}")
            return lead_id
        
    except Exception as e:
        print(f"❌ Lead record creation error: {e}")
        return ""


def get_leads_data(excel_file_path: str, status_filter: str = None, broker_filter: str = None) -> List[Dict]:
    """Get leads data with optional filters"""
    try:
        print(f"📊 [LEADS DATA] Checking Excel file: {excel_file_path}")
        
        if not os.path.exists(excel_file_path):
            print(f"📊 [LEADS DATA] Excel file doesn't exist, initializing...")
            initialize_excel_file(excel_file_path)
            
            # Return empty list if file was just created
            if not os.path.exists(excel_file_path):
                print(f"❌ [LEADS DATA] Failed to create Excel file")
                return []
        
        print(f"📊 [LEADS DATA] Reading Excel file...")
        df = pd.read_excel(excel_file_path)
        print(f"📊 [LEADS DATA] Read {len(df)} rows from Excel")
        
        if status_filter:
            df = df[df['Status'] == status_filter]
            print(f"📊 [LEADS DATA] Filtered by status '{status_filter}': {len(df)} rows")
            
        if broker_filter:
            df = df[df['Assigned Broker ID'] == broker_filter]
            print(f"📊 [LEADS DATA] Filtered by broker '{broker_filter}': {len(df)} rows")
        
        # Convert to dict and handle NaN values
        leads = df.fillna('').to_dict('records')
        print(f"📊 [LEADS DATA] Returning {len(leads)} leads")
        
        return leads
        
    except Exception as e:
        print(f"❌ Error reading leads data: {e}")
        import traceback
        traceback.print_exc()
        return []


def update_lead_status(excel_file_path: str, lead_id: str, new_status: str, notes: str = "") -> bool:
    """Update lead status in Excel file"""
    try:
        if not os.path.exists(excel_file_path):
            print(f"❌ Excel file not found: {excel_file_path}")
            return False
            
        df = pd.read_excel(excel_file_path)
        lead_index = df[df['Lead ID'] == lead_id].index
        
        if not lead_index.empty:
            df.loc[lead_index, 'Status'] = new_status
            if notes:
                df.loc[lead_index, 'Notes'] = notes
            
            df.to_excel(excel_file_path, index=False)
            print(f"✅ Lead {lead_id} status updated to: {new_status}")
            return True
        else:
            print(f"❌ Lead {lead_id} not found in Excel file")
            return False
            
    except Exception as e:
        print(f"❌ Lead status update error: {e}")
        return False


def manual_assign_broker(excel_file_path: str, lead_id: str, broker_id: str, broker_name: str, broker_email: str, manager_reason: str = "") -> Dict:
    """Manual broker assignment override by manager"""
    try:
        # Check if lead exists
        leads = get_leads_data(excel_file_path)
        lead = next((l for l in leads if l.get('Lead ID') == lead_id), None)
        if not lead:
            return {"success": False, "error": f"Lead {lead_id} not found"}
        
        # Update lead with new broker assignment
        try:
            df = pd.read_excel(excel_file_path)
            lead_index = df[df['Lead ID'] == lead_id].index
            
            if not lead_index.empty:
                df.loc[lead_index, 'Assigned Broker ID'] = broker_id
                df.loc[lead_index, 'Assigned Broker Name'] = broker_name
                df.loc[lead_index, 'Assigned Broker Email'] = broker_email
                df.loc[lead_index, 'Status'] = 'Manually Assigned'
                
                current_notes = df.loc[lead_index, 'Notes'].iloc[0] if pd.notna(df.loc[lead_index, 'Notes'].iloc[0]) else ""
                new_note = f"Manual assignment by manager: {broker_name} ({broker_id}). Reason: {manager_reason}"
                updated_notes = f"{current_notes}\n{new_note}".strip()
                df.loc[lead_index, 'Notes'] = updated_notes
                
                df.to_excel(excel_file_path, index=False)
                
                print(f"✅ Lead {lead_id} manually assigned to broker {broker_name}")
                return {
                    "success": True, 
                    "message": f"Lead {lead_id} successfully assigned to {broker_name}",
                    "lead_id": lead_id,
                    "broker_id": broker_id,
                    "broker_name": broker_name,
                    "reason": manager_reason
                }
            else:
                return {"success": False, "error": f"Lead {lead_id} not found in Excel"}
        
        except Exception as excel_error:
            print(f"❌ Excel update error: {excel_error}")
            return {"success": False, "error": f"Failed to update Excel: {str(excel_error)}"}
        
    except Exception as e:
        print(f"❌ Manual assignment error: {e}")
        return {"success": False, "error": f"Manual assignment failed: {str(e)}"}