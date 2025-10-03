<template>
  <v-toolbar class="mb-4" color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">Warehouses</span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-warehouse</v-icon>
    </template>
    <v-spacer></v-spacer>
    <AddWarehouseDialog
      v-if="canCreateWarehouse"
      v-bind="addWarehouseProps"
      @added-warehouse="listWarehouse" />
  </v-toolbar>

  <v-data-table
    v-if="canListWarehouses"
    fixed-header
    :headers="headers"
    hover
    :items="whResponse"
    :sort-by="sortBy">
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
      <DialogDeleteConfirm
        v-if="item.can_delete"
        type="warehouse"
        :name="item.name"
        @confirmed="deleteWarehouse(item.id)" />
    </template>
    <template #no-data>
      <AddWarehouseDialog
        v-if="canCreateWarehouse"
        v-bind="addWarehouseProps"
        @added-warehouse="listWarehouse" />
    </template>
  </v-data-table>

  <div v-else>You don't have permission to list warehouses</div>
</template>

<script lang="ts" setup>
import { h, onMounted, reactive } from 'vue';
import { Intent, ObjectType } from '@/common/enums';
import { GetWarehouseResponse } from '@/gen/management/types.gen';
import router from '@/router';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { Header } from '@/common/interfaces';
import { VIcon, VImg } from 'vuetify/components';

const props = defineProps<{
  canCreateWarehouse: boolean;
  canListWarehouses: boolean;
}>();

const functions = useFunctions();
const visual = useVisualStore();

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
  if (props.canListWarehouses) {
    await listWarehouse();
  }
});

async function listWarehouse() {
  try {
    whResponse.splice(0, whResponse.length);
    const wh = await functions.listWarehouses();

    Object.assign(whResponse, wh.warehouses);

    // Batch load permissions for all warehouses
    await Promise.all(
      whResponse.map(async (warehouse) => {
        const warehouseAccess = await functions.getWarehouseAccessById(warehouse.id);
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

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}
</style>
