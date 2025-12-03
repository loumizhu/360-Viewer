#!/usr/bin/env python3
"""
Remove debug console.log statements while keeping error logging
"""
import re

def clean_file(filename):
    """Remove console.log lines but keep console.error and console.warn"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        cleaned_lines = []
        removed_count = 0
        
        for line in lines:
            stripped = line.strip()
            
            # Keep console.error and console.warn
            if 'console.error' in line or 'console.warn' in line:
                cleaned_lines.append(line)
                continue
            
            # Remove standalone console.log lines (not in comments)
            if 'console.log' in line and not stripped.startswith('//') and not stripped.startswith('*'):
                # Check if line is ONLY a console.log statement
                if re.match(r'^\s*console\.log\(.*\);?\s*$', line):
                    removed_count += 1
                    continue
            
            cleaned_lines.append(line)
        
        # Write back
        with open(filename, 'w', encoding='utf-8') as f:
            f.writelines(cleaned_lines)
        
        print(f"✓ {filename}: Removed {removed_count} console.log statements")
        return removed_count
    except Exception as e:
        print(f"✗ {filename}: Error - {e}")
        return 0

# Clean files
files = [
    'viewer.js',
    'viewer3d.js',
    'ui-settings.js',
    'settings.js',
    'ui-interactions.js',
    'plan-panel-interactions.js'
]

total_removed = 0
for f in files:
    total_removed += clean_file(f)

print(f"\nTotal: Removed {total_removed} console.log statements")
print("Kept: console.error and console.warn")
