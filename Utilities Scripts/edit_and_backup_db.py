import os
import sys
import json
import random
from datetime import datetime
from pathlib import Path
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: 'supabase' library not found. Please install it using: pip install supabase")
    sys.exit(1)

# =================================================================
# SETTINGS AND PARAMETERS
# =================================================================
SUPABASE_URL = "https://exxkpokuewxvpixrmofo.supabase.co"
SUPABASE_KEY = "sb_publishable_WSIAr3oQA_EwTO-L1D9baA_MfRYeBCX"
TABLE_NAME = "Units"

BASE_DIR = Path(r"D:\((_atWork_))\360-Viewer-Project\360-Viewer")
BACKUP_DIR = BASE_DIR / "Database Backups"

# =================================================================

def get_primary_key(supabase: Client):
    """Determine the primary key/identifier column for updates."""
    try:
        response = supabase.table(TABLE_NAME).select("*").limit(1).execute()
        if not response.data:
            return None
        
        row = response.data[0]
        keys = row.keys()
        
        # Priority order for ID columns
        candidates = ['id', 'ID', 'uuid', 'Unit Number', 'unit_number', 'ClientID']
        for cand in candidates:
            if cand in keys:
                return cand
        
        return list(keys)[0] # Fallback to first column
    except Exception as e:
        print(f"Error resolving primary key column: {e}")
        return None

def edit_database_with_demo_data(supabase: Client, units: list, pk_col: str):
    """Fills missing information in the database with demo data."""
    print("Editing database with demo data...")
    
    sub_types = ["Apartment", "Studio", "Penthouse", "Duplex"]
    orientations = ["North", "South", "East", "West", "North-East", "South-West"]
    
    updated_count = 0
    
    for unit in units:
        updates = {}
        
        # Fill Rooms/Bedrooms
        if not unit.get('Bedrooms') and not unit.get('Rooms') and not unit.get('Number of Rooms'):
            # Try to determine which column is used or default to 'Bedrooms'
            col = 'Bedrooms' if 'Bedrooms' in unit else 'Rooms'
            updates[col] = str(random.randint(1, 4))
            
        # Fill Sub-type
        if not unit.get('Sub-type') and not unit.get('Type') and not unit.get('Property Type'):
            col = 'Sub-type' if 'Sub-type' in unit else 'Type'
            updates[col] = random.choice(sub_types)
            
        # Fill Interior Area
        if not unit.get('Interior Area'):
            updates['Interior Area'] = f"{random.randint(45, 150)} sqm"
            
        # Fill Balcony Area / Terrace Area
        if not unit.get('Balcony Area') and not unit.get('Surface Exterior'):
            col = 'Balcony Area' if 'Balcony Area' in unit else 'Surface Exterior'
            updates[col] = f"{random.randint(5, 30)} sqm"
            
        if not unit.get('Terrace Area'):
            updates['Terrace Area'] = f"{random.randint(0, 20)} sqm"
            
        # Fill Orientation
        if not unit.get('Orientation'):
            updates['Orientation'] = random.choice(orientations)
            
        # Fill Status (if applicable)
        if 'Status' in unit and not unit.get('Status'):
            updates['Status'] = random.choice(["Available", "Reserved", "Sold"])
            
        if updates:
            pk_val = unit.get(pk_col)
            if pk_val:
                print(f"  Updating Unit [{pk_val}] with: {updates}")
                try:
                    supabase.table(TABLE_NAME).update(updates).eq(pk_col, pk_val).execute()
                    updated_count += 1
                except Exception as e:
                    print(f"  Error updating Unit [{pk_val}]: {e}")
                    
    print(f"Finished editing. Updated {updated_count} units.")

def backup_database(supabase: Client):
    """Fetches all rows and saves them to a JSON file."""
    print("Making a backup of the database...")
    
    if not BACKUP_DIR.exists():
        print(f"Creating backup directory: {BACKUP_DIR}")
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        
    try:
        response = supabase.table(TABLE_NAME).select("*").execute()
        units = response.data
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = BACKUP_DIR / f"{TABLE_NAME}_backup_{timestamp}.json"
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(units, f, indent=4)
            
        print(f"Backup successfully saved to: {backup_file}")
        print(f"Total records backed up: {len(units)}")
        
    except Exception as e:
        print(f"Error creating backup: {e}")

def main():
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("Fetching existing data...")
    response = supabase.table(TABLE_NAME).select("*").execute()
    units = response.data
    
    if not units:
        print("No units found in database.")
        return
        
    pk_col = get_primary_key(supabase)
    if not pk_col:
        print("Error: Could not determine primary key column. Cannot perform updates.")
        return
        
    print(f"Using '{pk_col}' as primary identifier for updates.")
    
    # 1. Edit the database
    edit_database_with_demo_data(supabase, units, pk_col)
    
    # 2. Make a backup afterwards
    backup_database(supabase)
    
    print("-" * 50)
    print("Process completed.")

if __name__ == "__main__":
    main()
