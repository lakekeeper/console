<template>
  <v-toolbar color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">
        {{ warehouse.name }}

        <v-chip size="small" color="secondary" label class="ma-2">
          <v-icon icon="mdi-table" start></v-icon>
          number of tables: {{ stats['number-of-tables'] }}
        </v-chip>
        <v-chip size="small" color="primary" label class="ma-2">
          <v-icon icon="mdi-view-grid-outline" start></v-icon>
          number of views: {{ stats['number-of-views'] }}
        </v-chip>
        <StatisticsDialog :stats="[stats]"></StatisticsDialog>
      </span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-database</v-icon>
    </template>
    <v-spacer></v-spacer>

    <WarehouseActionsMenu
      :process-status="processStatus"
      :warehouse="warehouse"
      @close="processStatus = 'starting'"
      @rename-warehouse="renameWarehouse"
      @update-credentials="updateCredentials"
      @update-delprofile="updateDelProfile"
      @update-profile="updateProfile" />
    <v-btn
      prepend-icon="mdi-magnify"
      class="mr-2"
      size="small"
      variant="outlined"
      @click="$emit('open-search')"
      aria-label="Search tables and views">
      Search Warehouse
    </v-btn>
    <addNamespaceDialog
      v-if="canCreateNamespace"
      :parent-path="''"
      :status-intent="createNamespaceStatus"
      @add-namespace="addNamespace" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import type {
  GetWarehouseResponse,
  GetWarehouseStatisticsResponse,
  StorageCredential,
  StorageProfile,
  TabularDeleteProfile,
} from '@/gen/management/types.gen';
import { StatusIntent } from '@/common/enums';
import { Type } from '@/common/interfaces';

const props = defineProps<{
  warehouse: GetWarehouseResponse;
  canCreateNamespace: boolean;
}>();

const emit = defineEmits<{
  (e: 'warehouse-updated'): void;
  (e: 'open-search'): void;
}>();

const functions = useFunctions();
const visual = useVisualStore();
const createNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);
const processStatus = ref('starting');

const stats = reactive({
  'number-of-tables': 0,
  'number-of-views': 0,
  timestamp: '1900-01-01T00:00:00Z',
  'updated-at': '1900-01-01T00:00:00.000000Z',
});

async function loadStatistics() {
  try {
    const stat: GetWarehouseStatisticsResponse = await functions.getWarehouseStatistics(
      props.warehouse.id,
    );
    Object.assign(stats, stat.stats[0]);
  } catch (error: any) {
    console.error(`Failed to get warehouse-statistics  - `, error);
  }
}

// Load statistics when component mounts
onMounted(() => {
  loadStatistics();
});

// Reload statistics when warehouse ID changes
watch(
  () => props.warehouse.id,
  () => {
    loadStatistics();
  },
);

async function addNamespace(namespace: string[]) {
  try {
    createNamespaceStatus.value = StatusIntent.STARTING;
    const res = await functions.createNamespace(props.warehouse.id, namespace);
    if (res.error) throw res.error;
    createNamespaceStatus.value = StatusIntent.SUCCESS;

    // Reload statistics and emit update
    await loadStatistics();
    emit('warehouse-updated');
  } catch (error) {
    createNamespaceStatus.value = StatusIntent.FAILURE;
    console.error(error);
  }
}

async function renameWarehouse(name: string) {
  try {
    await functions.renameWarehouse(props.warehouse.id, name);
    emit('warehouse-updated');
  } catch (error: any) {
    console.error(`Failed to rename warehouse-${name}  - `, error);
  }
}

async function updateCredentials(credentials: StorageCredential) {
  try {
    processStatus.value = 'running';
    await functions.updateStorageCredential(props.warehouse.id, credentials);
    emit('warehouse-updated');
    processStatus.value = 'success';
  } catch (error: any) {
    processStatus.value = 'error';
    console.error(`Failed to update credentials for warehouse-${props.warehouse.id}  - `, error);
  }
}

async function updateProfile(newProfile: {
  profile: StorageProfile;
  credentials: StorageCredential;
}) {
  try {
    processStatus.value = 'running';
    await functions.updateStorageProfile(
      props.warehouse.id,
      newProfile.credentials,
      newProfile.profile,
    );
    emit('warehouse-updated');
    processStatus.value = 'success';
  } catch (error: any) {
    processStatus.value = 'error';
    console.error(`Failed to update profile for warehouse-${props.warehouse.id}  - `, error);
  }
}

async function updateDelProfile(profile: TabularDeleteProfile) {
  try {
    await functions.updateWarehouseDeleteProfile(props.warehouse.id, profile);
    emit('warehouse-updated');
    visual.setSnackbarMsg({
      function: 'updateDelProfile',
      text: 'Deletion profile updated successfully',
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
  } catch (error: any) {
    console.error(
      `Failed to update deletion profile for warehouse-${props.warehouse.id}  - `,
      error,
    );
  }
}
</script>
