#!/usr/bin/env python3
"""
Add clearable prop to SqlEditor in WarehouseSqlQuery.vue
"""

import re

FILE_PATH = "/Users/viktor/Biz/console-components/src/components/WarehouseSqlQuery.vue"

# Read the file
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Backup
backup_path = FILE_PATH + '.backup2'
with open(backup_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"✓ Backup created: {backup_path}")

# Add clearable and remove the old clearable button if it exists
# Pattern to find SqlEditor component and add clearable
pattern = r'(<SqlEditor\s+ref="sqlTextarea"[^>]*min-height="200px")(\s*/?>)'

def add_clearable(match):
    before = match.group(1)
    after = match.group(2)
    if 'clearable' not in before:
        return before + '\n                      clearable' + after
    return match.group(0)

content = re.sub(pattern, add_clearable, content)

# Write back
with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Added clearable prop to SqlEditor")
print(f"✅ Successfully updated {FILE_PATH}")
