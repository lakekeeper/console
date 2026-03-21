<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <!-- Single flex container for navigation + content -->
      <div style="display: flex; height: calc(100vh - 160px); position: relative">
        <!-- Left: Navigation Tree -->
        <v-expand-x-transition>
          <div v-show="!isNavigationCollapsed" style="display: flex; height: 100%">
            <div
              :style="{
                width: leftWidth + 'px',
                minWidth: '200px',
                maxWidth: '800px',
                height: '100%',
                overflowX: 'hidden',
                overflowY: 'auto',
                borderRight: '1px solid rgba(var(--v-theme-on-surface), 0.12)',
              }">
              <WarehousesNavigationTree
                v-if="warehouse"
                :warehouse-id="params.id"
                :warehouse-name="warehouse.name"
                :active-namespace-path="namespacePath"
                @navigate="handleNavigate" />
            </div>

            <!-- Resizable Divider -->
            <div
              @mousedown="startResize"
              style="
                width: 5px;
                cursor: col-resize;
                user-select: none;
                flex-shrink: 0;
                transition: background 0.3s;
              "
              :style="{
                background:
                  dividerHover || isResizing ? '#2196F3' : 'rgba(var(--v-theme-on-surface), 0.12)',
              }"
              @mouseenter="dividerHover = true"
              @mouseleave="dividerHover = false"></div>
          </div>
        </v-expand-x-transition>

        <!-- Right: Main Content -->
        <div
          style="
            flex: 1;
            height: 100%;
            min-width: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
          <TableHeader
            :warehouse-id="params.id"
            :namespace-id="params.nsid"
            :table-name="params.tid" />

          <div v-if="loading" class="d-flex justify-center align-center pa-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-alert
            v-else-if="pageError"
            type="warning"
            variant="tonal"
            class="ma-4"
            style="flex: none">
            The table
            <strong>{{ params.tid }}</strong>
            does not exist or you do not have sufficient rights to access it.
          </v-alert>

          <v-tabs v-if="!loading && !pageError" v-model="tab">
            <v-tab value="details">details</v-tab>
            <v-tab value="preview">preview</v-tab>
            <v-tab value="health">health</v-tab>
            <v-tab value="raw">raw</v-tab>
            <v-tab value="versioning">versioning</v-tab>
            <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
            <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
          </v-tabs>

          <v-card v-if="!loading && !pageError" style="flex: 1; min-height: 0; overflow: auto">
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="details">
                <TableOverview
                  v-if="tab === 'details'"
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
              <v-tabs-window-item value="health">
                <TableHealth
                  v-if="tab === 'health'"
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

              <v-tabs-window-item value="versioning">
                <TableVersioning
                  v-if="tab === 'versioning'"
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
        </div>
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useFunctions,
  RelationType,
  useTablePermissions,
  useTableAuthorizerPermissions,
  useVisualStore,
  isForbiddenError,
  isNotFoundError,
} from '@lakekeeper/console-components';

const route = useRoute();
const functions = useFunctions();
const visual = useVisualStore();
const tab = ref('details');
const tableId = ref('');
const lastTableRequest = ref(0);
const pageError = ref<'forbidden' | 'not-found' | null>(null);
const loading = ref(true);
const warehouse = ref<{ name: string; id: string } | null>(null);
const storageType = ref<string | undefined>(undefined);
const router = useRouter();
const leftWidth = ref(300);
const dividerHover = ref(false);
const isResizing = ref(false);
const isNavigationCollapsed = computed({
  get: () => visual.isNavigationCollapsed,
  set: (value: boolean) => {
    visual.isNavigationCollapsed = value;
  },
});

function startResize(e: MouseEvent) {
  isResizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;

  function onMouseMove(e: MouseEvent) {
    const delta = e.clientX - startX;
    const newWidth = startWidth + delta;
    leftWidth.value = Math.max(200, Math.min(800, newWidth));
  }

  function onMouseUp() {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleNavigate(item: {
  type: string;
  warehouseId: string;
  namespaceId?: string;
  name: string;
  tab?: string;
}) {
  const namespaceForRoute = item.namespaceId?.split('.').join('\x1F');

  if (item.type === 'warehouse') {
    visual.whId = item.warehouseId;
    router.push(`/warehouse/${item.warehouseId}`);
  } else if (item.type === 'namespace' && namespaceForRoute) {
    const navRoute = `/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}`;
    if (item.tab) {
      router.push({ path: navRoute, query: { tab: item.tab } });
    } else {
      router.push(navRoute);
    }
  } else if (item.type === 'table' && namespaceForRoute) {
    router.push(`/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}/table/${item.name}`);
  } else if (item.type === 'view' && namespaceForRoute) {
    router.push(`/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}/view/${item.name}`);
  }
}

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  tid: (route.params as { tid: string }).tid,
}));

// Use composable for permissions with reactive warehouse id
const warehouseId = computed(() => params.value.id);
const { showTasksTab } = useTablePermissions(tableId, warehouseId);
const { showPermissionsTab } = useTableAuthorizerPermissions(tableId, warehouseId);

// Get catalog URL from environment variable (same pattern as warehouse page)
const catalogUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || 'http://localhost:8181';
  return `${baseUrl}/catalog`;
});

async function loadWarehouse() {
  try {
    const wh = await functions.getWarehouse(params.value.id, false);
    warehouse.value = wh;
    // Extract storage type from warehouse
    if (wh['storage-profile']?.type) {
      storageType.value = wh['storage-profile'].type;
    }
  } catch (error: any) {
    if (isForbiddenError(error) || isNotFoundError(error)) {
      router.replace('/');
      return;
    }
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
  pageError.value = null;
  loading.value = true;
  try {
    const table = await functions.loadTableCustomized(id, nsid, tid, false);
    if (requestToken !== lastTableRequest.value) {
      return;
    }
    tableId.value = table.metadata['table-uuid'] || '';
  } catch (error: any) {
    if (requestToken !== lastTableRequest.value) return;
    if (isForbiddenError(error)) {
      pageError.value = 'forbidden';
      return;
    }
    if (isNotFoundError(error)) {
      pageError.value = 'not-found';
      return;
    }
    tableId.value = '';
  } finally {
    loading.value = false;
  }
}

// Load warehouse and table metadata on mount
onMounted(() => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
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

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
watch(
  () => visual.requestedNamespaceTab,
  (newTab) => {
    if (newTab) {
      tab.value = newTab;
      visual.requestedNamespaceTab = null;
    }
  },
  { immediate: true },
);
</script>
