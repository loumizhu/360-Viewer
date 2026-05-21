import os
import sys
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: 'supabase' library not found.")
    sys.exit(1)

# =================================================================
# SETTINGS
# =================================================================
SUPABASE_URL = "https://exxkpokuewxvpixrmofo.supabase.co"
SUPABASE_KEY = "sb_publishable_WSIAr3oQA_EwTO-L1D9baA_MfRYeBCX"
TABLE_NAME = "Units"
BASE_DIR = Path(r"D:\((_atWork_))\360-Viewer-Project\360-Viewer")
CLIENT_ID = "CLT695425"

TEMPLATE_DIR = BASE_DIR / CLIENT_ID / "3D-Plans" / "Template"
OUTPUT_DIR = BASE_DIR / CLIENT_ID / "3D-Plans"

# Text / watermark settings
FONT_SIZE_DEMO = 80
FONT_SIZE_UNIT = 40
LABEL_BG_COLOR = (0, 0, 0)
LABEL_TEXT_COLOR = (255, 255, 255)
LABEL_PADDING = 10

def get_unit_column_name(supabase: Client):
    try:
        response = supabase.table(TABLE_NAME).select("*").limit(1).execute()
        if not response.data: return None
        row = response.data[0]
        keys = row.keys()
        for cand in ['Unit Number', 'Property Name', 'unit_number', 'unit', 'name', 'code']:
            if cand in keys: return cand
        for key, value in row.items():
            if isinstance(value, str) and len(value) < 10: return key
        return None
    except: return None

def create_demo_watermark(size, font):
    """Creates a transparent image with repeating 'demo' text"""
    # Create a slightly larger image to allow for rotation without cutting corners
    diag = int(math.sqrt(size[0]**2 + size[1]**2))
    watermark = Image.new('RGBA', (diag, diag), (0, 0, 0, 0))
    draw = ImageDraw.Draw(watermark)
    
    text = "demo  " * (diag // 100 + 5)
    
    # Calculate line height
    bbox = draw.textbbox((0, 0), "demo", font=font)
    line_height = bbox[3] - bbox[1] + 100 # spacing between lines
    
    for y in range(0, diag, line_height):
        # alternate offset for a nicer pattern
        offset = (y // line_height % 2) * 100
        draw.text((offset, y), text, font=font, fill=(255, 255, 255, 80)) # White, semi-transparent
        
    # Rotate and crop to original size
    watermark = watermark.rotate(45, expand=True, resample=Image.BICUBIC)
    
    # Crop the center
    wx, wy = watermark.size
    left = (wx - size[0]) // 2
    top = (wy - size[1]) // 2
    watermark = watermark.crop((left, top, left + size[0], top + size[1]))
    
    return watermark

def main():
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    column_name = get_unit_column_name(supabase)
    if not column_name:
        print("Error resolving column name")
        return
        
    print("Fetching unit list...")
    response = supabase.table(TABLE_NAME).select(f'"{column_name}"').execute()
    units = response.data
    
    if not units:
        print("No units found")
        return
        
    if not TEMPLATE_DIR.exists():
        print(f"Error: Template directory not found at {TEMPLATE_DIR}")
        return
        
    template_files = sorted(list(TEMPLATE_DIR.glob("*.jpg")))
    if not template_files:
        print("No template files found.")
        return
        
    try:
        font_unit = ImageFont.truetype("arial.ttf", FONT_SIZE_UNIT)
        font_demo = ImageFont.truetype("arial.ttf", FONT_SIZE_DEMO)
    except:
        print("Warning: arial.ttf not found, using default font.")
        font_unit = ImageFont.load_default()
        font_demo = ImageFont.load_default()
        
    watermarks = {}
    
    for unit in units:
        unit_name = str(unit.get(column_name))
        if not unit_name or unit_name == 'None':
            continue
            
        unit_dir = OUTPUT_DIR / unit_name
        unit_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Processing unit {unit_name}...")
        
        for i, tpl_file in enumerate(template_files):
            # new filename: e.g. A201_0000.jpg
            new_filename = f"{unit_name}_{str(i).zfill(4)}.jpg"
            out_file = unit_dir / new_filename
            
            if out_file.exists():
                continue
                
            with Image.open(tpl_file).convert("RGBA") as img:
                # Apply watermark
                if img.size not in watermarks:
                    watermarks[img.size] = create_demo_watermark(img.size, font_demo)
                
                # Composite watermark
                img = Image.alpha_composite(img, watermarks[img.size])
                
                # Draw unit name
                draw = ImageDraw.Draw(img)
                bbox = draw.textbbox((0, 0), unit_name, font=font_unit)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                img_width, img_height = img.size
                rect_x1 = img_width - text_width - (LABEL_PADDING * 2) - 20
                rect_y1 = 20
                rect_x2 = img_width - 20
                rect_y2 = rect_y1 + text_height + (LABEL_PADDING * 2)
                
                draw.rectangle([rect_x1, rect_y1, rect_x2, rect_y2], fill=LABEL_BG_COLOR + (255,))
                text_x = rect_x1 + LABEL_PADDING
                text_y = rect_y1 + LABEL_PADDING - bbox[1]
                draw.text((text_x, text_y), unit_name, font=font_unit, fill=LABEL_TEXT_COLOR + (255,))
                
                img.convert('RGB').save(out_file, "JPEG", quality=90)
                
    print("Done generating axonometrics.")

if __name__ == "__main__":
    main()
