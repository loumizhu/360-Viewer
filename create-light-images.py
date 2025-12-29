#!/usr/bin/env python3
"""
Image Resizer for 360° Product Viewer
Creates optimized "light" (1280px) and "medium" (1920px) versions of images
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("=" * 60)
    print("ERROR: Pillow (PIL) is not installed")
    print("=" * 60)
    print("\nPlease install it with:")
    print("  pip install Pillow")
    print("\nOr:")
    print("  python -m pip install Pillow")
    print("=" * 60)
    # Don't exit yet so we can check if it's just meant to show help
    # But usually we need PIL.
    exit(1)

# Configuration
LIGHT_WIDTH = 1280
MEDIUM_WIDTH = 1920
QUALITY = 85
WEBP_QUALITY = 85

def process_images(client_dir="."):
    """Create resized versions of all images in the client's 3D-Images folder"""
    
    # Handle client directory path
    base_path = Path(client_dir)
    source_dir = base_path / "3D-Images"
    
    if not source_dir.exists():
        print(f"Error: Source directory not found: {source_dir}")
        return False

    print("=" * 60)
    print(f"Processing Images for: {client_dir}")
    print("=" * 60)

    # Output directories
    light_dir = source_dir / "light"
    medium_dir = source_dir / "medium"
    
    light_dir.mkdir(parents=True, exist_ok=True)
    medium_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all image files (excluding subfolders)
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']:
        for file in source_dir.glob(ext):
            if file.is_file():
                image_files.append(file)
    
    if not image_files:
        print(f"No images found in root of {source_dir}")
        return False
        
    print(f"Found {len(image_files)} source images.")
    print(f"Generating Light ({LIGHT_WIDTH}px) and Medium ({MEDIUM_WIDTH}px) versions...\n")
    
    success_count = 0
    error_count = 0
    
    for i, img_file in enumerate(image_files, 1):
        try:
            print(f"[{i}/{len(image_files)}] {img_file.name}")
            
            with Image.open(img_file) as img:
                orig_width, orig_height = img.size
                
                # --- PROCESS LIGHT ---
                light_file = light_dir / (img_file.stem + '.webp')
                if not light_file.exists():
                    if orig_width > LIGHT_WIDTH:
                        ratio = LIGHT_WIDTH / orig_width
                        new_h = int(orig_height * ratio)
                        resized_light = img.resize((LIGHT_WIDTH, new_h), Image.Resampling.LANCZOS)
                    else:
                        resized_light = img.copy()
                        
                    # Save (convert to RGB if needed, keep RGBA if valid)
                    if resized_light.mode not in ['RGB', 'RGBA']:
                        resized_light = resized_light.convert('RGB')
                        
                    resized_light.save(light_file, 'WEBP', quality=WEBP_QUALITY, method=6)
                    print(f"  -> Light: {orig_width}px -> {resized_light.width}px")
                else:
                    print(f"  -> Light: Skipped (Exists)")

                # --- PROCESS MEDIUM ---
                medium_file = medium_dir / (img_file.stem + '.webp')
                if not medium_file.exists():
                    if orig_width > MEDIUM_WIDTH:
                        ratio = MEDIUM_WIDTH / orig_width
                        new_h = int(orig_height * ratio)
                        resized_med = img.resize((MEDIUM_WIDTH, new_h), Image.Resampling.LANCZOS)
                    else:
                        resized_med = img.copy()
                        
                    if resized_med.mode not in ['RGB', 'RGBA']:
                        resized_med = resized_med.convert('RGB')
                        
                    resized_med.save(medium_file, 'WEBP', quality=WEBP_QUALITY, method=6)
                    print(f"  -> Medium: {orig_width}px -> {resized_med.width}px")
                else:
                    print(f"  -> Medium: Skipped (Exists)")
                    
                success_count += 1
                
        except Exception as e:
            print(f"  ERROR: {str(e)}")
            error_count += 1

    print("\n" + "=" * 60)
    print(f"Processed: {success_count} | Errors: {error_count}")
    print("=" * 60)
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        client_path = sys.argv[1]
    else:
        client_path = "."
        
    process_images(client_path)


