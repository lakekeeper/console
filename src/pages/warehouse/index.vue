<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"
        ></v-progress-circular>
      </v-row>

      ></v-responsive
    >
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <v-breadcrumbs :items="['warhouses']"></v-breadcrumbs>
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">Warehouses </span>
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
            @added-warehouse="listWarhouse"
          />
        </v-toolbar>
        <v-data-table
          v-if="myAccess.includes('list_warehouses')"
          fixed-header
          :headers="headers"
          hover
          :items="whResponse"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
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
                  size="large"
                  >mdi-aws</v-icon
                >
                <v-img
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'].flavor !== 'aws'
                  "
                  class="mb-2 mr-2"
                  src="@/assets/s3.svg"
                  :width="24"
                ></v-img>
                <v-icon
                  v-if="item['storage-profile'].type === 'adls'"
                  class="mr-2"
                  color="primary"
                  size="large"
                  >mdi-microsoft-azure</v-icon
                >
                <v-icon
                  v-if="item['storage-profile'].type === 'gcs'"
                  class="mr-2"
                  color="info"
                  size="large"
                  >mdi-google-cloud</v-icon
                >
                <v-icon class="mr-2">mdi-database</v-icon>

                {{ item.name }}</span
              >
            </td>
          </template>
          <template #item.actions="{ item }">
            <span icon-text>
              <v-icon
                v-if="item.actions.includes('view')"
                class="mr-1"
                color="error"
                :disabled="!myAccess.includes('delete')"
                @click="deleteWarehouse(item.id)"
                >mdi-delete-outline</v-icon
              >
            </span>
          </template>
          <template #no-data>
            <AddWarehouseDialog
              v-if="myAccess.includes('create_warehouse')"
              :intent="Intent.CREATE"
              :object-type="ObjectType.WAREHOUSE"
              :process-status="'starting'"
              :warehouse="undefined"
              @added-warehouse="listWarhouse"
            />
          </template>
        </v-data-table>
        <div v-else>You don't have permission to list warehouses</div>
      </v-col>
    </v-row>
    <DeletingDialog :deleting="deleting" />
  </span>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { Intent, ObjectType } from "../../common/enums";

import {
  GetWarehouseResponse,
  ProjectAction,
} from "../../gen/management/types.gen";

import router from "../../router";
import { useFunctions } from "../../plugins/functions";
import { useVisualStore } from "../../stores/visual";
import { Header } from "../../common/interfaces";
const functions = useFunctions();
const missAccessPermission = ref(true);
const loading = ref(true);

const headers: readonly Header[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
  { title: "Actions", key: "actions", align: "end", sortable: false },
]);
const myAccess = reactive<ProjectAction[]>([]);

type GetWarehouseResponseExtended = GetWarehouseResponse & {
  actions: string[];
};
const whResponse = reactive<GetWarehouseResponseExtended[]>([]);
const visual = useVisualStore();
const deleting = ref(false);
onMounted(async () => {
  try {
    visual.whId = "";
    visual.wahrehouseName = "";
    Object.assign(myAccess, await functions.getProjectAccess());
    if (myAccess.includes("list_warehouses")) await listWarhouse();
    loading.value = false;
  } catch (err: any) {
    missAccessPermission.value = false;
    console.error("Failed to load data:", err);
  }
});

async function listWarhouse() {
  try {
    whResponse.splice(0, whResponse.length);
    const wh = await functions.listWarehouses();

    wh.warehouses.forEach(() => {
      Object.assign(whResponse, wh.warehouses);
      whResponse.forEach((w) => {
        w.actions = [];

        w.actions.push("view", "info", "edit", "delete");
      });
    });
  } catch (error) {
    console.error(error);
  }
}

function navigateToWarehouse(item: any) {
  visual.whId = item.id;
  visual.wahrehouseName = item.name;
  router.push("/warehouse/" + item.id);
}

const deleteWarehouse = async (id: string) => {
  try {
    deleting.value = true;

    await functions.deleteWarehouse(id);
    whResponse.splice(0, whResponse.length);
    await listWarhouse();

    deleting.value = false;
  } catch (error) {
    deleting.value = false;
    console.error(error);
  }
};

onUnmounted(() => {
  visual.whId = "";
  visual.wahrehouseName = "";
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
