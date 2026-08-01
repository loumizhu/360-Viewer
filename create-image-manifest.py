#!/usr/bin/env python3
"""
Generate image-manifest.json for 360° Image Viewer
Scans 3D-Images folders, 3D-Plans, Photos, and 2D-Plans folders to create a manifest file for faster, reliable image loading.
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
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.svg', '.JPG', '.JPEG', '.PNG', '.WEBP', '.SVG'}
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

def get_3d_model(directory: Path) -> str:
    """Find the first .glb or .gltf file in the directory"""
    if not directory.exists():
        return None
        
    for file in directory.iterdir():
        if file.is_file() and file.suffix.lower() in {'.glb', '.gltf'}:
            return file.name
    return None

def scan_extra_assets(directory: Path, prefix_path: str, manifest: Dict):
    """
    Scan 2D-Plans, 3D-Plans, and Photos folders for specific units and map them.
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.svg', '.JPG', '.JPEG', '.PNG', '.WEBP', '.SVG'}
    prefix = f"{prefix_path}/" if prefix_path else ""
    
    # Initialize dictionary fields in manifest if not present
    if "plans_3d" not in manifest:
        manifest["plans_3d"] = {}
    if "photos" not in manifest:
        manifest["photos"] = {}
    if "plans_2d" not in manifest:
        manifest["plans_2d"] = {}
    if "plans_3d_static" not in manifest:
        manifest["plans_3d_static"] = {}
        
    # 1. Scan 2D-Plans
    plan2d_dir = None
    for item in directory.iterdir():
        if item.is_dir() and item.name.lower() in ['2d-plans', 'plan 2d', 'plan2d', 'plans 2d', 'plans2d']:
            plan2d_dir = item
            break
            
    if plan2d_dir:
        for file in plan2d_dir.iterdir():
            if file.is_file() and file.suffix in image_extensions:
                unit_name = file.stem
                manifest["plans_2d"][unit_name] = f"{prefix}{plan2d_dir.name}/{file.name}".replace('\\', '/').replace('//', '/')
                
    # 2. Scan 3D-Plans
    axo_dir = None
    for item in directory.iterdir():
        if item.is_dir() and item.name.lower() in ['3d-plans', 'axonometrics', 'axonometric', 'plans 3d', 'plans3d', 'plan 3d', 'plan3d']:
            axo_dir = item
            break
            
    if axo_dir:
        for item in axo_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                unit_name = item.name
                frames = []
                for file in item.iterdir():
                    if file.is_file() and file.suffix in image_extensions:
                        frames.append(f"{prefix}{axo_dir.name}/{unit_name}/{file.name}".replace('\\', '/').replace('//', '/'))
                frames.sort(key=natural_sort_key)
                if frames:
                    manifest["plans_3d"][unit_name] = frames
            elif item.is_file() and item.suffix in image_extensions:
                unit_name = item.stem
                manifest["plans_3d_static"][unit_name] = f"{prefix}{axo_dir.name}/{item.name}".replace('\\', '/').replace('//', '/')
                
    # 3. Scan Photos
    photos_dir = None
    for item in directory.iterdir():
        if item.is_dir() and item.name.lower() in ['photos', 'photo', 'images', 'image', 'unit photos', 'unit images']:
            photos_dir = item
            break
            
    if photos_dir:
        for item in photos_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                unit_name = item.name
                pics = []
                for file in item.iterdir():
                    if file.is_file() and file.suffix in image_extensions:
                        pics.append(f"{prefix}{photos_dir.name}/{unit_name}/{file.name}".replace('\\', '/').replace('//', '/'))
                pics.sort(key=natural_sort_key)
                if pics:
                    manifest["photos"][unit_name] = pics

    # 4. Scan 360-Virtual-Visit
    vv_dir = None
    for item in directory.iterdir():
        if item.is_dir() and item.name.lower() in ['360-virtual-visit', '360 virtual visit', 'virtual-visit', 'virtual visit', '360_virtual_visit']:
            vv_dir = item
            break
            
    if vv_dir:
        vv_pics = []
        for file in vv_dir.iterdir():
            if file.is_file() and file.suffix in image_extensions:
                vv_pics.append(f"{prefix}{vv_dir.name}/{file.name}".replace('\\', '/').replace('//', '/'))
        vv_pics.sort(key=natural_sort_key)
        if vv_pics:
            manifest["virtual_visit"] = vv_pics

def create_manifest_for_client(client_folder: Path) -> Dict:
    """Create manifest for a specific client folder"""
    images_path = client_folder / "3D-Images"
    light_path = images_path / "light"
    
    full_paths = []
    light_paths = []
    
    if images_path.exists():
        # Get all images
        full_images = get_image_files(images_path)
        light_images = get_image_files(light_path)
        
        # Create maps for matching
        full_map = {}
        light_map = {}
        
        # Map full images (exclude light folder files)
        for img in full_images:
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
        for base in all_bases_sorted:
            full_img = full_map.get(base)
            light_img = light_map.get(base)
            
            if full_img:
                full_paths.append(f"{client_name}/3D-Images/{full_img}".replace('\\', '/'))
            elif light_img:
                full_paths.append(f"{client_name}/3D-Images/light/{light_img}".replace('\\', '/'))
            
            if light_img:
                light_paths.append(f"{client_name}/3D-Images/light/{light_img}".replace('\\', '/'))
            elif full_img:
                light_paths.append(f"{client_name}/3D-Images/{full_img}".replace('\\', '/'))
    
    # Check for 3D model
    model_dir = client_folder / "3D"
    model_file = get_3d_model(model_dir)
    model_path = None
    if model_file:
        model_path = f"{client_folder.name}/3D/{model_file}".replace('\\', '/')
    
    manifest = {
        "light": light_paths,
        "full": full_paths,
        "model3d": model_path,
        "plans_3d": {},
        "photos": {},
        "plans_2d": {},
        "plans_3d_static": {}
    }
    
    # Scan extra assets
    scan_extra_assets(client_folder, client_folder.name, manifest)
    
    return manifest

def create_root_manifest(root_path: Path) -> Dict:
    """Create manifest for root 3D-Images folder (no client folder)"""
    images_path = root_path / "3D-Images"
    light_path = images_path / "light"
    
    full_paths = []
    light_paths = []
    
    if images_path.exists():
        # Get all images
        full_images = get_image_files(images_path)
        light_images = get_image_files(light_path)
        
        # Create maps for matching
        full_map = {}
        light_map = {}
        
        # Map full images (exclude light folder files)
        for img in full_images:
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
        for base in all_bases_sorted:
            full_img = full_map.get(base)
            light_img = light_map.get(base)
            
            if full_img:
                full_paths.append(f"3D-Images/{full_img}".replace('\\', '/'))
            elif light_img:
                full_paths.append(f"3D-Images/light/{light_img}".replace('\\', '/'))
            
            if light_img:
                light_paths.append(f"3D-Images/light/{light_img}".replace('\\', '/'))
            elif full_img:
                light_paths.append(f"3D-Images/{full_img}".replace('\\', '/'))
    
    # Check for 3D model
    model_dir = root_path / "3D"
    model_file = get_3d_model(model_dir)
    model_path = None
    if model_file:
        model_path = f"3D/{model_file}".replace('\\', '/')
        
    manifest = {
        "light": light_paths,
        "full": full_paths,
        "model3d": model_path,
        "plans_3d": {},
        "photos": {},
        "plans_2d": {},
        "plans_3d_static": {}
    }
    
    # Scan extra assets
    scan_extra_assets(root_path, "", manifest)
    
    return manifest

def main():
    """Main function to generate manifests"""
    script_dir = Path(__file__).parent
    root_path = script_dir
    
    print("Generating comprehensive image-manifest.json files...")
    print(f"Working directory: {root_path}\n")
    
    manifests_created = 0
    
    # Check for root 3D-Images folder
    root_images = root_path / "3D-Images"
    if root_images.exists() or (root_path / "3D-Plans").exists() or (root_path / "Axonometrics").exists() or (root_path / "Photos").exists() or (root_path / "2D-Plans").exists() or (root_path / "Plan 2D").exists():
        print("Creating root manifest (for no clientID)...")
        manifest = create_root_manifest(root_path)
        if manifest:
            manifest_path = root_path / "image-manifest.json"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            print(f"  [OK] Created: {manifest_path}")
            print(f"    - {len(manifest['light'])} light images")
            print(f"    - {len(manifest['full'])} full images")
            print(f"    - {len(manifest['plans_2d'])} 2D plans mapped")
            print(f"    - {len(manifest['plans_3d'])} 3D plan sequences mapped")
            print(f"    - {len(manifest['plans_3d_static'])} 3D static plans mapped")
            print(f"    - {len(manifest['photos'])} photo galleries mapped")
            if manifest.get('model3d'):
                print(f"    - Found 3D Model: {manifest['model3d']}")
            print("")
            manifests_created += 1
    
    # Check for client folders
    for item in root_path.iterdir():
        if item.is_dir() and not item.name.startswith('.') and item.name not in ['3D-Images', '3D', 'img', 'js', 'chrome-devtools-mcp', '.git', '.vscode', '__pycache__', 'Utilities Scripts', 'Database Backups']:
            # Create manifest for this client folder if it has any relevant folders
            if (item / "3D-Images").exists() or (item / "3D-Plans").exists() or (item / "Axonometrics").exists() or (item / "Photos").exists() or (item / "2D-Plans").exists() or (item / "Plan 2D").exists():
                print(f"Creating manifest for client: {item.name}...")
                manifest = create_manifest_for_client(item)
                if manifest:
                    # Write to client folder
                    manifest_path = item / "image-manifest.json"
                    with open(manifest_path, 'w', encoding='utf-8') as f:
                        json.dump(manifest, f, indent=2, ensure_ascii=False)
                    print(f"  [OK] Created: {manifest_path}")
                    print(f"    - {len(manifest['light'])} light images")
                    print(f"    - {len(manifest['full'])} full images")
                    print(f"    - {len(manifest['plans_2d'])} 2D plans mapped")
                    print(f"    - {len(manifest['plans_3d'])} 3D plan sequences mapped")
                    print(f"    - {len(manifest['plans_3d_static'])} 3D static plans mapped")
                    print(f"    - {len(manifest['photos'])} photo galleries mapped")
                    if manifest.get('model3d'):
                        print(f"    - Found 3D Model: {manifest['model3d']}")
                    print("")
                    manifests_created += 1
    
    if manifests_created == 0:
        print("No folders found to index. Make sure you have at least one client folder or asset folder.")
    else:
        print(f"[OK] Successfully created {manifests_created} manifest file(s)")

if __name__ == "__main__":
    main()
