#!/usr/bin/env python3
"""
Script to update WarehouseSqlQuery.vue to use the new SqlEditor component
"""

import re
import sys

FILE_PATH = "/Users/viktor/Biz/console-components/src/components/WarehouseSqlQuery.vue"

def main():
    # Read the file
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {FILE_PATH}")
        sys.exit(1)
    
    # Backup
    backup_path = FILE_PATH + '.backup'
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Backup created: {backup_path}")
    
    original_content = content
    
    # Step 1: Add SqlEditor import
    import_pattern = r"(import WarehouseNavigationTree from './WarehouseNavigationTree\.vue';)"
    import_replacement = r"\1\nimport SqlEditor from './SqlEditor.vue';"
    
    if "import SqlEditor from './SqlEditor.vue'" not in content:
        content = re.sub(import_pattern, import_replacement, content)
        print("✓ Added SqlEditor import")
    else:
        print("- SqlEditor import already exists")
    
    # Step 2: Replace v-textarea with SqlEditor
    textarea_pattern = r'''<!-- SQL Editor -->\s*<v-textarea\s+ref="sqlTextarea"\s+@click="updateCursorPosition"\s+@keyup="updateCursorPosition"\s+v-model="sqlQuery"\s+label="SQL Query"\s+:placeholder="[^"]*selectedTable[^"]*"\s+rows="8"\s+variant="outlined"\s+auto-grow\s+clearable\s+class="font-monospace"\s+:disabled="isExecuting \|\| !isSqlAvailable\.available"\s*/>'''
    
    sql_editor_replacement = '''<!-- SQL Editor -->
                  <div class="mb-4">
                    <div class="text-caption text-grey mb-1">SQL Query</div>
                    <SqlEditor
                      ref="sqlTextarea"
                      v-model="sqlQuery"
                      @click="updateCursorPosition"
                      @keyup="updateCursorPosition"
                      :placeholder="
                        selectedTable
                          ? `SELECT * FROM ${warehouseName}.${selectedTable.namespaceId}.${selectedTable.name} LIMIT 10;`
                          : 'SELECT * FROM catalog.namespace.table LIMIT 10;'
                      "
                      :disabled="isExecuting || !isSqlAvailable.available"
                      min-height="200px"
                    />
                  </div>'''
    
    if '<v-textarea' in content and 'ref="sqlTextarea"' in content:
        # More flexible pattern
        textarea_pattern2 = r'<v-textarea\s+ref="sqlTextarea"[^>]*>[^<]*</v-textarea>|<v-textarea\s+ref="sqlTextarea"[^>]*/>'
        
        # Find the textarea
        match = re.search(r'<v-textarea\s+ref="sqlTextarea"', content)
        if match:
            # Find the full element
            start = match.start()
            # Find either self-closing /> or </v-textarea>
            end_match = re.search(r'/>', content[start:])
            if end_match:
                end = start + end_match.end()
                old_textarea = content[start:end]
                
                # Replace
                content = content[:start] + '''<SqlEditor
                      ref="sqlTextarea"
                      v-model="sqlQuery"
                      @click="updateCursorPosition"
                      @keyup="updateCursorPosition"
                      :placeholder="
                        selectedTable
                          ? `SELECT * FROM ${warehouseName}.${selectedTable.namespaceId}.${selectedTable.name} LIMIT 10;`
                          : 'SELECT * FROM catalog.namespace.table LIMIT 10;'
                      "
                      :disabled="isExecuting || !isSqlAvailable.available"
                      min-height="200px"
                    />''' + content[end:]
                print("✓ Replaced v-textarea with SqlEditor")
            else:
                print("⚠ Could not find end of v-textarea element")
        else:
            print("- v-textarea not found or already replaced")
    else:
        print("- v-textarea already replaced with SqlEditor")
    
    # Step 3: Update updateCursorPosition function
    cursor_func_pattern = r'''function updateCursorPosition\(event: Event\) \{\s*const target = event\.target as HTMLTextAreaElement;\s*if \(target\) \{\s*cursorPosition\.value = target\.selectionStart \|\| 0;\s*\}\s*\}'''
    
    cursor_func_replacement = '''function updateCursorPosition() {
  if (sqlTextarea.value && typeof sqlTextarea.value.getCursorPosition === 'function') {
    cursorPosition.value = sqlTextarea.value.getCursorPosition();
  }
}'''
    
    if 'event: Event' in content and 'HTMLTextAreaElement' in content:
        content = re.sub(cursor_func_pattern, cursor_func_replacement, content, flags=re.DOTALL)
        print("✓ Updated updateCursorPosition function")
    else:
        print("- updateCursorPosition already updated")
    
    # Step 4: Update handleTableSelected setTimeout block
    settimeout_pattern = r'''// Focus and set cursor position in the textarea\s*setTimeout\(\(\) => \{\s*if \(sqlTextarea\.value && sqlTextarea\.value\.\$el\) \{\s*const textarea = sqlTextarea\.value\.\$el\.querySelector\('textarea'\);\s*if \(textarea\) \{\s*textarea\.focus\(\);\s*textarea\.setSelectionRange\(cursorPosition\.value, cursorPosition\.value\);\s*\}\s*\}\s*\}, 0\);'''
    
    settimeout_replacement = '''// Focus and insert at cursor using SqlEditor's method
        setTimeout(() => {
          if (sqlTextarea.value && typeof sqlTextarea.value.insertAtCursor === 'function') {
            // Text already inserted, just update cursor position
            cursorPosition.value = cursorPosition.value + textToInsert.length;
          }
        }, 0);'''
    
    if 'querySelector(\'textarea\')' in content or 'querySelector("textarea")' in content:
        content = re.sub(settimeout_pattern, settimeout_replacement, content, flags=re.DOTALL)
        print("✓ Updated handleTableSelected setTimeout block")
    else:
        print("- handleTableSelected already updated")
    
    # Write the updated content
    if content != original_content:
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Successfully updated {FILE_PATH}")
        print(f"   Backup saved as: {backup_path}")
    else:
        print("\n⚠ No changes made - file might already be updated")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
