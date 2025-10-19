import re

# Read the file
with open('src/pages/warehouse/[id].namespace.[nsid].table.[tid].vue', 'r') as f:
    content = f.read()

# Add warehouse reactive object after the existing refs
insert_after = "const tableId = ref('');\nconst lastTableRequest = ref(0);"
warehouse_ref = "const tableId = ref('');\nconst lastTableRequest = ref(0);\nconst warehouse = ref<{ name: string; id: string } | null>(null);"

content = content.replace(insert_after, warehouse_ref)

# Add loadWarehouse function before loadTableMetadata
loadWarehouse_func = '''
async function loadWarehouse() {
  try {
    const wh = await functions.getWarehouse(params.value.id);
    warehouse.value = wh;
  } catch (error) {
    console.error('Failed to load warehouse:', error);
    warehouse.value = null;
  }
}

'''

# Insert before loadTableMetadata
content = content.replace('async function loadTableMetadata()', loadWarehouse_func + 'async function loadTableMetadata()')

# Update onMounted to call loadWarehouse
old_onmounted = "// Load table metadata on mount\nonMounted(loadTableMetadata);"
new_onmounted = "// Load warehouse and table metadata on mount\nonMounted(() => {\n  loadWarehouse();\n  loadTableMetadata();\n});"

content = content.replace(old_onmounted, new_onmounted)

# Update watch to reload warehouse too
old_watch = '''// Reload metadata when route params change
watch(
  () => [params.value.id, params.value.nsid, params.value.tid],
  () => loadTableMetadata(),
  { immediate: false },
);'''

new_watch = '''// Reload metadata when route params change
watch(
  () => [params.value.id, params.value.nsid, params.value.tid],
  () => {
    loadWarehouse();
    loadTableMetadata();
  },
  { immediate: false },
);'''

content = content.replace(old_watch, new_watch)

# Update TableSqlQuery component to include warehouse-name prop
old_component = '''            <TableSqlQuery
              v-if="tab === 'sql'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid"
              :catalog-url="icebergCatalogUrl"
              :access-token="userStorage.user.access_token" />'''

new_component = '''            <TableSqlQuery
              v-if="tab === 'sql'"
              :warehouse-id="params.id"
              :warehouse-name="warehouse?.name"
              :namespace-id="params.nsid"
              :table-name="params.tid"
              :catalog-url="icebergCatalogUrl"
              :access-token="userStorage.user.access_token" />'''

content = content.replace(old_component, new_component)

# Write back
with open('src/pages/warehouse/[id].namespace.[nsid].table.[tid].vue', 'w') as f:
    f.write(content)

print("Updated table page to load warehouse and pass warehouse name")
