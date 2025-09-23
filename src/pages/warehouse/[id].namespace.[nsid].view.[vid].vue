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
          <v-tab value="details" @click="loadTabData">details</v-tab>
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
          <v-tab value="tasks" @click="loadTabData">tasks</v-tab>
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
                <v-row>
                  <v-col>
                    View SQL Statement:
                    <pre
                      class="language-sql"><code ref="codeRef" class="language-sql">{{ sqlStatement }}</code></pre>
                  </v-col>
                </v-row>
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

            <v-tabs-window-item value="details">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-information-outline</v-icon>
                        View Information
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>View UUID</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono">{{ view.metadata['view-uuid'] }}</span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(view.metadata['view-uuid'])
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>Format Version</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ view.metadata['format-version'] }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="view.metadata.location">
                          <v-list-item-title>Location</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ view.metadata.location }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="functions.copyToClipboard(view.metadata.location)"></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="view['metadata-location']">
                          <v-list-item-title>Metadata Location</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ view['metadata-location'] }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="functions.copyToClipboard(view['metadata-location'])"></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="view.metadata['current-version-id']">
                          <v-list-item-title>Current Version ID</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ view.metadata['current-version-id'] }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-table-cog</v-icon>
                        Schema Information
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item
                          v-if="view.metadata.schemas && view.metadata.schemas.length > 0">
                          <v-list-item-title>Total Schemas</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ view.metadata.schemas.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewSchema">
                          <v-list-item-title>Current Schema Fields</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ currentViewSchema?.fields?.length || 0 }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="view.metadata.versions && view.metadata.versions.length > 0">
                          <v-list-item-title>Total Versions</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ view.metadata.versions.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewVersion">
                          <v-list-item-title>Current Schema ID</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ currentViewVersion['schema-id'] }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Properties Section -->
                <v-row
                  v-if="
                    view.metadata.properties && Object.keys(view.metadata.properties).length > 0
                  ">
                  <v-col cols="12">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog-outline</v-icon>
                        View Properties
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text>
                        <v-row>
                          <v-col
                            v-for="(value, key) in view.metadata.properties"
                            :key="key"
                            cols="12"
                            md="6">
                            <v-list-item class="pa-0">
                              <v-list-item-title class="text-body-2 font-weight-medium">
                                {{ key }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="font-mono text-wrap">
                                {{ value }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Current Version Details -->
                <v-row v-if="currentViewVersion">
                  <v-col cols="12">
                    <v-card variant="outlined">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-eye-outline</v-icon>
                        Current Version Details
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Version ID</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono">
                              {{ currentViewVersion['version-id'] }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(String(currentViewVersion['version-id']))
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewVersion['timestamp-ms']">
                          <v-list-item-title>Created</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTimestamp(currentViewVersion['timestamp-ms']) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            currentViewVersion.representations &&
                            currentViewVersion.representations[0]
                          ">
                          <v-list-item-title>SQL Query</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ currentViewVersion.representations[0].sql }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(currentViewVersion.representations[0].sql)
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewVersion.summary">
                          <v-list-item-title>Summary</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-row>
                              <v-col
                                v-for="(value, key) in currentViewVersion.summary"
                                :key="key"
                                cols="12"
                                md="6">
                                <v-list-item class="pa-0" density="compact">
                                  <v-list-item-title class="text-caption">
                                    {{ key }}
                                  </v-list-item-title>
                                  <v-list-item-subtitle class="font-mono">
                                    {{ value }}
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-col>
                            </v-row>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
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
            <v-tabs-window-item value="tasks">
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
const recursiveDeleteProtection = ref(false);

const currentVersionId = ref(0);
const sqlStatement = ref('');
async function loadTabData() {
  await init();
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

    Object.assign(
      existingPermissions,
      canReadPermissions.value
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

// Helper functions for details tab
function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
}

function getCurrentViewVersion() {
  if (!view.metadata.versions || view.metadata.versions.length === 0) return null;
  return view.metadata.versions.find(
    (version) => version['version-id'] === view.metadata['current-version-id'],
  );
}

function getCurrentViewSchema() {
  if (!view.metadata.schemas || view.metadata.schemas.length === 0) return null;
  const currentVersion = getCurrentViewVersion();
  if (!currentVersion) return null;
  return view.metadata.schemas.find(
    (schema) => schema['schema-id'] === currentVersion['schema-id'],
  );
}

// Computed properties for safe access
const currentViewVersion = computed(() => getCurrentViewVersion());
const currentViewSchema = computed(() => getCurrentViewSchema());
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}
</style>
