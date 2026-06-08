<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <div style="display: flex; height: calc(100vh - 160px); position: relative">
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
                :active-namespace-path="namespacePath"
                @navigate="handleNavigate" />
            </div>

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

        <div
          style="
            flex: 1;
            height: 100%;
            min-width: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
          <GenericTableHeader
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
            The generic table
            <strong>{{ params.tid }}</strong>
            does not exist or you do not have sufficient rights to access it.
          </v-alert>

          <v-tabs v-if="!loading && !pageError" v-model="tab">
            <v-tab value="details">details</v-tab>
            <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
            <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
          </v-tabs>

          <v-card v-if="!loading && !pageError" style="flex: 1; min-height: 0; overflow: auto">
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="details">
                <GenericTableOverview
                  v-if="tab === 'details'"
                  :warehouse-id="params.id"
                  :namespace-id="params.nsid"
                  :table-name="params.tid" />
              </v-tabs-window-item>

              <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
                <PermissionManager
                  v-if="tab === 'permissions' && genericTableId"
                  :objectId="genericTableId"
                  :relationType="RelationType.GenericTable"
                  :warehouseId="params.id" />
                <div v-else class="text-center pa-8">
                  <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                  <div class="text-subtitle-1 mt-2">Loading generic table information...</div>
                </div>
              </v-tabs-window-item>

              <v-tabs-window-item v-if="showTasksTab" value="tasks">
                <TaskManager
                  v-if="genericTableId"
                  :warehouse-id="params.id"
                  :generic-table-id="genericTableId"
                  entity-type="generic-table" />
                <div v-else class="text-center pa-8">
                  <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                  <div class="text-subtitle-1 mt-2">Loading generic table information...</div>
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
  useGenericTablePermissions,
  useGenericTableAuthorizerPermissions,
  useVisualStore,
  isForbiddenError,
  isNotFoundError,
} from '@lakekeeper/console-components';

const functions = useFunctions();
const route = useRoute();
const router = useRouter();
const visual = useVisualStore();
const tab = ref('details');
const genericTableId = ref('');
const lastRequest = ref(0);
const pageError = ref<'forbidden' | 'not-found' | null>(null);
const loading = ref(true);
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
  } else if (item.type === 'generic-table' && namespaceForRoute) {
    router.push(
      `/warehouse/${item.warehouseId}/namespace/${namespaceForRoute}/generic-table/${item.name}`,
    );
  }
}

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  tid: (route.params as { tid: string }).tid,
}));

const namespacePath = computed(() => {
  // eslint-disable-next-line no-control-regex
  return params.value.nsid.replace(/\x1F/g, '.');
});

const warehouseId = computed(() => params.value.id);
const { showTasksTab } = useGenericTablePermissions(genericTableId, warehouseId);
const { showPermissionsTab } = useGenericTableAuthorizerPermissions(genericTableId, warehouseId);

async function loadWarehouseName() {
  const currentId = params.value.id;
  try {
    const warehouse = await functions.getWarehouse(currentId, false);
    if (params.value.id !== currentId) return;
    warehouseName.value = warehouse.name;
  } catch (error: any) {
    if (params.value.id !== currentId) return;
    if (isForbiddenError(error) || isNotFoundError(error)) {
      router.replace('/');
      return;
    }
    warehouseName.value = undefined;
  }
}

async function loadGenericTableMetadata() {
  const { id, nsid, tid } = params.value;
  const requestToken = ++lastRequest.value;
  genericTableId.value = '';
  pageError.value = null;
  loading.value = true;
  try {
    // loadGenericTable returns format/base-location/properties but no id; resolve
    // the id via listGenericTables so PermissionManager/TaskManager get a UUID.
    await functions.loadGenericTable(id, nsid, tid, false);
    if (requestToken !== lastRequest.value) return;
    const data = await functions.listGenericTables(id, nsid, undefined, false);
    if (requestToken !== lastRequest.value) return;
    const match = (data.identifiers ?? []).find((g: { name: string }) => g.name === tid);
    if (!match?.id) {
      // load succeeded but the listing doesn't surface this name — treat as
      // not-found so the page renders the alert instead of spinning the
      // Permissions / Tasks tabs forever waiting on an id that never arrives.
      pageError.value = 'not-found';
      return;
    }
    genericTableId.value = match.id;
  } catch (error: any) {
    if (requestToken !== lastRequest.value) return;
    if (isForbiddenError(error)) {
      pageError.value = 'forbidden';
      return;
    }
    if (isNotFoundError(error)) {
      pageError.value = 'not-found';
      return;
    }
    genericTableId.value = '';
  } finally {
    if (requestToken === lastRequest.value) {
      loading.value = false;
    }
  }
}

onMounted(() => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
  loadWarehouseName();
  loadGenericTableMetadata();
});

watch(
  () => [params.value.id, params.value.nsid, params.value.tid],
  () => {
    loadWarehouseName();
    loadGenericTableMetadata();
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
