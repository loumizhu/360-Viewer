import os
import sys
import shutil
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

# Paths
BASE_DIR = Path(r"D:\((_atWork_))\360-Viewer-Project\360-Viewer")
CLIENT_ID = "CLT695425"
AXONOMETRICS_DIR = BASE_DIR / CLIENT_ID / "3D-Plans"
TEMPLATE_DIR = AXONOMETRICS_DIR / "Template"
# =================================================================

def get_unit_column_name(supabase: Client):
    """Try to find the column that holds the unit identifier"""
    try:
        response = supabase.table(TABLE_NAME).select("*").limit(1).execute()
        if not response.data:
            return None
        
        row = response.data[0]
        keys = row.keys()
        
        candidates = ['Unit Number', 'Property Name', 'unit_number', 'unit', 'name', 'code']
        for cand in candidates:
            if cand in keys:
                return cand
        
        for key, value in row.items():
            if isinstance(value, str) and len(value) < 10:
                return key
        return None
    except Exception as e:
        print(f"Error resolving column: {e}")
        return None

def main():
    # 1. Initialize Supabase
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 2. Resolve Column Name
    column_name = get_unit_column_name(supabase)
    if not column_name:
        print(f"Error: Could not determine unit identifier column in table '{TABLE_NAME}'")
        return
    
    print(f"Using column '{column_name}' for unit names.")
    
    # 3. Fetch Units
    print("Fetching unit list...")
    response = supabase.table(TABLE_NAME).select(f'"{column_name}"').execute()
    units = response.data
    
    if not units:
        print("No units found in database.")
        return
    
    print(f"Found {len(units)} units.")
    
    # 4. Check Template Folder
    if not TEMPLATE_DIR.exists():
        print(f"Error: Template folder not found at {TEMPLATE_DIR}")
        return
    
    template_images = [f for f in TEMPLATE_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
    
    if not template_images:
        print(f"No images found in template folder: {TEMPLATE_DIR}")
        return
        
    print(f"Found {len(template_images)} template images.")
    
    # 5. Process each unit
    for unit in units:
        unit_name = str(unit.get(column_name))
        if not unit_name or unit_name == 'None':
            continue
            
        # We save directly in the 3D-Plans dir for plans
        all_exist = True
        for t_img in template_images:
            output_name = f"{unit_name}.{t_img.name.split('.')[-1]}"
            if not (AXONOMETRICS_DIR / output_name).exists():
                all_exist = False
                break
        
        if all_exist:
            print(f"Skipping {unit_name}: Plan image already exists.")
            continue
            
        print(f"Generating plan for: {unit_name}")
        
        for t_img in template_images:
            output_name = f"{unit_name}.{t_img.name.split('.')[-1]}"
            output_path = AXONOMETRICS_DIR / output_name
            if output_path.exists():
                continue
                
            try:
                shutil.copy2(t_img, output_path)
            except Exception as e:
                print(f"Error processing {t_img.name} for {unit_name}: {e}")
                
    print("-" * 50)
    print("All unit plans processed.")

if __name__ == "__main__":
    main()

