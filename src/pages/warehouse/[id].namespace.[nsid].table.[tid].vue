<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <TableHeader :warehouse-id="params.id" :namespace-id="params.nsid" :table-name="params.tid" />

      <v-tabs v-model="tab">
        <v-tab value="overview">overview</v-tab>
        <v-tab value="preview">preview</v-tab>
        <v-tab value="raw">raw</v-tab>
        <v-tab value="branch">branch</v-tab>
        <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
        <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
      </v-tabs>

      <v-card style="max-height: 80vh; overflow: auto">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="overview">
            <TableOverview
              v-if="tab === 'overview'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="preview">
            <TablePreview
              v-if="tab === 'preview'"
              :warehouse-id="params.id"
              :namespace-id="namespacePath"
              :table-name="params.tid"
              :catalog-url="catalogUrl"
              :storage-type="storageType" />
          </v-tabs-window-item>

          <v-tabs-window-item value="raw">
            <TableRaw
              v-if="tab === 'raw'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="branch">
            <TableBranch
              v-if="tab === 'branch'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager
              v-if="tab == 'permissions' && tableId"
              :objectId="tableId"
              :relationType="RelationType.Table"
              :warehouseId="params.id" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showTasksTab" value="tasks">
            <TaskManager
              v-if="tab == 'tasks' && tableId"
              :warehouse-id="params.id"
              :table-id="tableId"
              entity-type="table" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions, RelationType, useTablePermissions } from '@lakekeeper/console-components';

const route = useRoute();
const functions = useFunctions();
const tab = ref('overview');
const tableId = ref('');
const lastTableRequest = ref(0);
const warehouse = ref<{ name: string; id: string } | null>(null);
const storageType = ref<string | undefined>(undefined);

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  tid: (route.params as { tid: string }).tid,
}));

// Use composable for permissions with reactive warehouse id
const warehouseId = computed(() => params.value.id);
const { showPermissionsTab, showTasksTab } = useTablePermissions(tableId, warehouseId);

// Get catalog URL from environment variable (same pattern as warehouse page)
const catalogUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || 'http://localhost:8181';
  return `${baseUrl}/catalog`;
});

async function loadWarehouse() {
  try {
    const wh = await functions.getWarehouse(params.value.id);
    warehouse.value = wh;
    // Extract storage type from warehouse
    if (wh['storage-profile']?.type) {
      storageType.value = wh['storage-profile'].type;
    }
  } catch (error) {
    console.error('Failed to load warehouse:', error);
    warehouse.value = null;
    storageType.value = undefined;
  }
}

const namespacePath = computed(() => {
  // eslint-disable-next-line no-control-regex
  return params.value.nsid.replace(/\x1F/g, '.');
});

async function loadTableMetadata() {
  const { id, nsid, tid } = params.value;
  const requestToken = ++lastTableRequest.value;
  // Clear stale table id so downstream consumers don't operate on the previous table
  tableId.value = '';
  try {
    const table = await functions.loadTableCustomized(id, nsid, tid);
    if (requestToken !== lastTableRequest.value) {
      return;
    }
    tableId.value = table.metadata['table-uuid'] || '';
  } catch (error) {
    console.error('Failed to load table metadata:', error);
    if (requestToken === lastTableRequest.value) {
      tableId.value = '';
    }
  }
}

// Load warehouse and table metadata on mount
onMounted(() => {
  loadWarehouse();
  loadTableMetadata();
});

// Reload metadata when route params change
watch(
  () => [params.value.id, params.value.nsid, params.value.tid],
  () => {
    loadWarehouse();
    loadTableMetadata();
  },
  { immediate: false },
);
</script>
