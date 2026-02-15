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
          <WarehouseHeader :warehouse-id="params.id" />

          <v-tabs v-model="tab" density="compact">
            <v-tab density="compact" value="namespaces">namespaces</v-tab>
            <v-tab density="compact" value="details">Details</v-tab>
            <v-tab density="compact" value="query">Query</v-tab>
            <v-tab v-if="showTasksTab" density="compact" value="tasks">Tasks</v-tab>
            <v-tab v-if="showPermissionsTab" density="compact" value="permissions">
              permissions
            </v-tab>
          </v-tabs>
          <v-card>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="namespaces">
                <WarehouseNamespaces v-if="tab === 'namespaces'" :warehouse-id="params.id" />
              </v-tabs-window-item>
              <v-tabs-window-item value="details">
                <WarehouseDetails v-if="tab === 'details'" :warehouse-id="params.id" />
              </v-tabs-window-item>
              <v-tabs-window-item value="query">
                <WarehouseSqlQuery
                  v-if="tab === 'query'"
                  :project-id="projectId"
                  :warehouse-id="params.id"
                  :warehouse-name="warehouseName"
                  :catalog-url="catalogUrl"
                  :storage-type="storageType"
                  :use-fresh-token="true" />
              </v-tabs-window-item>
              <v-tabs-window-item value="permissions">
                <PermissionManager
                  v-if="tab === 'permissions'"
                  :objectId="warehouseId"
                  :relationType="RelationType.Warehouse"
                  :warehouseId="warehouseId" />
              </v-tabs-window-item>
              <v-tabs-window-item value="tasks">
                <TaskManager
                  v-if="tab === 'tasks'"
                  :warehouse-id="params.id"
                  entity-type="warehouse" />
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import {
  RelationType,
  useWarehousePermissions,
  useFunctions,
  useWarehouseAuthorizerPermissions,
  useVisualStore,
} from '@lakekeeper/console-components';
import { computed, ref, onMounted, watch } from 'vue';

const route = useRoute();
const router = useRouter();
const functions = useFunctions();
const visual = useVisualStore();
const tab = ref('namespaces');
const warehouseName = ref<string | undefined>(undefined);
const storageType = ref<string | undefined>(undefined);
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

// const userStore = useUserStore();
const params = computed(() => route.params as { id: string });

// Use warehouse ID as a computed ref
const warehouseId = computed(() => params.value.id);

// Use warehouse permissions composable
// const permissions = useWarehousePermissions(warehouseId);
const { showTasksTab } = useWarehousePermissions(warehouseId);
const { showPermissionsTab } = useWarehouseAuthorizerPermissions(warehouseId);
const projectId = ref<string | undefined>(undefined);

// Load warehouse data
async function loadWarehouse() {
  try {
    const wh = await functions.getWarehouse(params.value.id);
    projectId.value = wh['project-id'];
    warehouseName.value = wh.name;

    // Extract storage type from warehouse config
    // The storage profile typically contains the type (s3, gcs, azure, etc.)
    if (wh['storage-profile'] && wh['storage-profile'].type) {
      storageType.value = wh['storage-profile'].type;
    } else if (wh['storage-profile']) {
      // Try to infer from storage profile keys
      const profile = wh['storage-profile'];
      if (
        profile['s3-access-key-id'] ||
        profile['s3-secret-access-key'] ||
        profile['s3-endpoint']
      ) {
        storageType.value = 's3';
      } else if (profile['adls-connection-string'] || profile['adls-sas-token']) {
        storageType.value = 'azure';
      } else if (profile['gcs-project-id'] || profile['gcs-service-account']) {
        storageType.value = 'gcs';
      }
    }
  } catch (error: any) {
    // If it's a 404/WarehouseNotFound error, redirect to not found page
    if (error.error.code === 404 || error.error.type === 'WarehouseNotFound') {
      router.push('/notfound');
      return;
    }

    // For other errors, clear the warehouse data but stay on page
    warehouseName.value = undefined;
    storageType.value = undefined;
  }
}

onMounted(() => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
  loadWarehouse();
});

// // Refresh permissions when user logs in (not on token renewal)
// watch(
//   () => userStore.getUser(),
//   (newUser, oldUser) => {
//     // Only refresh on initial login (oldUser was null/undefined)
//     // Don't refresh on token renewal (both exist but token changed)
//     if (newUser && !oldUser) {
//       permissions.refresh();
//     }
//   },
// );

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
