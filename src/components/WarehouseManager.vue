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
    <v-toolbar class="mb-4" color="transparent" density="compact" flat>
      <v-toolbar-title>
        <span class="text-subtitle-1">Warehouses</span>
      </v-toolbar-title>
      <template #prepend>
        <v-icon>mdi-warehouse</v-icon>
      </template>
      <v-spacer></v-spacer>
      <WarehouseAddDialog
        v-if="canCreateWarehouse"
        v-bind="addWarehouseProps"
        @added-warehouse="listWarehouse" />
    </v-toolbar>

    <v-data-table
      v-if="canListWarehouses"
      height="60vh"
      fixed-header
      :headers="headers"
      hover
      items-per-page="50"
      :items="filteredWarehouses"
      :sort-by="sortBy"
      :items-per-page-options="[
        { title: '50 items', value: 50 },
        { title: '100 items', value: 100 },
      ]">
      <template #top>
        <v-toolbar color="transparent" density="compact" flat>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="searchWarehouse"
            label="Filter results"
            prepend-inner-icon="mdi-filter"
            variant="underlined"
            hide-details
            clearable></v-text-field>
        </v-toolbar>
      </template>
      <template #item.name="{ item }">
        <td class="pointer-cursor" @click="navigateToWarehouse(item)">
          <span class="icon-text">
            <component :is="getStorageIcon(item)" />
            <v-icon class="mr-2">mdi-database</v-icon>
            {{ item.name }}
          </span>
        </td>
      </template>
      <template #item.actions="{ item }">
        <DeleteConfirmDialog
          v-if="item.can_delete"
          type="warehouse"
          :name="item.name"
          @confirmed="deleteWarehouse(item.id)" />
      </template>
      <template #no-data>
        <WarehouseAddDialog
          v-if="canCreateWarehouse"
          v-bind="addWarehouseProps"
          @added-warehouse="listWarehouse" />
      </template>
    </v-data-table>

    <div v-else>You don't have permission to list warehouses</div>
  </span>
</template>

<script lang="ts" setup>
import { h, onMounted, reactive, ref, computed, watch } from 'vue';
import { Intent, ObjectType } from '@/common/enums';
import { GetWarehouseResponse } from '@/gen/management/types.gen';
import router from '@/router';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { usePermissionStore } from '@/stores/permissions';
import { useProjectPermissions } from '@/composables/usePermissions';
import { Header } from '@/common/interfaces';
import { VIcon, VImg } from 'vuetify/components';

const functions = useFunctions();
const visual = useVisualStore();

const projectId = computed(() => visual.projectSelected['project-id']);
const { loading, canCreateWarehouse, canListWarehouses, permissions } =
  useProjectPermissions(projectId);

console.log('WarehouseManager - projectId:', projectId.value);
console.log('WarehouseManager - loading:', loading.value);
console.log('WarehouseManager - permissions:', permissions.value);
console.log('WarehouseManager - canListWarehouses:', canListWarehouses.value);
console.log('WarehouseManager - canCreateWarehouse:', canCreateWarehouse.value);

const searchWarehouse = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const sortBy = [{ key: 'name', order: 'asc' as const }];

const addWarehouseProps = {
  intent: Intent.CREATE,
  objectType: ObjectType.WAREHOUSE,
  processStatus: 'starting' as const,
  warehouse: undefined,
};

type GetWarehouseResponseExtended = GetWarehouseResponse & {
  actions: string[];
  can_delete?: boolean;
  'storage-credentials'?: {
    'credential-type'?: string;
  };
};

const whResponse = reactive<GetWarehouseResponseExtended[]>([]);

const filteredWarehouses = computed(() => {
  if (!searchWarehouse.value) {
    return whResponse; // Returns the full list if the search is empty
  }

  const searchLower = searchWarehouse.value.toLowerCase();

  return whResponse.filter((warehouse) => {
    // Matches if 'name' contains the search term
    const nameMatches = warehouse.name ? warehouse.name.toLowerCase().includes(searchLower) : false;

    // Matches if 'id' contains the search term (only if search term has UUID semantic)
    const hasUuidSemantic = /^[0-9a-f-]+$/.test(searchLower);
    const idMatches =
      warehouse.id && hasUuidSemantic ? warehouse.id.toLowerCase().includes(searchLower) : false;

    return nameMatches || idMatches;
  });
});

// Helper function to determine storage icon
function getStorageIcon(item: GetWarehouseResponseExtended) {
  const profile = item['storage-profile'];

  if (profile.type === 's3') {
    if (profile.flavor === 'aws') {
      return h(VIcon, { class: 'mr-2', color: 'orange', size: 'large' }, () => 'mdi-aws');
    }

    if (profile.endpoint?.includes('cloudflarestorage')) {
      return h(VImg, {
        class: 'mb-2 mr-2',
        src: '/src/assets/cf.svg',
        width: 24,
      });
    }

    // Generic S3
    return h(VImg, {
      class: 'mb-2 mr-2',
      src: '/src/assets/s3.svg',
      width: 24,
    });
  }

  if (profile.type === 'adls') {
    return h(
      VIcon,
      { class: 'mr-2', color: 'primary', size: 'large' },
      () => 'mdi-microsoft-azure',
    );
  }

  if (profile.type === 'gcs') {
    return h(VIcon, { class: 'mr-2', color: 'info', size: 'large' }, () => 'mdi-google-cloud');
  }

  return null;
}

onMounted(async () => {
  if (canListWarehouses.value) {
    await listWarehouse();
  }
});

// Watch for permission changes and load warehouses when we get permission
watch(canListWarehouses, async (newValue) => {
  if (newValue) {
    await listWarehouse();
  }
});

async function listWarehouse() {
  try {
    whResponse.splice(0, whResponse.length);
    const wh = await functions.listWarehouses();

    Object.assign(whResponse, wh.warehouses);

    const permissionStore = usePermissionStore();

    // Batch load permissions for all warehouses in parallel
    await Promise.all(
      whResponse.map(async (warehouse) => {
        const warehouseAccess = await permissionStore.getWarehousePermissions(warehouse.id);
        warehouse.can_delete = warehouseAccess.includes('delete');
      }),
    );
  } catch (error) {
    console.error('Error loading warehouses:', error);
  }
}

function navigateToWarehouse(item: GetWarehouseResponseExtended) {
  visual.whId = item.id;
  visual.wahrehouseName = item.name;
  router.push(`/warehouse/${item.id}`);
}

async function deleteWarehouse(id: string) {
  try {
    await functions.deleteWarehouse(id);
    await listWarehouse();
  } catch (error) {
    console.error('Error deleting warehouse:', error);
  }
}
</script>
