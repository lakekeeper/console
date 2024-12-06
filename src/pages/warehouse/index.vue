<template>
  <v-container class="fill-height" v-if="loading">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          :size="126"
          indeterminate
          color="info"
        ></v-progress-circular>
      </v-row>

      ></v-responsive
    >
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <v-breadcrumbs :items="['warhouses']"></v-breadcrumbs>
        <v-toolbar flat density="compact" class="mb-4" color="transparent">
          <v-toolbar-title>
            <span class="text-subtitle-1">Warehouses </span>
          </v-toolbar-title>
          <template v-slot:prepend>
            <v-icon>mdi-warehouse</v-icon>
          </template>
          <v-spacer></v-spacer>
          <AddWarehouseDialog
            v-if="myAccess.includes('create_warehouse')"
            :warehouse="undefined"
            :intent="Intent.CREATE"
            :processStatus="'starting'"
            :object-type="ObjectType.WAREHOUSE"
            @added-warehouse="listWarhouse"
          />
        </v-toolbar>
        <v-data-table
          v-if="myAccess.includes('list_warehouses')"
          :headers="headers"
          fixed-header
          hover
          :items="whResponse"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
          <template v-slot:item.name="{ item }">
            <td @click="navigateToWarehouse(item)" class="pointer-cursor">
              <span class="icon-text">
                <v-icon
                  class="mr-2"
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'].flavor === 'aws'
                  "
                  color="orange"
                  size="large"
                  >mdi-aws</v-icon
                >
                <v-img
                  v-if="
                    item['storage-profile'].type === 's3' &&
                    item['storage-profile'].flavor !== 'aws'
                  "
                  :width="24"
                  src="@/assets/s3.svg"
                  class="mb-2 mr-2"
                ></v-img>
                <v-icon
                  class="mr-2"
                  v-if="item['storage-profile'].type === 'adls'"
                  color="primary"
                  size="large"
                  >mdi-microsoft-azure</v-icon
                >
                <v-icon
                  class="mr-2"
                  v-if="item['storage-profile'].type === 'gcs'"
                  color="info"
                  size="large"
                  >mdi-google-cloud</v-icon
                >
                <v-icon class="mr-2">mdi-database</v-icon>

                {{ item.name }}</span
              >
            </td>
          </template>
          <template v-slot:item.actions="{ item }">
            <span icon-text>
              <v-icon
                v-if="item.actions.includes('view')"
                :disabled="!myAccess.includes('delete')"
                class="mr-1"
                color="error"
                @click="deleteWarehouse(item.id)"
                >mdi-delete-outline</v-icon
              >
            </span>
          </template>
          <template v-slot:no-data>
            <AddWarehouseDialog
              v-if="myAccess.includes('create_warehouse')"
              :warehouse="undefined"
              :processStatus="'starting'"
              @added-warehouse="listWarhouse"
              :intent="Intent.CREATE"
              :object-type="ObjectType.WAREHOUSE"
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

const headers: readonly Header<any>[] = Object.freeze([
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

    wh.warehouses.forEach((w) => {
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
