#!/bin/bash

# Script to update WarehouseSqlQuery.vue to use SqlEditor component

FILE="/Users/viktor/Biz/console-components/src/components/WarehouseSqlQuery.vue"

# Backup the original file
cp "$FILE" "${FILE}.backup"

echo "Updating WarehouseSqlQuery.vue..."

# Step 1: Add SqlEditor import after WarehouseNavigationTree import
sed -i '' '/import WarehouseNavigationTree from/a\
import SqlEditor from '\''./SqlEditor.vue'\'';
' "$FILE"

# Step 2: Replace v-textarea with SqlEditor
# This is more complex, so we'll use a multi-line replacement with perl

perl -i -0pe 's/<!-- SQL Editor -->\s*<v-textarea\s+ref="sqlTextarea"\s+@click="updateCursorPosition"\s+@keyup="updateCursorPosition"\s+v-model="sqlQuery"\s+label="SQL Query"\s+:placeholder="\s*selectedTable\s*\? `SELECT \* FROM \$\{warehouseName\}\.\$\{selectedTable\.namespaceId\}\.\$\{selectedTable\.name\} LIMIT 10;`\s*: '\''SELECT \* FROM catalog\.namespace\.table LIMIT 10;'\''\s*"\s+rows="8"\s+variant="outlined"\s+auto-grow\s+clearable\s+class="font-monospace"\s+:disabled="isExecuting \|\| !isSqlAvailable\.available" \/>/<!-- SQL Editor -->\n                  <div class="mb-4">\n                    <div class="text-caption text-grey mb-1">SQL Query<\/div>\n                    <SqlEditor\n                      ref="sqlTextarea"\n                      v-model="sqlQuery"\n                      @click="updateCursorPosition"\n                      @keyup="updateCursorPosition"\n                      :placeholder="\n                        selectedTable\n                          ? `SELECT * FROM \${warehouseName}.\${selectedTable.namespaceId}.\${selectedTable.name} LIMIT 10;`\n                          : '\''SELECT * FROM catalog.namespace.table LIMIT 10;'\''\n                      "\n                      :disabled="isExecuting || !isSqlAvailable.available"\n                      min-height="200px"\n                    \/>\n                  <\/div>/gs' "$FILE"

# Step 3: Update updateCursorPosition function
perl -i -0pe 's/function updateCursorPosition\(event: Event\) \{\s*const target = event\.target as HTMLTextAreaElement;\s*if \(target\) \{\s*cursorPosition\.value = target\.selectionStart \|\| 0;\s*\}\s*\}/function updateCursorPosition() {\n  if (sqlTextarea.value \&\& typeof sqlTextarea.value.getCursorPosition === '\''function'\'') {\n    cursorPosition.value = sqlTextarea.value.getCursorPosition();\n  }\n}/gs' "$FILE"

# Step 4: Update handleTableSelected function's cursor handling
perl -i -0pe 's/\/\/ Focus and set cursor position in the textarea\s*setTimeout\(\(\) => \{\s*if \(sqlTextarea\.value \&\& sqlTextarea\.value\.\$el\) \{\s*const textarea = sqlTextarea\.value\.\$el\.querySelector\('\''textarea'\''\);\s*if \(textarea\) \{\s*textarea\.focus\(\);\s*textarea\.setSelectionRange\(cursorPosition\.value, cursorPosition\.value\);\s*\}\s*\}\s*\}, 0\);/\/\/ Focus and insert at cursor using SqlEditor'\''s method\n        setTimeout(() => {\n          if (sqlTextarea.value \&\& typeof sqlTextarea.value.insertAtCursor === '\''function'\'') {\n            \/\/ Text already inserted, just update cursor position\n            cursorPosition.value = cursorPosition.value + textToInsert.length;\n          }\n        }, 0);/gs' "$FILE"

echo "Update complete!"
echo "Backup saved as: ${FILE}.backup"
echo ""
echo "Please review the changes and test the component."
