<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <BreadcrumbsFromUrl />
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{ namespaceId.split(String.fromCharCode(0x1f)).join('.') }}.{{ viewName }}
            </span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-table</v-icon>
          </template>
        </v-toolbar>
        <v-tabs v-model="tab">
          <v-tab value="overview" @click="loadTabData">overview</v-tab>
          <v-tab value="raw" @click="loadTabData">raw</v-tab>
          <v-tab value="history" @click="loadTabData">history</v-tab>
          <v-tab
            v-if="canReadPermissions && enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
          <v-tab
            v-if="canModifyView && enabledAuthentication && enabledPermissions"
            value="tasks"
            @click="loadTabData">
            tasks
          </v-tab>
        </v-tabs>
        <v-card style="max-height: 80vh; overflow: auto; min-height: 55vh">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="overview">
              <v-toolbar color="transparent" density="compact" flat>
                <v-switch
                  v-model="recursiveDeleteProtection"
                  class="ml-4 mt-4"
                  color="info"
                  :label="
                    recursiveDeleteProtection
                      ? 'Recursive Delete Protection enabled'
                      : 'Recursive Delete Protection disabled'
                  "
                  @click="setProtection"></v-switch>
              </v-toolbar>
              <v-card-text>
                <!-- View Details -->
                <ViewDetails v-if="loaded" :view="view" />
              </v-card-text>
            </v-tabs-window-item>
            <v-tabs-window-item value="raw">
              <div class="mb-4 mt-4">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="info"
                  class="mr-8 ml-4"
                  @click="depthRawRepresentation = 1"
                  append-icon="mdi-collapse-all">
                  Collapse
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="success"
                  class="mr-8"
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  @click="copyViewJson"
                  prepend-icon="mdi-content-copy">
                  Copy JSON
                </v-btn>
              </div>
              <div style="height: 65vh; overflow: auto">
                <vue-json-pretty
                  :data="view"
                  :deep="depthRawRepresentation"
                  :theme="themeText"
                  :showLineNumber="true"
                  :virtual="false" />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="history">
              <ViewHistory v-if="loaded" :view="view" />
            </v-tabs-window-item>

            <v-tabs-window-item v-if="canReadPermissions" value="permissions">
              <PermissionManager
                v-if="loaded"
                :status="assignStatus"
                :assignable-obj="permissionObject"
                :existing-permissions-from-obj="existingPermissions"
                :relation-type="permissionType"
                @permissions="assign" />
            </v-tabs-window-item>
            <v-tabs-window-item v-if="canModifyView" value="tasks">
              <TaskManager
                v-if="loaded && viewId"
                :warehouse-id="warehouseId"
                :table-id="viewId"
                entity-type="table" />
              <div v-else class="text-center pa-8">
                <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                <div class="text-subtitle-1 mt-2">Loading view information...</div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import TaskManager from '../../components/TaskManager.vue';
import ViewDetails from '../../components/ViewDetails.vue';
import ViewHistory from '../../components/ViewHistory.vue';
import { LoadViewResultReadable } from '../../gen/iceberg/types.gen';
import { TableAction, ViewAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const crumbPath = ref('');
const loading = ref(true);
const assignStatus = ref(StatusIntent.INACTIVE);

const depthRawRepresentation = ref(3);
const depthRawRepresentationMax = ref(1000);

const myAccess = reactive<TableAction[]>([]);

const permissionType = ref<RelationType>('view');

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

const visual = useVisualStore();
const themeLight = computed(() => {
  return visual.themeLight;
});

const themeText = computed(() => {
  return themeLight.value ? 'light' : 'dark';
});

const warehouseId = (route.params as { id: string }).id;
const namespaceId = (route.params as { nsid: string }).nsid;
const viewName = (route.params as { vid: string }).vid;
const viewId = ref('');
const view = reactive<LoadViewResultReadable>({
  'metadata-location': '',
  metadata: {
    'view-uuid': '',
    'format-version': 0,
    location: '',
    'current-version-id': 0,
    versions: [],
    'version-log': [],
    schemas: [],
  },
});
const loaded = ref(false);
const existingPermissions = reactive<ViewAssignment[]>([]);
const canReadPermissions = ref(false);
const canModifyView = ref(false);
const recursiveDeleteProtection = ref(false);

const currentVersionId = ref(0);
const sqlStatement = ref('');
async function loadTabData() {
  // Load fresh data specific to the current tab
  switch (tab.value) {
    case 'permissions':
      await loadPermissionsData();
      break;
    case 'tasks':
      // Tasks are loaded by TaskManager component - it handles its own refresh
      break;
    case 'overview':
    case 'raw':
    case 'history':
    default:
      // Refresh view data for these tabs
      Object.assign(view, await functions.loadView(warehouseId, namespaceId, viewName));
      depthRawRepresentationMax.value = getMaxDepth(view);
      
      // Update version-specific data for overview tab
      currentVersionId.value = view.metadata['current-version-id'] || 0;
      view.metadata.versions.forEach((version) => {
        if (version['version-id'] === currentVersionId.value) {
          sqlStatement.value = version.representations[0].sql;
        }
      });
      break;
  }
}

async function loadPermissionsData() {
  if (!canReadPermissions.value) return;

  try {
    existingPermissions.splice(0, existingPermissions.length);
    Object.assign(
      existingPermissions,
      await functions.getViewAssignmentsById(viewId.value, warehouseId),
    );
  } catch (error) {
    console.error('Failed to load permissions data:', error);
  }
}

async function init() {
  const serverInfo = await functions.getServerInfo();

  loaded.value = false;
  existingPermissions.splice(0, existingPermissions.length);

  crumbPath.value = `${namespaceId}${String.fromCharCode(0x1f)}${viewName}`;

  Object.assign(view, await functions.loadView(warehouseId, namespaceId, viewName));

  viewId.value = view.metadata['view-uuid'];
  currentVersionId.value = view.metadata['current-version-id'] || 0;
  view.metadata.versions.forEach((version) => {
    if (version['version-id'] === currentVersionId.value) {
      sqlStatement.value = version.representations[0].sql;
    }
  });
  permissionObject.id = viewId.value;
  permissionObject.name = viewName;
  if (serverInfo['authz-backend'] != 'allow-all') {
    Object.assign(myAccess, await functions.getViewAccessById(viewId.value, warehouseId));
    await getProtection();

    canReadPermissions.value = !!myAccess.includes('read_assignments');
    canModifyView.value = !!(
      myAccess.includes('grant_modify') || myAccess.includes('change_ownership')
    );

    Object.assign(
      existingPermissions,
      canReadPermissions.value && tab.value === 'permissions'
        ? await functions.getViewAssignmentsById(viewId.value, warehouseId)
        : [],
    );
  }

  depthRawRepresentationMax.value = getMaxDepth(view);

  loaded.value = true;
}

onMounted(async () => {
  await init();
  loading.value = false;
});

function getMaxDepth(obj: any): number {
  let maxDepth = 0;

  function findDepth(obj: any, depth: number) {
    if (typeof obj === 'object' && obj !== null) {
      depth++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findDepth(obj[key], depth);
        }
      }
    }
  }

  findDepth(obj, 0);
  return maxDepth;
}

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as ViewAssignment[];
    const writes = permissions.writes as ViewAssignment[];

    await functions.updateViewAssignmentsById(viewId.value, del, writes, warehouseId);
    assignStatus.value = StatusIntent.SUCCESS;
    loaded.value = true;
    await init();
  } catch (error) {
    assignStatus.value = StatusIntent.FAILURE;
    console.error(error);

    await init();
  }
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getViewProtection(warehouseId, viewId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setViewProtection(warehouseId, viewId.value, !recursiveDeleteProtection.value);
    await getProtection();
  } catch (error) {
    console.error(error);
  }
}

function copyViewJson() {
  try {
    const jsonString = JSON.stringify(view, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy view JSON:', error);
  }
}
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}

.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.text-wrap {
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
