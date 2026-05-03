import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
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

# Base Path
BASE_DIR = Path(r"D:\((_atWork_))\360-Viewer-Project\360-Viewer")
CLIENT_ID = "CLT695425"

# Define Multiple Generation Tasks
TASKS = [
    {
        "name": "Plan 2D",
        "template": BASE_DIR / CLIENT_ID / "Plan 2D" / "Template.jpg",
        "output": BASE_DIR / CLIENT_ID / "Plan 2D"
    },
    {
        "name": "Axonometrics",
        "template": BASE_DIR / CLIENT_ID / "Axonometrics" / "Template.jpg",
        "output": BASE_DIR / CLIENT_ID / "Axonometrics"
    }
]

# Label Visual Settings
LABEL_BG_COLOR = (0, 0, 0)      # Black
LABEL_TEXT_COLOR = (255, 255, 255) # White
LABEL_PADDING = 10
FONT_SIZE = 40  # Adjust based on image resolution
# =================================================================

def get_unit_column_name(supabase: Client):
    """Try to find the column that holds the unit identifier"""
    try:
        response = supabase.table(TABLE_NAME).select("*").limit(1).execute()
        if not response.data:
            return None
        
        row = response.data[0]
        keys = row.keys()
        
        # Priority order for unit identity columns
        candidates = ['Unit Number', 'Property Name', 'unit_number', 'unit', 'name', 'code']
        for cand in candidates:
            if cand in keys:
                return cand
        
        # Fallback to first column that looks like a unit string
        for key, value in row.items():
            if isinstance(value, str) and len(value) < 10:
                return key
                
        return None
    except Exception as e:
        print(f"Error resolving column: {e}")
        return None

def process_task(supabase: Client, task: dict, column_name: str, units: list):
    """Generate images for a specific task (folder/template pair)"""
    print(f"\n>>> Processing Task: {task['name']}")
    
    template_path = task['template']
    output_folder = task['output']
    
    if not template_path.exists():
        print(f"Error: Template image not found at {template_path}")
        return
    
    if not output_folder.exists():
        print(f"Creating output folder: {output_folder}")
        output_folder.mkdir(parents=True, exist_ok=True)
    
    created_count = 0
    skipped_count = 0
    
    for unit in units:
        unit_name = str(unit.get(column_name))
        if not unit_name or unit_name == 'None':
            continue
            
        file_name = f"{unit_name}.jpg"
        file_path = output_folder / file_name
        
        if file_path.exists():
            skipped_count += 1
            continue
            
        print(f"  Generating: {file_name}")
        
        try:
            # Open template
            with Image.open(template_path) as img:
                draw = ImageDraw.Draw(img)
                
                # Load font
                try:
                    # Try to find a standard system font
                    font = ImageFont.truetype("arial.ttf", FONT_SIZE)
                except:
                    font = ImageFont.load_default()
                
                # Calculate text size for label box
                bbox = draw.textbbox((0, 0), unit_name, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                # Position: Top Right
                img_width, img_height = img.size
                
                rect_x1 = img_width - text_width - (LABEL_PADDING * 2) - 20
                rect_y1 = 20
                rect_x2 = img_width - 20
                rect_y2 = rect_y1 + text_height + (LABEL_PADDING * 2)
                
                # Draw Background Box
                draw.rectangle([rect_x1, rect_y1, rect_x2, rect_y2], fill=LABEL_BG_COLOR)
                
                # Draw Text
                text_x = rect_x1 + LABEL_PADDING
                text_y = rect_y1 + LABEL_PADDING - bbox[1]
                
                draw.text((text_x, text_y), unit_name, font=font, fill=LABEL_TEXT_COLOR)
                
                # Save as JPG
                img.convert('RGB').save(file_path, "JPEG", quality=90)
                created_count += 1
                
        except Exception as e:
            print(f"Error processing unit {unit_name} for {task['name']}: {e}")
            
    print(f"Done: {created_count} created, {skipped_count} skipped.")

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
    
    # 3. Fetch Units (once for all tasks)
    print("Fetching unit list...")
    response = supabase.table(TABLE_NAME).select(f'"{column_name}"').execute()
    units = response.data
    
    if not units:
        print("No units found in database.")
        return
    
    print(f"Found {len(units)} units.")
    
    # 4. Process all tasks
    for task in TASKS:
        process_task(supabase, task, column_name, units)
            
    print("-" * 50)
    print("All tasks completed.")

if __name__ == "__main__":
    main()
