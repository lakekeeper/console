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
            v-if="enabledAuthorization && permissionEnabled"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
        </v-tabs>
        <v-card style="max-height: 75vh; overflow: auto; min-height: 55vh">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="overview">
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
              <vue-json-pretty :data="view" :deep="1" />
            </v-tabs-window-item>
            <v-tabs-window-item v-if="canReadPermissions" value="permissions">
              <PermissionManager
                v-if="loaded"
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
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import { LoadViewResult } from '../../gen/iceberg/types.gen';
import { TableAction, ViewAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';

import { enabledAuthorization } from '@/app.config';
import { useVisualStore } from '@/stores/visual';

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const crumbPath = ref('');
const loading = ref(true);
const visual = useVisualStore();

const myAccess = reactive<TableAction[]>([]);

const permissionType = ref<RelationType>('view');

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

const warehouseId = (route.params as { id: string }).id;
const namespaceId = (route.params as { nsid: string }).nsid;
const viewName = (route.params as { vid: string }).vid;
const viewId = ref('');
const view = reactive<LoadViewResult>({
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

const currentVersionId = ref(0);
const sqlStatement = ref('');
const permissionEnabled = computed(() => {
  return visual.projectInfo['authz-backend'] != 'allow-all';
});
async function loadTabData() {
  await init();
}

async function init() {
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

  Object.assign(myAccess, await functions.getViewAccessById(viewId.value));

  canReadPermissions.value = !!myAccess.includes('read_assignments');

  Object.assign(
    existingPermissions,
    canReadPermissions.value ? await functions.getViewAssignmentsById(viewId.value) : [],
  );
  loaded.value = true;
}

onMounted(async () => {
  await init();
  loading.value = false;
});

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    const del = permissions.del as ViewAssignment[];
    const writes = permissions.writes as ViewAssignment[];

    await functions.updateViewAssignmentsById(viewId.value, del, writes);
    await init();
  } catch (error) {
    console.error(error);

    await init();
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
