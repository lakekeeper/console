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
          <ViewHeader
            :warehouse-id="params.id"
            :namespace-id="params.nsid"
            :view-name="params.vid" />

          <v-tabs v-model="tab">
            <v-tab value="overview">overview</v-tab>
            <v-tab value="raw">raw</v-tab>
            <v-tab value="history">history</v-tab>
            <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
            <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
          </v-tabs>

          <v-card style="max-height: 80vh; overflow: auto; min-height: 55vh">
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="overview">
                <ViewOverview
                  v-if="tab === 'overview'"
                  :warehouse-id="params.id"
                  :namespace-id="params.nsid"
                  :view-name="params.vid" />
              </v-tabs-window-item>

              <v-tabs-window-item value="raw">
                <ViewRaw
                  v-if="tab === 'raw'"
                  :warehouse-id="params.id"
                  :namespace-id="params.nsid"
                  :view-name="params.vid" />
              </v-tabs-window-item>

              <v-tabs-window-item value="history">
                <ViewHistoryTab
                  v-if="tab === 'history'"
                  :warehouse-id="params.id"
                  :namespace-id="params.nsid"
                  :view-name="params.vid" />
              </v-tabs-window-item>

              <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
                <PermissionManager
                  v-if="tab === 'permissions' && viewId"
                  :objectId="viewId"
                  :relationType="RelationType.View"
                  :warehouseId="params.id" />
                <div v-else class="text-center pa-8">
                  <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                  <div class="text-subtitle-1 mt-2">Loading view information...</div>
                </div>
              </v-tabs-window-item>

              <v-tabs-window-item v-if="showTasksTab" value="tasks">
                <TaskManager
                  v-if="viewId"
                  :warehouse-id="params.id"
                  :view-id="viewId"
                  entity-type="view" />
                <div v-else class="text-center pa-8">
                  <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                  <div class="text-subtitle-1 mt-2">Loading view information...</div>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </div>
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useFunctions,
  RelationType,
  useViewPermissions,
  useViewAuthorizerPermissions,
  useVisualStore,
} from '@lakekeeper/console-components';

const functions = useFunctions();
const route = useRoute();
const visual = useVisualStore();
const tab = ref('overview');
const viewId = ref('');
const lastViewRequest = ref(0);
const warehouseName = ref<string | undefined>(undefined);
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
  vid: (route.params as { vid: string }).vid,
}));

// Use composable for view permissions with reactive warehouse id
const warehouseId = computed(() => params.value.id);
const { showTasksTab } = useViewPermissions(viewId, warehouseId);
const { showPermissionsTab } = useViewAuthorizerPermissions(viewId, warehouseId);

async function loadWarehouseName() {
  try {
    const warehouse = await functions.getWarehouse(params.value.id);
    warehouseName.value = warehouse.name;
  } catch (error) {
    console.error('Failed to load warehouse:', error);
    warehouseName.value = undefined;
  }
}

async function loadViewMetadata() {
  const { id, nsid, vid } = params.value;
  const requestToken = ++lastViewRequest.value;
  // Clear stale view id so downstream consumers don't operate on the previous view
  viewId.value = '';
  try {
    const view = await functions.loadView(id, nsid, vid);
    if (requestToken !== lastViewRequest.value) {
      return;
    }
    viewId.value = view.metadata['view-uuid'] || '';
  } catch (error: any) {
    console.error('Failed to load view metadata:', error);
    if (error.error.code === 404 || error.error.type === 'WarehouseNotFound') {
      router.push('/notfound');
      return;
    }
    if (requestToken === lastViewRequest.value) {
      viewId.value = '';
    }
  }
}

// Initial load and react to route changes
// onMounted(loadViewMetadata);
onMounted(() => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
  loadWarehouseName();
  loadViewMetadata();
});

watch(
  () => [params.value.id, params.value.nsid, params.value.vid],
  () => {
    loadWarehouseName();
    loadViewMetadata();
  },
  { immediate: false },
);

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
