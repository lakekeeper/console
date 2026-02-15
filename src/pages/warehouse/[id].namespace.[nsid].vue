<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <!-- Single flex container for navigation + content -->
      <div style="display: flex; height: calc(100vh - 200px); position: relative">
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
                v-if="warehouseName"
                :warehouse-id="params.id"
                :warehouse-name="warehouseName"
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
        <div style="flex: 1; height: 100%; overflow-y: auto; min-width: 0">
          <NamespaceHeader :warehouse-id="params.id" :namespace-path="params.nsid" />

          <v-tabs v-model="tab">
            <v-tab value="namespaces">namespaces</v-tab>
            <v-tab value="tables">tables</v-tab>
            <v-tab value="views">views</v-tab>
            <v-tab value="deleted">deleted</v-tab>
            <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
          </v-tabs>

          <v-card>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="namespaces">
                <NamespaceNamespaces
                  v-if="tab === 'namespaces'"
                  :warehouse-id="params.id"
                  :namespace-path="params.nsid" />
              </v-tabs-window-item>

              <v-tabs-window-item value="tables">
                <div class="pa-4">
                  <div class="d-flex justify-end mb-4 gap-2 mr-2">
                    <TableRegister
                      :warehouse-id="params.id"
                      :namespace-id="namespacePath"
                      @registered="onTableCreated" />
                    <span class="mr-2"></span>
                    <TableCreate
                      :warehouse-id="params.id"
                      :namespace-id="namespacePath"
                      :catalog-url="catalogUrl"
                      :storage-type="storageType"
                      @created="onTableCreated" />
                  </div>
                  <NamespaceTables
                    v-if="tab === 'tables'"
                    :warehouse-id="params.id"
                    :namespace-path="params.nsid"
                    :key="tableListKey" />
                </div>
              </v-tabs-window-item>

              <v-tabs-window-item value="views">
                <NamespaceViews
                  v-if="tab === 'views'"
                  :warehouse-id="params.id"
                  :namespace-path="params.nsid" />
              </v-tabs-window-item>

              <v-tabs-window-item value="deleted">
                <NamespaceDeleted
                  v-if="tab === 'deleted'"
                  :warehouse-id="params.id"
                  :namespace-path="params.nsid" />
              </v-tabs-window-item>

              <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
                <PermissionManager
                  v-if="tab === 'permissions'"
                  :objectId="namespaceId"
                  :relationType="RelationType.Namespace"
                  :warehouseId="params.id" />
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
  useNamespaceAuthorizerPermissions,
  RelationType,
  useVisualStore,
} from '@lakekeeper/console-components';

const route = useRoute();
const router = useRouter();
const functions = useFunctions();
const visual = useVisualStore();
const tab = ref('namespaces');
const namespaceId = ref('');
const lastNamespaceRequest = ref(0);
const tableListKey = ref(0);
const storageType = ref<string | undefined>(undefined);
const warehouseName = ref<string | undefined>(undefined);
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

// Get catalog URL from environment variable
const catalogUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || 'http://localhost:8181';
  return `${baseUrl}/catalog`;
});

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
}));

// Convert URL-encoded namespace path to dot-separated format
// In the URL, namespace levels are separated by %1F (Unit Separator, ASCII 31)
// When decoded from the route param, it becomes the actual \x1F character
// e.g., "finance\x1Fsub" -> "finance.sub"
const namespacePath = computed(() => {
  // eslint-disable-next-line no-control-regex
  return params.value.nsid.replace(/\x1F/g, '.');
});

async function loadNamespaceMetadata() {
  const { id, nsid } = params.value;
  const requestToken = ++lastNamespaceRequest.value;
  // Clear stale namespace id so downstream consumers don't operate on the previous namespace
  namespaceId.value = '';
  storageType.value = undefined;
  try {
    // Load warehouse to get storage type and name
    const warehouse = await functions.getWarehouse(id);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    warehouseName.value = warehouse.name;
    if (warehouse['storage-profile']?.type) {
      storageType.value = warehouse['storage-profile'].type;
    }

    const namespace = await functions.loadNamespaceMetadata(id, nsid);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    namespaceId.value = namespace.properties?.namespace_id || '';
  } catch (error: any) {
    console.error('Failed to load namespace metadata:', error);
    if (error.error.code === 404 || error.error.type === 'WarehouseNotFound') {
      router.push('/notfound');
      return;
    }
    if (requestToken === lastNamespaceRequest.value) {
      namespaceId.value = '';
      storageType.value = undefined;
    }
  }
}

// Handle table creation - force refresh of table list
function onTableCreated() {
  tableListKey.value++; // Increment key to force re-render of NamespaceTables
}

// Load namespace metadata on mount to get namespaceId for permissions
onMounted(() => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
  loadNamespaceMetadata();
});

// Reload when route params change
watch(
  () => [params.value.id, params.value.nsid],
  () => loadNamespaceMetadata(),
  { immediate: false },
);

const { showPermissionsTab } = useNamespaceAuthorizerPermissions(namespaceId, params.value.id);
watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
