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

      >
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <v-breadcrumbs :items="['warehouses']"></v-breadcrumbs>
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">Warehouses</span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-warehouse</v-icon>
          </template>
          <v-spacer></v-spacer>
          <AddWarehouseDialog
            v-if="myAccess.includes('create_warehouse')"
            :intent="Intent.CREATE"
            :object-type="ObjectType.WAREHOUSE"
            :process-status="'starting'"
            :warehouse="undefined"
            @added-warehouse="listWarehouse" />
        </v-toolbar>
        <v-data-table
          v-if="myAccess.includes('list_warehouses')"
          height="60vh"
          fixed-header
          :headers="headers"
          hover
          items-per-page="50"
          :items="filteredWarehouses"
          :sort-by="[{ key: 'name', order: 'asc' }]"
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
                <v-icon
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'].flavor === 'aws'
                  "
                  class="mr-2"
                  color="orange"
                  size="large">
                  mdi-aws
                </v-icon>
                <v-img
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'] &&
                    item['storage-profile'].flavor !== 'aws' &&
                    item['storage-profile'].endpoint &&
                    !item['storage-profile'].endpoint.includes('cloudflarestorage')
                  "
                  class="mb-2 mr-2"
                  src="@/assets/s3.svg"
                  :width="24"></v-img>
                <v-img
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'] &&
                    item['storage-profile'].flavor !== 'aws' &&
                    item['storage-profile'].endpoint &&
                    item['storage-profile'].endpoint.includes('cloudflarestorage')
                  "
                  class="mb-2 mr-2"
                  src="@/assets/cf.svg"
                  :width="24"></v-img>
                <v-icon
                  v-if="item['storage-profile'].type === 'adls'"
                  class="mr-2"
                  color="primary"
                  size="large">
                  mdi-microsoft-azure
                </v-icon>
                <v-icon
                  v-if="item['storage-profile'].type === 'gcs'"
                  class="mr-2"
                  color="info"
                  size="large">
                  mdi-google-cloud
                </v-icon>
                <v-icon class="mr-2">mdi-database</v-icon>

                {{ item.name }}
              </span>
            </td>
          </template>
          <!--eslint-disable-next-line-->
          <template #item.actions="{ item }">
            <DialogDeleteConfirm
              v-if="item.can_delete"
              type="warehouse"
              :name="item.name"
              @confirmed="deleteWarehouse(item.id)" />
          </template>
          <template #no-data>
            <AddWarehouseDialog
              v-if="myAccess.includes('create_warehouse')"
              :intent="Intent.CREATE"
              :object-type="ObjectType.WAREHOUSE"
              :process-status="'starting'"
              :warehouse="undefined"
              @added-warehouse="listWarehouse" />
          </template>
        </v-data-table>
        <div v-else>You don't have permission to list warehouses</div>
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, onUnmounted, computed } from 'vue';
import { Intent, ObjectType } from '../../common/enums';

import { GetWarehouseResponse, ProjectAction } from '../../gen/management/types.gen';

import router from '../../router';
import { useFunctions } from '../../plugins/functions';
import { useVisualStore } from '../../stores/visual';
import { Header } from '../../common/interfaces';

const functions = useFunctions();
const missAccessPermission = ref(true);
const loading = ref(true);
const searchWarehouse = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);
const myAccess = reactive<ProjectAction[]>([]);

type GetWarehouseResponseExtended = GetWarehouseResponse & {
  actions: string[];
  can_delete?: boolean;
  'storage-credentials'?: {
    'credential-type'?: string;
  };
};
const whResponse = reactive<GetWarehouseResponseExtended[]>([]);
const visual = useVisualStore();

const filteredWarehouses = computed(() => {
  if (!searchWarehouse.value) {
    return whResponse; // Returns the full list if the search is empty
  }

  const searchLower = searchWarehouse.value.toLowerCase();

  return whResponse.filter((warehouse) => {
    // Only matches if 'name' ends with the search term
    const nameEndsWith = warehouse.name
      ? warehouse.name.toLowerCase().endsWith(searchLower)
      : false;

    // Only matches if 'id' ends with the search term
    const idEndsWith = warehouse.id ? warehouse.id.toLowerCase().endsWith(searchLower) : false;

    return nameEndsWith || idEndsWith;
  });
});

onMounted(async () => {
  try {
    visual.whId = '';
    visual.wahrehouseName = '';
    Object.assign(
      myAccess,
      await functions.getProjectAccessById(visual.projectSelected['project-id']),
    );
    if (myAccess.includes('list_warehouses')) await listWarehouse();
    loading.value = false;
  } catch (err: any) {
    missAccessPermission.value = false;
    console.error('Failed to load data:', err);
  }
});

async function listWarehouse() {
  try {
    whResponse.splice(0, whResponse.length);
    const wh = await functions.listWarehouses();

    Object.assign(whResponse, wh.warehouses);

    const accessPromises = whResponse.map(async (w) => {
      const warehouseAccess = await functions.getWarehouseAccessById(w.id);
      w.can_delete = warehouseAccess.includes('delete');
    });

    await Promise.all(accessPromises);
  } catch (error) {
    console.error(error);
  }
}

function navigateToWarehouse(item: any) {
  visual.whId = item.id;
  visual.wahrehouseName = item.name;
  router.push('/warehouse/' + item.id);
}

const deleteWarehouse = async (id: string) => {
  try {
    await functions.deleteWarehouse(id);
    await listWarehouse();
  } catch (error) {
    console.error(error);
  }
};

onUnmounted(() => {
  visual.whId = '';
  visual.wahrehouseName = '';
  loading.value = true;
});
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
