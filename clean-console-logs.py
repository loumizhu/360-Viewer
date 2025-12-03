#!/usr/bin/env python3
"""
Remove debug console.log statements while keeping error logging
"""
import re
import os

def clean_console_logs(file_path):
    """Remove debug console.log but keep console.error and console.warn"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip lines that are only console.log (debug statements)
        # Keep console.error, console.warn
        stripped = line.strip()
        
        # Keep error and warning logs
        if 'console.error' in line or 'console.warn' in line:
            cleaned_lines.append(line)
            continue
        
        # Remove debug console.log statements
        # But keep if it's in a comment
        if 'console.log' in line and not stripped.startswith('//') and not stripped.startswith('*'):
            # Check if this is a critical log (contains 'error', 'fail', 'not found', etc.)
            lower_line = line.lower()
            if any(keyword in lower_line for keyword in ['error', 'failed', 'fail to', 'not found', 'missing', 'invalid']):
                # Keep critical logs
                cleaned_lines.append(line)
            else:
                # Skip debug logs
                continue
        else:
            cleaned_lines.append(line)
    
    cleaned_content = '\n'.join(cleaned_lines)
    
    # Only write if content changed
    if cleaned_content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        return True
    return False

# Files to clean
files_to_clean = [
    'viewer.js',
    'viewer3d.js',
    'ui-settings.js',
    'settings.js',
    'ui-interactions.js',
    'plan-panel-interactions.js'
]

base_dir = os.path.dirname(os.path.abspath(__file__))
cleaned_count = 0

for filename in files_to_clean:
    file_path = os.path.join(base_dir, filename)
    if os.path.exists(file_path):
        if clean_console_logs(file_path):
            print(f"✓ Cleaned {filename}")
            cleaned_count += 1
        else:
            print(f"- No changes needed for {filename}")
    else:
        print(f"✗ File not found: {filename}")

print(f"\nCleaned {cleaned_count} file(s)")
print("Kept: console.error, console.warn, and critical error logs")
print("Removed: debug console.log statements")
