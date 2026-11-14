<template>
  <!-- Gutters cancel out (row -12px, col +12px), so the tree sits flush against
       the rail as in LoQE; the breadcrumbs keep their indent. -->
  <v-row>
    <v-col>
      <BreadcrumbsFromUrl class="ml-4" />

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
                v-if="warehouseName"
                :warehouse-id="params.id"
                :warehouse-name="warehouseName"
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
                  dividerHover || isResizing
                    ? 'rgb(var(--v-theme-primary))'
                    : 'rgba(var(--v-theme-on-surface), 0.12)',
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
            overflow: hidden;
            min-width: 0;
            display: flex;
            flex-direction: column;
          ">
          <NamespaceHeader :warehouse-id="params.id" :namespace-path="params.nsid" />

          <div v-if="loading" class="d-flex justify-center align-center pa-8">
            <v-progress-circular indeterminate color="primary" :size="48" />
          </div>

          <v-alert
            v-else-if="pageError"
            type="warning"
            variant="tonal"
            class="ma-4"
            style="flex: none">
            The namespace
            <strong>{{ namespacePath }}</strong>
            does not exist or you do not have sufficient rights to access it.
          </v-alert>

          <v-tabs v-if="!loading && !pageError" v-model="tab">
            <v-tab value="contents">contents</v-tab>
            <v-tab value="details">details</v-tab>
            <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
            <v-tab v-if="showGrantsTab" value="grants">Grants</v-tab>
          </v-tabs>

          <v-card v-if="!loading && !pageError" style="flex: 1; min-height: 0; overflow: auto">
            <v-tabs-window v-model="tab" class="tab-window" style="height: 100%">
              <!-- One list for everything the namespace holds; the chips inside
                   narrow it to one type and hand over to that type's own list. -->
              <v-tabs-window-item value="contents">
                <NamespaceContents
                  v-if="tab === 'contents'"
                  v-model:selection="contentSelection"
                  :warehouse-id="params.id"
                  :namespace-path="params.nsid"
                  :storage-layout="storageLayout"
                  :soft-deletion="softDeletion"></NamespaceContents>
              </v-tabs-window-item>

              <v-tabs-window-item value="details">
                <NamespaceDetails
                  v-if="tab === 'details'"
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
              <v-tabs-window-item v-if="showGrantsTab" value="grants">
                <EntityGrantsTab
                  v-if="tab === 'grants' && namespaceId"
                  :resource="{ type: 'namespace', warehouseId: params.id, namespaceId }"
                  :entity-name="params.nsid"
                  :warehouse-name="warehouseName"
                  :namespace-path="params.nsid" />
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
import { useTabDeepLink } from '@/composables/useTabDeepLink';
import {
  useFunctions,
  useNamespaceAuthorizerPermissions,
  RelationType,
  useVisualStore,
  isForbiddenError,
  isNotFoundError,
  EntityGrantsTab,
  useGrantsSupported,
  contentSelectionFromQuery,
  contentSelectionToQuery,
  type ContentSelection,
} from '@lakekeeper/console-components';

const route = useRoute();
const router = useRouter();
const functions = useFunctions();
const visual = useVisualStore();
const tab = ref('contents');
// The Contents chips, kept in the URL as `?type=a,b` so a reload or a shared link
// opens the same narrowing. An old per-type `?tab=` (nav tree entries, the
// redirect after a drop, bookmarks) lands here too.
const contentSelection = ref<ContentSelection>(
  contentSelectionFromQuery(route.query.tab, route.query.type) ?? [],
);
const namespaceId = ref('');
const lastNamespaceRequest = ref(0);
const pageError = ref<'forbidden' | 'not-found' | null>(null);
const loading = ref(true);
const storageType = ref<string | undefined>(undefined);
const storageLayout = ref<string | undefined>(undefined);
// Soft deletion on the warehouse: Contents then offers its Deleted chip.
const softDeletion = ref(false);
// Grants are authorizer-agnostic, so this asks the server what it can grant
// rather than keying off the backend name.
const showGrantsTab = useGrantsSupported();
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
  pageError.value = null;
  loading.value = true;

  // Load warehouse first — if this fails, redirect (user cannot access the warehouse)
  try {
    const warehouse = await functions.getWarehouse(id, false);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    warehouseName.value = warehouse.name;
    if (warehouse['storage-profile']?.type) {
      storageType.value = warehouse['storage-profile'].type;
    }
    storageLayout.value =
      (warehouse['storage-profile'] as any)?.['storage-layout']?.type || 'default';
    softDeletion.value = warehouse['delete-profile']?.type === 'soft';
  } catch (error: any) {
    if (requestToken !== lastNamespaceRequest.value) return;
    if (isForbiddenError(error) || isNotFoundError(error)) {
      router.replace('/');
      return;
    }
    storageType.value = undefined;
    storageLayout.value = undefined;
    loading.value = false;
    return;
  }

  // Load namespace metadata — if forbidden, just skip (tabs handle their own permissions)
  try {
    const namespace = await functions.loadNamespaceMetadata(id, nsid, false);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    namespaceId.value = namespace.properties?.namespace_id || '';
  } catch (error: any) {
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    if (isNotFoundError(error)) {
      pageError.value = 'not-found';
    } else if (isForbiddenError(error)) {
      pageError.value = 'forbidden';
    }
    namespaceId.value = '';
    loading.value = false;
    return;
  }
  if (requestToken === lastNamespaceRequest.value) {
    loading.value = false;
  }
}

// Load namespace metadata on mount to get namespaceId for permissions
onMounted(() => {
  loadNamespaceMetadata();
});

// Reload when route params change
watch(
  () => [params.value.id, params.value.nsid],
  () => loadNamespaceMetadata(),
  { immediate: false },
);

const { showPermissionsTab } = useNamespaceAuthorizerPermissions(namespaceId, params.value.id);

watch(
  () => visual.requestedNamespaceTab,
  (newTab) => {
    if (newTab) {
      const sel = contentSelectionFromQuery(newTab, undefined);
      if (sel) contentSelection.value = sel;
      tab.value = sel ? 'contents' : newTab;
      visual.requestedNamespaceTab = null;
    }
  },
  { immediate: true },
);

// The nav tree's per-type entries change `?tab=` while this page stays mounted.
// A link without a filter (plain Contents, another namespace) clears the chips;
// only a filter switches to Contents, any other tab stays where it is.
watch([() => route.query.tab, () => route.query.type, () => params.value.nsid], ([qTab, qType]) => {
  const sel = contentSelectionFromQuery(qTab, qType);
  contentSelection.value = sel ?? [];
  if (sel) tab.value = 'contents';
});

function writeUrl() {
  // Same reason as syncUrl below: no router.replace from a tab change. The
  // router's own history.replace still updates its history state, so the next
  // push keeps this entry's filter for Back.
  const query: Record<string, any> = { ...route.query, tab: tab.value };
  const type =
    tab.value === 'contents' ? contentSelectionToQuery(contentSelection.value) : undefined;
  if (type) query.type = type;
  else delete query.type;
  router.options.history.replace(router.resolve({ query }).fullPath);
}
watch(contentSelection, writeUrl);

// These tabs only render once their flag resolves, so a `?tab=` naming one is held
// until then rather than lost to Vuetify's revert.
useTabDeepLink({
  tab,
  tabs: ['contents', 'details', 'permissions', 'grants'],
  gates: {
    permissions: () => showPermissionsTab.value,
    grants: () => showGrantsTab.value,
  },
  // Update the URL bar without going through router.replace(): that runs the full
  // navigation-guard pipeline (including an awaited getServerInfo() network call)
  // on every tab click, which was stalling/interrupting this page's tab transition.
  syncUrl: () => writeUrl(),
});
</script>

<style scoped>
/* Same bounded window as the table page: each tab fills the card and carries
   its own scroll, so the details pane can end where the card ends. */
.tab-window :deep(.v-window__container) {
  height: 100%;
}

.tab-window :deep(.v-window-item) {
  height: 100%;
  overflow-y: auto;
}
</style>
