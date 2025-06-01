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
        <BreadcrumbsFromUrl v-if="!renaming" :url="route.fullPath" />

        <v-toolbar color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{ selectedWarehouse.name }}

              <v-chip size="small" color="secondary" label class="ma-2">
                <v-icon icon="mdi-table" start></v-icon>
                number of tables: {{ stats[0]['number-of-tables'] }}
              </v-chip>
              <v-chip size="small" color="primary" label class="ma-2">
                <v-icon icon="mdi-view-grid-outline" start></v-icon>
                number of views: {{ stats[0]['number-of-views'] }}
              </v-chip>
              <StatisticsDialog :stats="stats"></StatisticsDialog>
            </span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-database</v-icon>
          </template>
          <v-spacer></v-spacer>
          <WarehouseActionsMenu
            :process-status="processStatus"
            :warehouse="selectedWarehouse"
            :project-id="selectedWarehouse['project-id']"
            :idp-authority="env.idpAuthority"
            :enabled-authentication="env.enabledAuthentication"
            :user="user"
            :metadata-url="userFunctions.userManager.settings.metadataUrl"
            @close="processStatus = 'starting'"
            @rename-warehouse="renameWarehouse"
            @update-credentials="updateCredentials"
            @update-delprofile="updateDelProfile"
            @update-profile="updateProfile" />

          <AddNamespaceDialog
            v-if="myAccess.includes('create_namespace')"
            :parent-path="''"
            :status-intent="createNamespaceStatus"
            @add-namespace="addNamespace" />
        </v-toolbar>

        <v-tabs v-model="tab" density="compact">
          <v-tab density="compact" value="namespaces" @click="loadTabData">namespaces</v-tab>
          <v-tab
            v-if="canReadPermissions && enabledAuthentication && enabledPermissions"
            density="compact"
            value="permissions"
            @click="loadTabData">
            permissions
          </v-tab>
          <v-tab density="compact" value="details" @click="loadTabData">Details</v-tab>
        </v-tabs>
        <v-card>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="namespaces">
              <v-data-table
                height="60vh"
                :search="searchNamespace"
                fixed-header
                :headers="headers"
                hover
                items-per-page="50"
                :items="loadedWarehouseItems"
                :sort-by="[{ key: 'name', order: 'asc' }]"
                :items-per-page-options="[
                  { title: '50 items', value: 50 },
                  { title: '100 items', value: 100 },
                ]"
                @update:options="paginationCheckNamespace($event)">
                <template #top>
                  <v-toolbar color="transparent" density="compact" flat>
                    <v-switch
                      v-model="recursiveDeleteProtection"
                      class="ml-4 mt-4"
                      color="info"
                      :label="
                        !selectedWarehouse.protected
                          ? 'Recursive Delete Protection disabled'
                          : 'Recursive Delete Protection enabled'
                      "
                      @click="setProtection"></v-switch>
                    <v-spacer></v-spacer>
                    <v-text-field
                      v-model="searchNamespace"
                      label="Search"
                      prepend-inner-icon="mdi-magnify"
                      variant="underlined"
                      hide-details
                      clearable
                      single-line></v-text-field>
                  </v-toolbar>
                </template>
                <template #item.name="{ item }">
                  <td class="pointer-cursor" @click="routeToNamespace(item)">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-folder</v-icon>
                      {{ item.name }}
                    </span>
                  </td>
                </template>

                <template #item.actions="{ item }">
                  <DialogDelete
                    v-if="item.type === 'namespace'"
                    :disabled="!myAccess.includes('delete')"
                    :type="item.type"
                    :name="item.name"
                    @delete-with-options="deleteNamespaceWithOptions($event, item)"></DialogDelete>
                </template>

                <template #no-data>
                  <AddNamespaceDialog
                    v-if="myAccess.includes('create_namespace')"
                    :parent-path="''"
                    :status-intent="createNamespaceStatus"
                    @add-namespace="addNamespace" />
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="details">
              <v-card-text>
                <v-row>
                  <v-col cols="10">
                    <!--S3 Details-->
                    <v-list v-if="selectedWarehouse['storage-profile'].type === 's3'" dense>
                      <v-list-item>
                        <v-list-item-title>ID</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.id }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Project ID</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['project-id'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>
                          Recursive Delete Protection is
                          {{ selectedWarehouse.protected ? 'ON' : 'OFF' }}
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Storage Type</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Bucket</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].bucket }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Key Prefix</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['key-prefix'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Assume Role ARN</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['assume-role-arn'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="selectedWarehouse['storage-profile'].type === 's3'">
                        <v-list-item-title>Endpoint</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].endpoint }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Region</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].region }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Path Style Access</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['path-style-access'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>STS Role ARN</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['sts-role-arn'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>STS Enabled</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['sts-enabled'] ? 'Yes' : 'No' }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Flavor</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].flavor }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Status</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.status }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Allow Alternative Protocols (s3a)</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['allow-alternative-protocols'] }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Deletion Profile</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="selectedWarehouse['delete-profile'].type == 'soft'">
                        <v-list-item-title>Expiration Seconds</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile']['expiration-seconds'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                    <!--Azure Details-->
                    <v-list v-if="selectedWarehouse['storage-profile'].type === 'adls'" dense>
                      <v-list-item>
                        <v-list-item-title>ID</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.id }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Project ID</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['project-id'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Recursive Delete Protection is</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse.protected ? 'on' : 'off' }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Storage Type</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Account Name</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['account-name'] }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Filesystem</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].filesystem }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Key Prefix</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['key-prefix'] }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Status</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.status }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Deletion Profile</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="selectedWarehouse['delete-profile'].type == 'soft'">
                        <v-list-item-title>Expiration Seconds</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile']['expiration-seconds'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>

                    <!--GCS Details-->
                    <v-list v-if="selectedWarehouse['storage-profile'].type === 'gcs'" dense>
                      <v-list-item>
                        <v-list-item-title>ID</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.id }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Project ID</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['project-id'] }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Storage Type</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Bucket</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile'].bucket }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Key-prefix</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['storage-profile']['key-prefix'] }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Status</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedWarehouse.status }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Deletion Profile</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile'].type }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="selectedWarehouse['delete-profile'].type == 'soft'">
                        <v-list-item-title>Expiration Seconds</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedWarehouse['delete-profile']['expiration-seconds'] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
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
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </span>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import {
  AssignmentCollection,
  Header,
  Item,
  Options,
  RelationType,
  Type,
} from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { computed, onMounted, reactive, ref } from 'vue';
import router from '../../router';
import {
  GetWarehouseResponse,
  GetWarehouseStatisticsResponse,
  NamespaceAction,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
  WarehouseAction,
  WarehouseAssignment,
  WarehouseStatistics,
} from '@/gen/management/types.gen';

import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';
import {
  PermissionManager,
  AddNamespaceDialog,
  BreadcrumbsFromUrl,
  DialogDelete,
  AppFunctions,
  FUNCTIONS_INJECTION_KEY,
  WarehouseActionsMenu,
  StatisticsDialog,
} from '@lakekeeper/console-components';
import * as env from '@/app.config';
import { useAuth } from '@/plugins/auth';
import { User } from '@/common/interfaces';

const userFunctions = useAuth();
const functions = useFunctions();
const route = useRoute();

const user = env.enabledAuthentication
  ? ((await userFunctions.refreshToken()) as User)
  : ({ access_token: '', token_expires_at: 0 } as User);
const assignStatus = ref(StatusIntent.INACTIVE);

const recursiveDeleteProtection = ref(false);
const tab = ref('overview');
const loading = ref(true);
const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const loaded = ref(true);
const searchNamespace = ref('');

const storageProfile = reactive<StorageProfile>({
  type: 's3',
  bucket: '',
  'key-prefix': '',
  'assume-role-arn': '',
  endpoint: '',
  region: '',
  'path-style-access': null,
  'sts-role-arn': '',
  'sts-enabled': false,
  flavor: undefined,
});

const selectedWarehouse = reactive<GetWarehouseResponse>({
  'delete-profile': {
    type: 'hard',
  },
  id: '',
  name: '',
  'project-id': '',
  status: 'active',
  'storage-profile': storageProfile,
  protected: false, // Added the missing 'protected' property
});

const loadedWarehouseItems: Item[] = reactive([]);
const permissionType = ref<RelationType>('warehouse');
const existingPermissions = reactive<WarehouseAssignment[]>([]);
const namespaceId = ref('');
const myAccess = reactive<WarehouseAction[] | NamespaceAction[]>([]);
// const myAccessParent = reactive<WarehouseAction[] | NamespaceAction[]>([]);
const relationId = ref('');
const canReadPermissions = ref(false);
const visual = useVisualStore();
const createNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);
const processStatus = ref('starting');
const stats = reactive<WarehouseStatistics[]>([
  {
    'number-of-tables': 3,
    'number-of-views': 0,
    timestamp: '1900-01-01T00:00:00Z',
    'updated-at': '1900-01-01T00:00:00.000000Z',
  },
]);
const paginationTokenNamespace = ref('');
const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

const params = computed(() => route.params as { id: string });
const renaming = ref(false);
async function loadWarehouse() {
  const whResponse = await functions.getWarehouse(params.value.id);
  recursiveDeleteProtection.value = whResponse.protected;
  if (whResponse) {
    permissionObject.id = whResponse.id;
    permissionObject.name = whResponse.name;
    visual.wahrehouseName = whResponse.name;
    visual.whId = whResponse.id;
    Object.assign(selectedWarehouse, whResponse);
  }
}
async function loadTabData() {
  if (tab.value === 'namespaces') {
    await listNamespaces();
  } else if (tab.value === 'permissions') {
    await init();
  } else if (tab.value === 'details') {
    await loadWarehouse();
  }
}

// Create AppFunctions object for injection into child components
const appFunctions: AppFunctions = {
  getUser: functions.getUser,
  getRole: functions.getRole,
  searchUser: functions.searchUser,
  searchRole: functions.searchRole,
  ...(functions.setWarehouseManagedAccess && {
    setWarehouseManagedAccess: functions.setWarehouseManagedAccess,
  }),
  ...(functions.setNamespaceManagedAccess && {
    setNamespaceManagedAccess: functions.setNamespaceManagedAccess,
  }),
  // Removed getWarehouseById due to type incompatibility
  ...(functions.getWarehouse && { getWarehouse: functions.getWarehouse }),
  ...(functions.getNamespaceById && { getNamespaceById: functions.getNamespaceById }),
};

// Provide functions to child components
provide(FUNCTIONS_INJECTION_KEY, appFunctions);
async function init() {
  try {
    loaded.value = false;

    myAccess.splice(0, myAccess.length);
    namespaceId.value = '';
    relationId.value = params.value.id;
    existingPermissions.splice(0, existingPermissions.length);
    loadedWarehouseItems.splice(0, loadedWarehouseItems.length);

    Object.assign(myAccess, await functions.getWarehouseAccessById(params.value.id));

    canReadPermissions.value = !!myAccess.includes('read_assignments');

    Object.assign(
      existingPermissions,
      canReadPermissions.value ? await functions.getWarehouseAssignmentsById(params.value.id) : [],
    );
    loaded.value = true;
    await Promise.all([loadWarehouse(), listNamespaces(), getWarehouseStatistics()]);
    loading.value = false;
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheckNamespace(option: Options) {
  if (loadedWarehouseItems.length >= 10000) return;

  if (
    option.page * option.itemsPerPage == loadedWarehouseItems.length &&
    paginationTokenNamespace.value != ''
  ) {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      visual.whId,
      undefined,
      paginationTokenNamespace.value,
    );

    paginationTokenNamespace.value = nextPageToken || '';
    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedWarehouseItems.push(...mappedItems.flat());
    }
  }
}

async function addNamespace(namespace: string[]) {
  try {
    createNamespaceStatus.value = StatusIntent.STARTING;
    const res = await functions.createNamespace(params.value.id, namespace);
    if (res.error) throw res.error;
    createNamespaceStatus.value = StatusIntent.SUCCESS;

    await init();
  } catch (error) {
    createNamespaceStatus.value = StatusIntent.FAILURE;

    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setWarehouseProtection(selectedWarehouse.id, !recursiveDeleteProtection.value);

    await loadWarehouse();
  } catch (error) {
    console.error(error);
  }
}

async function deleteNamespaceWithOptions(e: any, item: Item) {
  try {
    const res = await functions.dropNamespace(
      params.value.id,
      item.parentPath.join(String.fromCharCode(0x1f)),
      e,
    );
    if (res.error) throw res.error;

    await listNamespaces();
  } catch (error: any) {
    console.error(`Failed to drop namespace-${item.name}  - `, error);
  }
}

async function routeToNamespace(item: Item) {
  router.push(`/warehouse/${params.value.id}/namespace/${item.name}`);
}

async function listNamespaces(item?: Item, parent?: string) {
  try {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      params.value.id,
      parent,
    );

    paginationTokenNamespace.value = nextPageToken || '';

    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedWarehouseItems.splice(0, loadedWarehouseItems.length);
      Object.assign(loadedWarehouseItems, mappedItems);
    }
  } catch (error) {
    console.error(error);
  }
}

onMounted(init);

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as WarehouseAssignment[]; // Define 'del' variable
    const writes = permissions.writes as WarehouseAssignment[]; // Define 'del' variable

    await functions.updateWarehouseAssignmentsById(relationId.value, del, writes);
    assignStatus.value = StatusIntent.SUCCESS;

    await init();
  } catch (error) {
    assignStatus.value = StatusIntent.FAILURE;

    console.error(error);

    await init();
  }
}

async function getWarehouseStatistics() {
  try {
    const stat: GetWarehouseStatisticsResponse = await functions.getWarehouseStatistics(
      params.value.id,
    );

    // stats.splice(0, stats.length);
    Object.assign(stats, stat.stats);
  } catch (error: any) {
    console.error(`Failed to get warehouse-statistics  - `, error);
  }
}

async function renameWarehouse(name: string) {
  try {
    renaming.value = true;
    await functions.renameWarehouse(params.value.id, name);

    await loadWarehouse();
    renaming.value = false;
  } catch (error: any) {
    renaming.value = false;
    console.error(`Failed to rename warehouse-${name}  - `, error);
  }
}

async function updateCredentials(credentials: StorageCredential) {
  try {
    processStatus.value = 'running';

    await functions.updateStorageCredential(params.value.id, credentials);
    await loadWarehouse();
    processStatus.value = 'success';
  } catch (error: any) {
    processStatus.value = 'error';

    console.error(`Failed to update credentials for warehouse-${params.value.id}  - `, error);
  }
}

async function updateProfile(newPprofile: {
  profile: StorageProfile;
  credentials: StorageCredential;
}) {
  try {
    processStatus.value = 'running';
    await functions.updateStorageProfile(
      params.value.id,
      newPprofile.credentials,
      newPprofile.profile,
    );

    await loadWarehouse();
    processStatus.value = 'success';
  } catch (error: any) {
    processStatus.value = 'error';
    console.error(`Failed to update profile for warehouse-${params.value.id}  - `, error);
  }
}
async function updateDelProfile(profile: TabularDeleteProfile) {
  try {
    await functions.updateWarehouseDeleteProfile(params.value.id, profile);
    await loadWarehouse();
    visual.setSnackbarMsg({
      function: 'updateDelProfile',
      text: 'Deletion profile updated successfully',
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
  } catch (error: any) {
    console.error(`Failed to update deletion profile for warehouse-${params.value.id}  - `, error);
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
