#!/usr/bin/env python3
"""
Image Resizer for 360° Product Viewer
Creates optimized "light" versions of images for fast loading
"""

import os
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
    exit(1)

# Configuration
SOURCE_DIR = "3D-Images"
OUTPUT_DIR = "3D-Images/light"
TARGET_WIDTH = 2000  # Maximum width for light images
QUALITY = 85  # Image quality (1-100) - used for JPEG/WebP
WEBP_QUALITY = 85  # WebP quality (1-100)

def create_light_images():
    """Create resized light versions of all images"""
    
    source_path = Path(SOURCE_DIR)
    output_path = Path(OUTPUT_DIR)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Get all image files (excluding the light folder itself)
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']:
        for file in source_path.glob(ext):
            # Skip if file is in the light subfolder
            if 'light' not in file.parts:
                image_files.append(file)
    
    if not image_files:
        print(f"\nNo images found in {SOURCE_DIR}/")
        print("Please make sure your images are in the 3D-Images folder")
        return
    
    print("=" * 60)
    print(f"Creating Light Images for 360° Viewer")
    print("=" * 60)
    print(f"\nSource folder: {SOURCE_DIR}/")
    print(f"Output folder: {OUTPUT_DIR}/")
    print(f"Target width: {TARGET_WIDTH}px")
    print(f"Quality: {QUALITY}%")
    print(f"Images found: {len(image_files)}")
    print("\nProcessing...\n")
    
    success_count = 0
    error_count = 0
    
    for i, img_file in enumerate(image_files, 1):
        try:
            # Open image
            with Image.open(img_file) as img:
                # Get original dimensions
                orig_width, orig_height = img.size
                
                # Calculate new dimensions (maintain aspect ratio)
                if orig_width > TARGET_WIDTH:
                    ratio = TARGET_WIDTH / orig_width
                    new_width = TARGET_WIDTH
                    new_height = int(orig_height * ratio)
                else:
                    # Image is already smaller, just copy with optimization
                    new_width = orig_width
                    new_height = orig_height
                
                # Resize image
                if orig_width > TARGET_WIDTH:
                    resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                else:
                    resized = img
                
                # Always save as WebP format for optimal compression
                # Convert RGBA to RGB if necessary (WebP supports both)
                if resized.mode == 'RGBA':
                    # Keep RGBA for WebP (supports transparency)
                    pass
                elif resized.mode not in ['RGB', 'RGBA']:
                    # Convert other modes to RGB
                    resized = resized.convert('RGB')
                
                # Save as WebP with optimized quality
                output_file = output_path / (img_file.stem + '.webp')
                resized.save(output_file, 'WEBP', quality=WEBP_QUALITY, method=6)
                
                # Calculate file sizes
                orig_size = img_file.stat().st_size / 1024  # KB
                new_size = output_file.stat().st_size / 1024  # KB
                reduction = ((orig_size - new_size) / orig_size * 100) if orig_size > 0 else 0
                
                print(f"[{i}/{len(image_files)}] {img_file.name}")
                print(f"  {orig_width}x{orig_height} → {new_width}x{new_height}")
                print(f"  {orig_size:.1f}KB → {new_size:.1f}KB (-{reduction:.1f}%)")
                
                success_count += 1
                
        except Exception as e:
            print(f"[{i}/{len(image_files)}] ERROR: {img_file.name}")
            print(f"  {str(e)}")
            error_count += 1
    
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"\n✓ Successfully processed: {success_count} images")
    if error_count > 0:
        print(f"✗ Errors: {error_count} images")
    print(f"\nLight images saved to: {OUTPUT_DIR}/")
    print("\nYou can now refresh your browser to use the new viewer!")
    print("=" * 60)

if __name__ == "__main__":
    create_light_images()


