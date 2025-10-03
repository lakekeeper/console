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
        <BreadcrumbsFromUrl v-if="!renaming" />

        <WarehouseHeader
          :warehouse="selectedWarehouse"
          :stats="stats[0]"
          :process-status="processStatus"
          :can-create-namespace="canCreateNamespace"
          :create-namespace-status="createNamespaceStatus"
          @close="processStatus = 'starting'"
          @rename-warehouse="renameWarehouse"
          @update-credentials="updateCredentials"
          @update-delprofile="updateDelProfile"
          @update-profile="updateProfile"
          @open-search="openSearchDialog"
          @add-namespace="addNamespace" />

        <v-tabs v-model="tab" density="compact">
          <v-tab density="compact" value="namespaces">namespaces</v-tab>
          <v-tab
            v-if="canReadPermissions && enabledAuthentication && enabledPermissions"
            density="compact"
            value="permissions">
            permissions
          </v-tab>
          <v-tab density="compact" value="details">Details</v-tab>
          <v-tab
            v-if="canGetAllTasks || !enabledAuthentication || !enabledPermissions"
            density="compact"
            value="tasks">
            Tasks
          </v-tab>
        </v-tabs>
        <v-card>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="namespaces">
              <WarehouseNamespaces
                ref="namespacesComponent"
                :warehouse-id="params.id"
                :protected="selectedWarehouse.protected"
                :can-create-namespace="canCreateNamespace"
                :can-delete="canDelete"
                @update:protected="selectedWarehouse.protected = $event"
                @namespace-updated="handleNamespaceUpdated" />
            </v-tabs-window-item>
            <v-tabs-window-item value="details">
              <WarehouseDetails :warehouse="selectedWarehouse" />
            </v-tabs-window-item>
            <v-tabs-window-item v-if="canReadPermissions" value="permissions">
              <PermissionManager :object-id="params.id" :relation-type="RelationType.Warehouse" />
            </v-tabs-window-item>
            <v-tabs-window-item
              v-if="(canGetAllTasks || !enabledAuthentication || !enabledPermissions) && loaded"
              value="tasks">
              <TaskManager
                :warehouse-id="params.id"
                entity-type="warehouse"
                :can-control-tasks="canControlAllTasks"
                :enabled-authentication="enabledAuthentication"
                :enabled-permissions="enabledPermissions" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Search Modal -->
    <SearchTabular v-model="showSearchDialog" :warehouse-id="params.id" />
  </span>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import { useWarehousePermissions } from '@/composables/usePermissions';
import TaskManager from '../../components/TaskManager.vue';
import SearchTabular from '../../components/SearchTabular.vue';
import WarehouseNamespaces from '../../components/WarehouseNamespaces.vue';
import WarehouseDetails from '../../components/WarehouseDetails.vue';
import WarehouseHeader from '../../components/WarehouseHeader.vue';
import { Type, RelationType } from '../../common/interfaces';
import { StatusIntent } from '../../common/enums';
import { useVisualStore } from '../../stores/visual';
import { computed, onMounted, ref } from 'vue';
import {
  GetWarehouseResponse,
  GetWarehouseStatisticsResponse,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
} from '@/gen/management/types.gen';

import { enabledAuthentication, enabledPermissions } from '@/app.config';
const functions = useFunctions();
const route = useRoute();

const tab = ref('overview');
const loading = ref(true);
const loaded = ref(true);
const showSearchDialog = ref(false);
const namespacesComponent = ref<InstanceType<typeof WarehouseNamespaces>>();

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
  protected: false,
});

const visual = useVisualStore();
const processStatus = ref('starting');
const createNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);
const stats = reactive([
  {
    'number-of-tables': 0,
    'number-of-views': 0,
    timestamp: '1900-01-01T00:00:00Z',
    'updated-at': '1900-01-01T00:00:00.000000Z',
  },
]);

const params = computed(() => route.params as { id: string });

// Use warehouse permissions composable
const {
  hasPermission,
  canCreateNamespace,
  canReadPermissions,
  canGetAllTasks,
  canControlAllTasks,
} = useWarehousePermissions(params.value.id);

const canDelete = computed(() => hasPermission('delete'));

const renaming = ref(false);

async function loadWarehouse() {
  const whResponse = await functions.getWarehouse(params.value.id);
  if (whResponse) {
    visual.wahrehouseName = whResponse.name;
    visual.whId = whResponse.id;
    Object.assign(selectedWarehouse, whResponse);
  }
}

async function init() {
  try {
    loaded.value = false;
    loaded.value = true;
    await Promise.all([loadWarehouse(), getWarehouseStatistics()]);
    loading.value = false;
  } catch (error) {
    console.error(error);
  }
}

async function handleNamespaceUpdated() {
  await Promise.all([loadWarehouse(), getWarehouseStatistics()]);
  // Also reload namespaces in the component
  if (namespacesComponent.value) {
    await namespacesComponent.value.loadNamespaces();
  }
}

async function addNamespace(namespace: string[]) {
  try {
    createNamespaceStatus.value = StatusIntent.STARTING;
    const res = await functions.createNamespace(params.value.id, namespace);
    if (res.error) throw res.error;
    createNamespaceStatus.value = StatusIntent.SUCCESS;

    await handleNamespaceUpdated();
  } catch (error) {
    createNamespaceStatus.value = StatusIntent.FAILURE;
    console.error(error);
  }
}

onMounted(init);

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

function openSearchDialog() {
  showSearchDialog.value = true;
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
