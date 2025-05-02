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
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
        </v-tabs>
        <v-card style="max-height: 75vh; overflow: auto; min-height: 55vh">
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
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
                </v-btn>
              </div>
              <vue-json-pretty
                :data="view"
                :deep="depthRawRepresentation"
                :theme="themeText"
                :showLineNumber="true"
                :virtual="true" />
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

const depthRawRepresentation = ref(1);
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
    Object.assign(myAccess, await functions.getViewAccessById(viewId.value));
    await getProtection();

    canReadPermissions.value = !!myAccess.includes('read_assignments');

    Object.assign(
      existingPermissions,
      canReadPermissions.value ? await functions.getViewAssignmentsById(viewId.value) : [],
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

    await functions.updateViewAssignmentsById(viewId.value, del, writes);
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
