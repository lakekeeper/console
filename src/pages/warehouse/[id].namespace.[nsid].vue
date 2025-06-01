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
        <BreadcrumbsFromUrl :url="route.fullPath" />
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{
                namespacePath.length > 0
                  ? namespacePath.split(String.fromCharCode(0x1f)).join('.')
                  : selectedNamespace
              }}
            </span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-folder-open</v-icon>
          </template>
          <v-spacer></v-spacer>

          <AddNamespaceDialog
            v-if="myAccess.includes('create_namespace')"
            :parent-path="namespacePath"
            :status-intent="addNamespaceStatus"
            @add-namespace="addNamespace" />
        </v-toolbar>
        <v-tabs v-model="tab">
          <v-tab value="namespaces" @click="loadTabData">namespaces</v-tab>
          <v-tab value="tables" @click="loadTabData">tables</v-tab>
          <v-tab value="views" @click="loadTabData">views</v-tab>
          <v-tab value="deleted" @click="loadTabData">deleted</v-tab>
          <v-tab
            v-if="canReadPermissions && enabledAuthentication && enabledPermissions"
            value="permissions">
            Permissions
          </v-tab>
          <v-tab value="details">Details</v-tab>
        </v-tabs>
        <v-card>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="namespaces">
              <v-data-table
                height="65vh"
                items-per-page="50"
                :search="searchNamespace"
                fixed-header
                :headers="headers"
                hover
                :items="loadedNamespaces"
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
                        recursiveDeleteProtection
                          ? 'Recursive Delete Protection enabled'
                          : 'Recursive Delete Protection disabled'
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
                    :type="item.type"
                    :name="item.name"
                    @delete-with-options="deleteNamespaceWithOptions($event, item)"></DialogDelete>
                </template>
                <template #no-data>
                  <AddNamespaceDialog
                    v-if="myAccess.includes('create_namespace')"
                    :parent-path="namespacePath"
                    :status-intent="StatusIntent.STARTING"
                    @add-namespace="addNamespace" />
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="tables">
              <v-data-table
                height="65vh"
                items-per-page="50"
                :search="searchTbl"
                fixed-header
                :items-per-page-options="[
                  { title: '50 items', value: 50 },
                  { title: '100 items', value: 100 },
                ]"
                @update:options="paginationCheckTables($event)"
                :headers="headers"
                hover
                :items="loadedTables"
                :sort-by="[{ key: 'name', order: 'asc' }]">
                <template #top>
                  <v-toolbar color="transparent" density="compact" flat>
                    <v-spacer></v-spacer>
                    <v-text-field
                      v-model="searchTbl"
                      label="Search"
                      prepend-inner-icon="mdi-magnify"
                      variant="underlined"
                      hide-details
                      clearable
                      single-line></v-text-field>
                  </v-toolbar>
                </template>
                <template #item.name="{ item }">
                  <td class="pointer-cursor" @click="routeToTable(item)">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-table</v-icon>
                      {{ item.name }}
                    </span>
                  </td>
                </template>
                <template #item.actions="{ item }">
                  <DialogDelete
                    v-if="item.type === 'table'"
                    :type="item.type"
                    :name="item.name"
                    @delete-table-with-options="
                      deleteTableWithOptions($event, item)
                    "></DialogDelete>
                </template>
                <template #no-data>
                  <div>No tables in this namespace</div>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="views">
              <v-data-table
                items-per-page="50"
                height="65vh"
                :search="searchView"
                fixed-header
                :headers="headers"
                hover
                :items="loadedViews"
                :sort-by="[{ key: 'name', order: 'asc' }]"
                :items-per-page-options="[
                  { title: '50 items', value: 50 },
                  { title: '100 items', value: 100 },
                ]"
                @update:options="paginationCheckViews($event)">
                <template #item.name="{ item }">
                  <td class="pointer-cursor" @click="routeToView(item)">
                    <span class="icon-text">
                      <v-icon class="mr-2">mdi-view-grid-outline</v-icon>
                      {{ item.name }}
                    </span>
                  </td>
                </template>
                <template #top>
                  <v-toolbar color="transparent" density="compact" flat>
                    <v-spacer></v-spacer>
                    <v-text-field
                      v-model="searchView"
                      label="Search"
                      prepend-inner-icon="mdi-magnify"
                      variant="underlined"
                      hide-details
                      clearable
                      single-line></v-text-field>
                  </v-toolbar>
                </template>
                <template #item.actions="{ item }">
                  <DialogDelete
                    v-if="item.type === 'view'"
                    :type="item.type"
                    :name="item.name"
                    @delete-view-with-options="deleteViewWithOptions($event, item)"></DialogDelete>
                </template>
                <template #no-data>
                  <div>No views in this namespace</div>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="deleted">
              <v-data-table
                height="65vh"
                fixed-header
                :headers="headersDeleted"
                hover
                :items="deletedTabulars"
                :sort-by="[{ key: 'name', order: 'asc' }]">
                <template #item.name="{ item }">
                  <td class="pointer-cursor">
                    <span class="icon-text">
                      <v-icon v-if="item.type == 'view'" class="mr-2">mdi-view-grid-outline</v-icon>
                      <v-icon v-else class="mr-2">mdi-table</v-icon>
                      {{ item.name }} {{ item.type }}
                    </span>
                  </td>
                </template>
                <template #item.deleted-at="{ item }">
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <span v-bind="props">
                        {{ formatDistanceToNow(parseISO(item['deleted-at']), { addSuffix: true }) }}
                      </span>
                    </template>
                    {{ parseISO(item['deleted-at']) }}
                  </v-tooltip>
                </template>
                <template #item.expiration-date="{ item }">
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <span v-bind="props">
                        {{
                          formatDistanceToNow(parseISO(item['expiration-date']), {
                            addSuffix: true,
                          })
                        }}
                      </span>
                    </template>
                    {{ parseISO(item['expiration-date']) }}
                  </v-tooltip>
                </template>
                <template #item.actions="{ item }">
                  <v-icon color="error" @click="undropTabular(item)">mdi-restore</v-icon>
                </template>
                <template #no-data>
                  <div>No deleted tabulars in this namespace</div>
                </template>
              </v-data-table>
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
<script lang="ts" setup>
import { useRoute } from 'vue-router'; // Import the useRoute function from vue-router
import { useVisualStore } from '../../stores/visual';
import { useFunctions } from '../../plugins/functions';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import router from '../../router';
import { AssignmentCollection, Header, Item, Options, RelationType } from '../../common/interfaces';

import {
  DeletedTabularResponse,
  NamespaceAction,
  NamespaceAssignment,
  WarehouseAssignment,
} from '../../gen/management/types.gen';
import { GetNamespaceResponse, TableIdentifier } from '../../gen/iceberg/types.gen';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';
import {
  PermissionManager,
  AddNamespaceDialog,
  BreadcrumbsFromUrl,
  DialogDelete,
  AppFunctions,
  FUNCTIONS_INJECTION_KEY,
} from '@lakekeeper/console-components';

const visual = useVisualStore();
const route = useRoute();
const functions = useFunctions();
const loading = ref(true);
const loaded = ref(false);
const canReadPermissions = ref(false);
const recursiveDeleteProtection = ref(false);
const addNamespaceStatus = ref(StatusIntent.INACTIVE);
const searchNamespace = ref('');
const searchTbl = ref('');
const searchView = ref('');

const paginationTokenTbl = ref('');
const paginationTokenView = ref('');
const paginationTokenNamespace = ref('');
const items: Item[] = reactive([]);
const permissionType = ref<RelationType>('namespace');
const existingPermissions = reactive<WarehouseAssignment[]>([]);
// const namespaceId = ref<string>("");

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const headersDeleted: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  {
    title: 'Deleted',
    key: 'deleted-at',
    align: 'start',
    value: (item: any) => formatDistanceToNow(parseISO(item['deleted-at']), { addSuffix: true }),
  },
  {
    title: 'Expires',
    key: 'expiration-date',
    align: 'start',
    value: (item: any) =>
      formatDistanceToNow(parseISO(item['expiration-date']), { addSuffix: true }),
  },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const loadedNamespaces: Item[] = reactive([]);
export type TableIdentifierExtended = TableIdentifier & {
  actions: string[];
  id: string;
  type: string;
};

type DeletedTabularResponseExtended = DeletedTabularResponse & {
  actions: string[];
  type: string;
};
const loadedTables: TableIdentifierExtended[] = reactive([]);
const loadedViews: TableIdentifierExtended[] = reactive([]);
const deletedTabulars: DeletedTabularResponseExtended[] = reactive([]);

const assignStatus = ref(StatusIntent.INACTIVE);

const relationId = ref('');
const selectedNamespace = ref('');
const namespacePath = ref<string>((route.params as { nsid: string }).nsid);
const watchedNamespacePath = computed(() => namespacePath.value);
const whid = ref<string>((route.params as { id: string }).id);
const tab = ref('overview');
const myAccess = reactive<NamespaceAction[]>([]);
// const myAccessParent = reactive<NamespaceAction[]>([]);
const namespace = reactive<GetNamespaceResponse>({
  namespace: [],
});
const namespaceId = computed(() => namespace.properties?.namespace_id);
const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

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
  // ...(functions.getWarehouseById && { getWarehouseById: functions.getWarehouseById }),
  ...(functions.getWarehouse && { getWarehouse: functions.getWarehouse }),
  ...(functions.getNamespaceById && { getNamespaceById: functions.getNamespaceById }),
};

// Provide functions to child components
provide(FUNCTIONS_INJECTION_KEY, appFunctions);

onMounted(async () => {
  await init();
  loading.value = false;
});

onUnmounted(() => {
  items.splice(0, items.length);
});

async function deleteTableWithOptions(e: any, item: TableIdentifierExtended) {
  try {
    await functions.dropTable(visual.whId, namespacePath.value, item.name, e);

    await listTables();
  } catch (error: any) {
    console.error(`Failed to drop table-${item.name}  - `, error);
  }
}

async function deleteViewWithOptions(e: any, item: TableIdentifierExtended) {
  try {
    await functions.dropView(visual.whId, namespacePath.value, item.name, e);

    await listViews();
  } catch (error: any) {
    console.error(`Failed to drop view-${item.name}  - `, error);
  }
}

async function deleteNamespaceWithOptions(e: any, item: Item) {
  try {
    const res = await functions.dropNamespace(
      whid.value,
      item.parentPath.join(String.fromCharCode(0x1f)),
      e,
    );
    if (res.error) throw res.error;

    await listNamespaces();
  } catch (error: any) {
    console.error(`Failed to drop namespace-${item.name}  - `, error);
  }
}

async function loadTabData() {
  if (tab.value === 'namespaces') {
    await listNamespaces();
  } else if (tab.value === 'permissions') {
    await init();
  } else if (tab.value === 'tables') {
    await listTables();
  } else if (tab.value === 'views') {
    await listViews();
  } else if (tab.value === 'deleted') {
    await listDeletedTabulars();
  }
}

async function init() {
  try {
    const serverInfo = await functions.getServerInfo();
    loaded.value = false;
    existingPermissions.splice(0, existingPermissions.length);

    Object.assign(
      namespace,
      await functions.loadNamespaceMetadata(whid.value, namespacePath.value),
    );
    await getProtection();
    relationId.value = namespace.properties?.namespace_id || '';

    selectedNamespace.value = namespace.namespace[namespace.namespace.length - 1];

    permissionObject.id = namespace.properties?.namespace_id || '';

    if (serverInfo['authz-backend'] != 'allow-all') {
      Object.assign(
        myAccess,
        await functions.getNamespaceAccessById(namespace.properties?.namespace_id || ''),
      );
      canReadPermissions.value = !!myAccess.includes('read_assignments');

      Object.assign(
        existingPermissions,
        canReadPermissions.value
          ? await functions.getNamespaceAssignmentsById(namespace.properties?.namespace_id || '')
          : [],
      );
    }
    loaded.value = true;
    await Promise.all([listNamespaces(), listTables(), listViews(), listDeletedTabulars()]);
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheckTables(option: Options) {
  if (loadedTables.length >= 10000) return;

  if (option.page * option.itemsPerPage == loadedTables.length && paginationTokenTbl.value != '') {
    const loadedTablesTmp: TableIdentifierExtended[] = [];
    const data = await functions.listTables(
      visual.whId,
      namespacePath.value,
      paginationTokenTbl.value,
    );
    Object.assign(loadedTablesTmp, data.identifiers);
    paginationTokenTbl.value = data['next-page-token'] || '';
    loadedTablesTmp.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'table';
    });

    loadedTables.push(...loadedTablesTmp.flat());
  }
}

async function paginationCheckViews(option: Options) {
  if (loadedViews.length >= 10000) return;

  if (option.page * option.itemsPerPage == loadedViews.length && paginationTokenView.value != '') {
    const loadedViewsTmp: TableIdentifierExtended[] = [];
    const data = await functions.listViews(
      visual.whId,
      namespacePath.value,
      paginationTokenView.value,
    );
    Object.assign(loadedViewsTmp, data.identifiers);
    paginationTokenTbl.value = data['next-page-token'] || '';
    loadedViewsTmp.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'view';
    });

    loadedViews.push(...loadedViewsTmp.flat());
  }
}

async function paginationCheckNamespace(option: Options) {
  if (loadedNamespaces.length >= 10000) return;

  if (
    option.page * option.itemsPerPage == loadedNamespaces.length &&
    paginationTokenNamespace.value != ''
  ) {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      visual.whId,
      namespacePath.value,
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

      loadedNamespaces.push(...mappedItems.flat());
    }
  }
}

async function listNamespaces() {
  try {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      visual.whId,
      namespacePath.value,
    );

    paginationTokenNamespace.value = nextPageToken || '';
    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
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

    if (data['next-page-token']) {
      paginationTokenTbl.value = data['next-page-token'];
    }
    loadedTables.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'table';
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

    if (data['next-page-token']) {
      paginationTokenView.value = data['next-page-token'];
    }
    loadedViews.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'view';
    });
  } catch (error) {
    console.error(error);
  }
}

async function listDeletedTabulars() {
  try {
    deletedTabulars.splice(0, deletedTabulars.length);
    const data = await functions.listDeletedTabulars(visual.whId, namespaceId.value || '');

    Object.assign(deletedTabulars, data.tabulars);
    deletedTabulars.forEach((table) => {
      table.actions = ['delete'];
    });
  } catch (error) {
    console.error(error);
  }
}

async function routeToNamespace(item: Item) {
  if (item.type !== 'namespace') {
    return;
  }

  namespacePath.value =
    item.parentPath.length > 0 ? `${item.parentPath.join(String.fromCharCode(0x1f))}` : item.name;
  visual.namespacePath = namespacePath.value;
  router.push(`/warehouse/${visual.whId}/namespace/${namespacePath.value}`);
}

async function routeToTable(item: TableIdentifierExtended) {
  router.push(
    `/warehouse/${visual.whId}/namespace/${
      namespacePath.value
    }/table/${encodeURIComponent(item.name)}`,
  );
}

async function routeToView(item: TableIdentifierExtended) {
  router.push(
    `/warehouse/${visual.whId}/namespace/${
      namespacePath.value
    }/view/${encodeURIComponent(item.name)}`,
  );
}

async function addNamespace(namespaceIdent: string[]) {
  try {
    addNamespaceStatus.value = StatusIntent.STARTING;

    const res = await functions.createNamespace(whid.value, namespaceIdent);
    if (res.error) throw res.error;

    await listNamespaces();
    addNamespaceStatus.value = StatusIntent.SUCCESS;
  } catch (error) {
    addNamespaceStatus.value = StatusIntent.FAILURE;
    console.error(error);
  }
}

watch(
  () => watchedNamespacePath.value,
  async (newNsid) => {
    namespacePath.value = newNsid;
    relationId.value = namespace.properties?.namespace_id || '';

    await init();
  },
);

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as NamespaceAssignment[];
    const writes = permissions.writes as NamespaceAssignment[];

    await functions.updateNamespaceAssignmentsById(relationId.value, del, writes);
    assignStatus.value = StatusIntent.SUCCESS;
    loaded.value = true;
    await init();
  } catch (error) {
    assignStatus.value = StatusIntent.FAILURE;
    console.error(error);

    await init();
  }
}

async function undropTabular(item: DeletedTabularResponseExtended) {
  try {
    loading.value = true;
    await functions.undropTabular(visual.whId, item.id, item.typ);
    loading.value = true;
    await listDeletedTabulars();
  } catch (error: any) {
    console.error(`Failed to undrop table-${item.name}  - due to: `, error);
  } finally {
    loading.value = false;
  }
}
async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getNamespaceProtection(whid.value, namespaceId.value || '')
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setNamespaceProtection(
      whid.value,
      namespaceId.value || '',
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error(error);
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
