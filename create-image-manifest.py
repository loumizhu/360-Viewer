#!/usr/bin/env python3
"""
Generate image-manifest.json for 360° Image Viewer
Scans 3D-Images folders and creates a manifest file for faster image loading
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple

def natural_sort_key(text: str) -> List:
    """Generate a key for natural sorting (handles numbers correctly)"""
    def convert(text_part):
        return int(text_part) if text_part.isdigit() else text_part.lower()
    return [convert(c) for c in re.split(r'(\d+)', text)]

def get_image_files(directory: Path) -> List[str]:
    """Get all image files from a directory, sorted naturally"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'}
    images = []
    
    if not directory.exists():
        return images
    
    for file in directory.iterdir():
        if file.is_file() and file.suffix in image_extensions:
            images.append(file.name)
    
    # Sort naturally (handles numbers correctly)
    images.sort(key=natural_sort_key)
    return images

def get_base_name(filename: str) -> str:
    """Get base name without extension"""
    return Path(filename).stem

def create_manifest_for_client(client_folder: Path) -> Dict:
    """Create manifest for a specific client folder"""
    images_path = client_folder / "3D-Images"
    light_path = images_path / "light"
    
    if not images_path.exists():
        print(f"  Warning: {images_path} does not exist, skipping...")
        return None
    
    # Get all images
    full_images = get_image_files(images_path)
    light_images = get_image_files(light_path)
    
    # Create maps for matching
    full_map = {}
    light_map = {}
    
    # Map full images (exclude light folder files)
    for img in full_images:
        # Skip if it's actually in the light folder
        if (light_path / img).exists():
            continue
        base = get_base_name(img)
        if base not in full_map:
            full_map[base] = img
    
    # Map light images
    for img in light_images:
        base = get_base_name(img)
        if base not in light_map:
            light_map[base] = img
    
    # Get all unique base names and sort
    all_bases = set(full_map.keys()) | set(light_map.keys())
    all_bases_sorted = sorted(all_bases, key=natural_sort_key)
    
    # Build paths relative to client folder
    client_name = client_folder.name
    full_paths = []
    light_paths = []
    
    for base in all_bases_sorted:
        full_img = full_map.get(base)
        light_img = light_map.get(base)
        
        if full_img:
            full_paths.append(f"{client_name}/3D-Images/{full_img}")
        elif light_img:
            # Use light version if full doesn't exist
            full_paths.append(f"{client_name}/3D-Images/light/{light_img}")
        
        if light_img:
            light_paths.append(f"{client_name}/3D-Images/light/{light_img}")
        elif full_img:
            # Use full version if light doesn't exist
            light_paths.append(f"{client_name}/3D-Images/{full_img}")
    
    return {
        "light": light_paths,
        "full": full_paths
    }

def create_root_manifest(root_path: Path) -> Dict:
    """Create manifest for root 3D-Images folder (no client folder)"""
    images_path = root_path / "3D-Images"
    light_path = images_path / "light"
    
    if not images_path.exists():
        print(f"Warning: {images_path} does not exist")
        return None
    
    # Get all images
    full_images = get_image_files(images_path)
    light_images = get_image_files(light_path)
    
    # Create maps for matching
    full_map = {}
    light_map = {}
    
    # Map full images (exclude light folder files)
    for img in full_images:
        # Skip if it's actually in the light folder
        if (light_path / img).exists():
            continue
        base = get_base_name(img)
        if base not in full_map:
            full_map[base] = img
    
    # Map light images
    for img in light_images:
        base = get_base_name(img)
        if base not in light_map:
            light_map[base] = img
    
    # Get all unique base names and sort
    all_bases = set(full_map.keys()) | set(light_map.keys())
    all_bases_sorted = sorted(all_bases, key=natural_sort_key)
    
    # Build paths relative to root
    full_paths = []
    light_paths = []
    
    for base in all_bases_sorted:
        full_img = full_map.get(base)
        light_img = light_map.get(base)
        
        if full_img:
            full_paths.append(f"3D-Images/{full_img}")
        elif light_img:
            full_paths.append(f"3D-Images/light/{light_img}")
        
        if light_img:
            light_paths.append(f"3D-Images/light/{light_img}")
        elif full_img:
            light_paths.append(f"3D-Images/{full_img}")
    
    return {
        "light": light_paths,
        "full": full_paths
    }

def main():
    """Main function to generate manifests"""
    script_dir = Path(__file__).parent
    root_path = script_dir
    
    print("Generating image-manifest.json files...")
    print(f"Working directory: {root_path}\n")
    
    manifests_created = 0
    
    # Check for root 3D-Images folder
    root_images = root_path / "3D-Images"
    if root_images.exists():
        print("Creating root manifest (for no clientID)...")
        manifest = create_root_manifest(root_path)
        if manifest:
            manifest_path = root_path / "image-manifest.json"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            print(f"  [OK] Created: {manifest_path}")
            print(f"    - {len(manifest['light'])} light images")
            print(f"    - {len(manifest['full'])} full images\n")
            manifests_created += 1
    
    # Check for client folders
    for item in root_path.iterdir():
        if item.is_dir() and not item.name.startswith('.') and item.name not in ['3D-Images', '3D', 'img', 'js']:
            # Check if it has a 3D-Images folder
            images_path = item / "3D-Images"
            if images_path.exists():
                print(f"Creating manifest for client: {item.name}...")
                manifest = create_manifest_for_client(item)
                if manifest:
                    manifest_path = item / "image-manifest.json"
                    with open(manifest_path, 'w', encoding='utf-8') as f:
                        json.dump(manifest, f, indent=2, ensure_ascii=False)
                    print(f"  [OK] Created: {manifest_path}")
                    print(f"    - {len(manifest['light'])} light images")
                    print(f"    - {len(manifest['full'])} full images\n")
                    manifests_created += 1
    
    if manifests_created == 0:
        print("No 3D-Images folders found. Make sure you have:")
        print("  - 3D-Images/ folder in root, OR")
        print("  - CLIENT_ID/3D-Images/ folders for client-specific images")
    else:
        print(f"[OK] Successfully created {manifests_created} manifest file(s)")

if __name__ == "__main__":
    main()

