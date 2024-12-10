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
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <BreadcrumbsFromUrl />
        <v-toolbar flat density="compact" class="mb-4" color="transparent">
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{
                namespacePath.length > 0
                  ? namespacePath.split(String.fromCharCode(0x1f)).join(".")
                  : selectedNamespace
              }}
            </span>
          </v-toolbar-title>
          <template v-slot:prepend>
            <v-icon>mdi-folder-open</v-icon>
          </template>
          <v-spacer></v-spacer>

          <addNamespaceDialog
            v-if="myAccess.includes('create_namespace')"
            @add-namespace="addNamespace"
            :parentPath="namespacePath"
            :status-intent="StatusIntent.STARTING"
          />
        </v-toolbar>
        <v-tabs v-model="tab">
          <v-tab value="namespaces" @click="loadTabData">namespaces</v-tab>
          <v-tab value="tables" @click="loadTabData">tables</v-tab>
          <v-tab value="views" @click="loadTabData">views</v-tab>
          <v-tab value="deleted" @click="loadTabData">deleted</v-tab>
          <v-tab
            value="permissions"
            v-if="can_read_permissions && enabledAuthorization"
          >
            Permissions
          </v-tab>
          <v-tab value="details">Details</v-tab>
        </v-tabs>
        <v-card style="max-height: 75vh; overflow: auto">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="namespaces">
              <v-data-table
                :headers="headers"
                fixed-header
                hover
                :items="loadedNamespaces"
                :sort-by="[{ key: 'name', order: 'asc' }]"
              >
                <template v-slot:item.name="{ item }">
                  <td @click="routeToNamespace(item)" class="pointer-cursor">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-folder</v-icon>
                      {{ item.name }}</span
                    >
                  </td>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon
                    v-if="item.type === 'namespace'"
                    :disabled="!myAccess.includes('delete')"
                    color="error"
                    @click="dropNamespace(item)"
                    >mdi-delete-outline</v-icon
                  >
                </template>
                <template v-slot:no-data>
                  <addNamespaceDialog
                    v-if="myAccess.includes('create_namespace')"
                    @add-namespace="addNamespace"
                    :parentPath="namespacePath"
                    :status-intent="StatusIntent.STARTING"
                  />
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="tables">
              <v-data-table
                :headers="headers"
                fixed-header
                hover
                :items="loadedTables"
                :sort-by="[{ key: 'name', order: 'asc' }]"
              >
                <template v-slot:item.name="{ item }">
                  <td class="pointer-cursor" @click="routeToTable(item)">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-table</v-icon>
                      {{ item.name }}</span
                    >
                  </td>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon
                    :disabled="!myAccess.includes('delete')"
                    color="error"
                    @click="dropTable(item)"
                    >mdi-delete-outline</v-icon
                  >
                </template>
                <template v-slot:no-data>
                  <div>No table in this namespace</div>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="views">
              <v-data-table
                :headers="headers"
                fixed-header
                hover
                :items="loadedViews"
                :sort-by="[{ key: 'name', order: 'asc' }]"
              >
                <template v-slot:item.name="{ item }">
                  <td class="pointer-cursor" @click="routeToView(item)">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-view-grid-outline</v-icon>
                      {{ item.name }}</span
                    >
                  </td>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon
                    :disabled="!myAccess.includes('delete')"
                    @click="dropView(item)"
                    color="error"
                    >mdi-delete-outline</v-icon
                  >
                </template>
                <template v-slot:no-data>
                  <div>No views in this namespace</div>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="deleted">
              <v-data-table
                :headers="headersDeleted"
                fixed-header
                hover
                :items="deletedTabulars"
                :sort-by="[{ key: 'name', order: 'asc' }]"
              >
                <template v-slot:item.name="{ item }">
                  <td class="pointer-cursor">
                    <span class="icon-text">
                      <v-icon class="mr-2" v-if="item.type == 'view'"
                        >mdi-view-grid-outline</v-icon
                      >
                      <v-icon class="mr-2" v-else>mdi-table</v-icon>
                      {{ item.name }} {{ item.type }}</span
                    >
                  </td>
                </template>

                <template v-slot:no-data>
                  <div>No deleted tabulars in this namespace</div>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="permissions" v-if="can_read_permissions">
              <PermissionManager
                v-if="loaded"
                :assignableObj="permissionObject"
                :relationType="permissionType"
                :existingPermissionsFromObj="existingPermissions"
                @permissions="assign"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import { useRoute } from "vue-router"; // Import the useRoute function from vue-router
import { useVisualStore } from "../../stores/visual";
import { useFunctions } from "../../plugins/functions";
import { onMounted, reactive, onUnmounted, watch, computed, ref } from "vue";
import router from "../../router";
import {
  AssignmentCollection,
  RelationType,
  Item,
  Header,
} from "../../common/interfaces";

import {
  DeletedTabularResponse,
  NamespaceAction,
  NamespaceAssignment,
  WarehouseAssignment,
} from "../../gen/management/types.gen";
import {
  GetNamespaceResponse,
  TableIdentifier,
} from "../../gen/iceberg/types.gen";

import { enabledAuthorization } from "@/app.config";
import { StatusIntent } from "@/common/enums";

const visual = useVisualStore();
const route = useRoute();
const functions = useFunctions();
const loading = ref(true);
const loaded = ref(false);
const can_read_permissions = ref(false);

const items: Item[] = reactive([]);
const permissionType = ref<RelationType>("namespace");
const existingPermissions = reactive<WarehouseAssignment[]>([]);
// const namespaceId = ref<string>("");

const headers: readonly Header<any>[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
  { title: "Actions", key: "actions", align: "end", sortable: false },
]);

const headersDeleted: readonly Header<any>[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
]);

const loadedNamespaces: Item[] = reactive([]);
export type TableIdentifierExtended = TableIdentifier & {
  actions: string[];
  type: string;
};

type DeletedTabularResponseExtended = DeletedTabularResponse & {
  actions: string[];
  type: string;
};
const loadedTables: TableIdentifierExtended[] = reactive([]);
const loadedViews: TableIdentifierExtended[] = reactive([]);
const deletedTabulars: DeletedTabularResponseExtended[] = reactive([]);

const relationId = ref("");
const selectedNamespace = ref("");
const namespacePath = ref<string>((route.params as { nsid: string }).nsid);
const watchedNamespacePath = computed(() => namespacePath.value);
const whid = ref<string>((route.params as { id: string }).id);
const tab = ref("overview");
const myAccess = reactive<NamespaceAction[]>([]);
// const myAccessParent = reactive<NamespaceAction[]>([]);
const namespace = reactive<GetNamespaceResponse>({
  namespace: [],
});
const namespace_id = computed(() => namespace.properties?.namespace_id);
const permissionObject = reactive<any>({
  id: "",
  description: "",
  name: "",
});

onMounted(async () => {
  await init();
  loading.value = false;
});

onUnmounted(() => {
  items.splice(0, items.length);
});

async function loadTabData() {
  if (tab.value === "namespaces") {
    await listNamespaces();
  } else if (tab.value === "permissions") {
    await init();
  } else if (tab.value === "tables") {
    await listTables();
  } else if (tab.value === "views") {
    await listViews();
  } else if (tab.value === "deleted") {
    await listDeletedTabulars();
  }
}

async function init() {
  try {
    loaded.value = false;
    existingPermissions.splice(0, existingPermissions.length);

    Object.assign(
      namespace,
      await functions.loadNamespaceMetadata(whid.value, namespacePath.value)
    );

    relationId.value = namespace.properties?.namespace_id || "";

    selectedNamespace.value =
      namespace.namespace[namespace.namespace.length - 1];

    permissionObject.id = namespace.properties?.namespace_id || "";
    Object.assign(
      myAccess,
      await functions.getNamespaceAccessById(
        namespace.properties?.namespace_id || ""
      )
    );
    can_read_permissions.value = myAccess.includes("read_assignments")
      ? true
      : false;

    Object.assign(
      existingPermissions,
      can_read_permissions.value
        ? await functions.getNamespaceAssignmentsById(
            namespace.properties?.namespace_id || ""
          )
        : []
    );
    loaded.value = true;
    await Promise.all([
      listNamespaces(),
      listTables(),
      listViews(),
      listDeletedTabulars(),
    ]);
  } catch (error) {
    console.error(error);
  }
}

async function listNamespaces() {
  try {
    const { namespaces } = await functions.listNamespaces(
      visual.whId,
      namespacePath.value
    );

    //remove later not needed

    // console.log(namespaceMap, namespaces);
    // if (namespaceMap) {
    //   for (const [_, value] of Object.entries(namespaceMap)) {
    //     namespaceId.value = value as string;
    //     if (parent) Object.assign(myAccessParent, myAccess);
    //     Object.assign(
    //       myAccess,
    //       await functions.getNamespaceAccessById(value as string)
    //     );
    //   }
    // }

    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: "namespace",
        parentPath: [...nsArray],
        actions: ["delete"],
      }));

      loadedNamespaces.splice(0, loadedNamespaces.length);
      Object.assign(loadedNamespaces, mappedItems);
    }
  } catch (error) {
    console.error(error);
  }
}

async function listTables() {
  try {
    loadedTables.splice(0, loadedTables.length);
    const data = await functions.listTables(visual.whId, namespacePath.value);

    Object.assign(loadedTables, data.identifiers);
    loadedTables.every((table) => {
      table.actions = ["delete"];
      table.type = "table";
    });
  } catch (error) {
    console.error(error);
  }
}

async function listViews() {
  try {
    loadedViews.splice(0, loadedViews.length);
    const data = await functions.listViews(visual.whId, namespacePath.value);

    Object.assign(loadedViews, data.identifiers);
    loadedViews.every((table) => {
      table.actions = ["delete"];
      table.type = "view";
    });
  } catch (error) {
    console.error(error);
  }
}

async function dropView(item: TableIdentifierExtended) {
  try {
    loading.value = true;
    await functions.dropView(visual.whId, namespacePath.value, item.name);

    await listViews();
  } catch (error: any) {
    console.error(`Failed to drop view-${item.name}  - `, error);
  } finally {
    loading.value = false;
  }
}
async function listDeletedTabulars() {
  try {
    deletedTabulars.splice(0, deletedTabulars.length);
    const data = await functions.listDeletedTabulars(
      visual.whId,
      namespace_id.value || ""
    );

    Object.assign(deletedTabulars, data.tabulars);
    deletedTabulars.every((table) => {
      table.actions = ["delete"];
    });
  } catch (error) {
    console.error(error);
  }
}

async function dropNamespace(item: Item) {
  try {
    const res = await functions.dropNamespace(
      whid.value,
      item.parentPath.join(String.fromCharCode(0x1f))
    );
    if (res.error) throw res.error;

    await listNamespaces();
  } catch (error: any) {
    console.error(`Failed to drop namespace-${item.name}  - `, error);
  }
}
async function routeToNamespace(item: Item) {
  if (item.type !== "namespace") {
    return;
  }

  namespacePath.value =
    item.parentPath.length > 0
      ? `${item.parentPath.join(String.fromCharCode(0x1f))}`
      : item.name;
  visual.namespacePath = namespacePath.value;
  router.push(`/warehouse/${visual.whId}/namespace/${namespacePath.value}`);
}

async function routeToTable(item: TableIdentifierExtended) {
  router.push(
    `/warehouse/${visual.whId}/namespace/${
      namespacePath.value
    }/table/${encodeURIComponent(item.name)}`
  );
}

async function routeToView(item: TableIdentifierExtended) {
  router.push(
    `/warehouse/${visual.whId}/namespace/${
      namespacePath.value
    }/view/${encodeURIComponent(item.name)}`
  );
}

async function addNamespace(namespace: string[]) {
  const res = await functions.createNamespace(whid.value, namespace);
  if (res.error) throw res.error;

  await listNamespaces();
}

watch(
  () => watchedNamespacePath.value,
  async (newNsid, oldNsid) => {
    namespacePath.value = newNsid;
    relationId.value = namespace.properties?.namespace_id || "";

    await init();
  }
);

async function assign(permissions: {
  del: AssignmentCollection;
  writes: AssignmentCollection;
}) {
  try {
    const del = permissions.del as NamespaceAssignment[];
    const writes = permissions.writes as NamespaceAssignment[];

    await functions.updateNamespaceAssignmentsById(
      relationId.value,
      del,
      writes
    );
    await init();
  } catch (error) {
    console.error(error);

    await init();
  }
}

async function dropTable(item: TableIdentifierExtended) {
  try {
    loading.value = true;

    await functions.dropTable(visual.whId, namespacePath.value, item.name);

    await listTables();
    loading.value = true;
  } catch (error: any) {
    console.error(`Failed to drop table-${item.name}  - `, error);
  } finally {
    loading.value = false;
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
